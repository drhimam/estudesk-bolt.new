import { eq, desc, and, or } from 'drizzle-orm';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import * as schema from './db/schema';
import { initBetterAuth } from './auth/auth';
import { verifyTurnstileToken } from './auth/turnstile';
import { runAIRouter, GenerationRequest } from './ai/router';
import {
  getNotificationPreferences,
  updateNotificationPreferences,
  getNotificationLogs,
  sendTestEmailNotification,
  sendWeeklyDigestForUser,
  processDeadlineAlerts,
  processScheduledWeeklyDigests,
  checkRateLimit,
} from './email/notifications';
import * as billing from './billing/billing';
import * as userOps from './user/user';

export type Bindings = {
  TURSO_DATABASE_URL?: string;
  TURSO_AUTH_TOKEN?: string;
  DATABASE_URL?: string;
  BETTER_AUTH_SECRET: string;
  TRUSTED_ORIGINS?: string;
  CLOUDFLARE_TURNSTILE_SECRET_KEY?: string;
  TURNSTILE_SECRET_KEY?: string;
  R2_BUCKET?: unknown;
  AI_PROVIDER?: string;
  AI_API_KEY?: string;
  AI_BASE_URL?: string;
  AI_MODEL?: string;
  DEEPSEEK_API_KEY?: string;
  OPENAI_API_KEY?: string;
  GEMINI_API_KEY?: string;
  ZEPTOMAIL_API_KEY?: string;
  ZEPTOMAIL_API_URL?: string;
  EMAIL_FROM_ADDRESS?: string;
  EMAIL_FROM_NAME?: string;
  FRONTEND_URL?: string;
  PAYPAL_CLIENT_ID?: string;
  PAYPAL_CLIENT_SECRET?: string;
  PAYPAL_ENVIRONMENT?: string;
  PAYPAL_WEBHOOK_ID?: string;
  VITE_PAYPAL_CLIENT_ID?: string;
};

const app = new Hono<{ Bindings: Bindings }>();

// Helper to initialize Turso libSQL client and Drizzle instance
function getDb(env: Bindings) {
  const url = env.TURSO_DATABASE_URL || env.DATABASE_URL || 'file:local.db';
  const authToken = env.TURSO_AUTH_TOKEN;
  const client = createClient({ url, authToken });
  const db = drizzle(client, { schema });
  return { client, db };
}

// Middleware
app.use('*', logger());
app.use('*', cors({
  origin: (origin) => origin || '*',
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization', 'Idempotency-Key', 'Cookie'],
  exposeHeaders: ['Set-Cookie'],
  credentials: true,
}));

// Health Check Endpoints
app.get('/health', (c) => {
  return c.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/ready', async (c) => {
  try {
    const url = c.env.TURSO_DATABASE_URL || c.env.DATABASE_URL;
    if (!url) {
      return c.json({ status: 'degraded', db: 'unconfigured' }, 503);
    }
    const { client } = getDb(c.env);
    await client.execute('SELECT 1');
    return c.json({ status: 'ready', db: 'connected (turso)', timestamp: new Date().toISOString() });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return c.json({ status: 'error', db: msg }, 500);
  }
});

app.get('/metrics', (c) => {
  return c.text(
    `# HELP estudesk_requests_total Total HTTP requests\n# TYPE estudesk_requests_total counter\nestudesk_requests_total 1\n`
  );
});

// Cloudflare Turnstile Verification Endpoint
app.post('/api/auth/verify-turnstile', async (c) => {
  try {
    const body = await c.req.json<{ token?: string }>();
    const token = body?.token;

    if (!token) {
      return c.json({ success: false, error: 'Turnstile token is required.' }, 400);
    }

    const secretKey =
      c.env.CLOUDFLARE_TURNSTILE_SECRET_KEY ||
      c.env.TURNSTILE_SECRET_KEY;
    const remoteIp =
      c.req.header('cf-connecting-ip') ||
      c.req.header('x-forwarded-for')?.split(',')[0].trim();

    const result = await verifyTurnstileToken(token, secretKey, remoteIp);

    if (!result.success) {
      return c.json(
        {
          success: false,
          error: result.error || 'Bot verification challenge failed.',
          errorCodes: result.errorCodes,
        },
        400
      );
    }

    return c.json({
      success: true,
      challengeTs: result.challengeTs,
      hostname: result.hostname,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return c.json({ success: false, error: msg }, 500);
  }
});

// Better Auth Route Handler
app.on(['POST', 'GET'], '/api/auth/*', (c) => {
  const { db } = getDb(c.env);
  const baseURL = new URL(c.req.url).origin;
  const extraOrigins = c.env.TRUSTED_ORIGINS
    ? c.env.TRUSTED_ORIGINS.split(',').map((o) => o.trim()).filter(Boolean)
    : [];
  const auth = initBetterAuth(db, c.env.BETTER_AUTH_SECRET || 'default-secret', baseURL, extraOrigins, c.env);
  return auth.handler(c.req.raw);
});


// Folders / Semesters endpoints (Turso DB)
app.get('/api/folders', async (c) => {
  try {
    const userId = c.req.query('userId');
    const { db } = getDb(c.env);
    const result = userId
      ? await db.select().from(schema.folders).where(eq(schema.folders.userId, userId))
      : await db.select().from(schema.folders);
    return c.json({ data: result });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return c.json({ data: [], error: msg });
  }
});

app.post('/api/folders', async (c) => {
  try {
    const body = await c.req.json<{ id?: string; name: string; color?: string; userId?: string; isPinned?: boolean }>();
    if (!body.name) return c.json({ error: 'Folder name is required' }, 400);
    if (!body.userId) {
      return c.json({ error: 'Unauthorized: You must be signed in to sync folders' }, 401);
    }
    const { db } = getDb(c.env);

    const newFolder = {
      id: body.id || crypto.randomUUID(),
      userId: body.userId,
      name: body.name.trim().toUpperCase(),
      color: body.color || '#4F46E5',
      isPinned: body.isPinned || false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await db.insert(schema.folders).values(newFolder);
    return c.json({ data: newFolder }, 201);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return c.json({ error: msg }, 500);
  }
});

app.put('/api/folders/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const body = await c.req.json<{ name?: string; color?: string; isPinned?: boolean }>();
    const { db } = getDb(c.env);
    const updates: Record<string, unknown> = { updatedAt: new Date() };
    if (body.name) updates.name = body.name.trim().toUpperCase();
    if (body.color !== undefined) updates.color = body.color;
    if (body.isPinned !== undefined) updates.isPinned = body.isPinned;

    await db.update(schema.folders).set(updates).where(eq(schema.folders.id, id));
    return c.json({ success: true });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return c.json({ error: msg }, 500);
  }
});

app.delete('/api/folders/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const { db } = getDb(c.env);
    await db.delete(schema.subjects).where(eq(schema.subjects.folderId, id));
    await db.delete(schema.folders).where(eq(schema.folders.id, id));
    return c.json({ success: true });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return c.json({ error: msg }, 500);
  }
});

// Subjects endpoints (Turso DB)
app.get('/api/subjects', async (c) => {
  try {
    const userId = c.req.query('userId');
    const { db } = getDb(c.env);
    const result = userId
      ? await db.select().from(schema.subjects).where(eq(schema.subjects.userId, userId))
      : await db.select().from(schema.subjects);
    return c.json({ data: result });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return c.json({ data: [], error: msg });
  }
});

app.post('/api/subjects', async (c) => {
  try {
    const body = await c.req.json<{ id?: string; semesterId?: string; folderId?: string; name: string; color?: string; userId?: string }>();
    const folderId = body.folderId || body.semesterId;
    if (!folderId || !body.name) return c.json({ error: 'Folder ID and Subject name are required' }, 400);
    if (!body.userId) {
      return c.json({ error: 'Unauthorized: You must be signed in to sync subjects' }, 401);
    }
    const { db } = getDb(c.env);

    const newSubject = {
      id: body.id || crypto.randomUUID(),
      folderId: folderId,
      userId: body.userId,
      name: body.name.trim(),
      color: body.color || 'teal',
      isPinned: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await db.insert(schema.subjects).values(newSubject);
    return c.json({ data: newSubject }, 201);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return c.json({ error: msg }, 500);
  }
});

app.put('/api/subjects/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const body = await c.req.json<{ name?: string; color?: string; isPinned?: boolean }>();
    const { db } = getDb(c.env);
    const updates: Record<string, unknown> = { updatedAt: new Date() };
    if (body.name) updates.name = body.name.trim();
    if (body.color !== undefined) updates.color = body.color;
    if (body.isPinned !== undefined) updates.isPinned = body.isPinned;

    await db.update(schema.subjects).set(updates).where(eq(schema.subjects.id, id));
    return c.json({ success: true });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return c.json({ error: msg }, 500);
  }
});

app.delete('/api/subjects/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const { db } = getDb(c.env);
    await db.delete(schema.subjects).where(eq(schema.subjects.id, id));
    return c.json({ success: true });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return c.json({ error: msg }, 500);
  }
});

// Materials endpoints (Turso DB)
app.get('/api/materials', async (c) => {
  try {
    const userId = c.req.query('userId');
    const subjectId = c.req.query('subjectId');
    const { db } = getDb(c.env);
    let query = db.select().from(schema.materials);
    if (userId && subjectId) {
      const result = await query.where(eq(schema.materials.userId, userId));
      return c.json({ data: result.filter((m) => m.subjectId === subjectId) });
    } else if (userId) {
      const result = await query.where(eq(schema.materials.userId, userId));
      return c.json({ data: result });
    } else if (subjectId) {
      const result = await query.where(eq(schema.materials.subjectId, subjectId));
      return c.json({ data: result });
    }
    const result = await query;
    return c.json({ data: result });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return c.json({ data: [], error: msg });
  }
});

app.post('/api/materials', async (c) => {
  try {
    const body = await c.req.json<{
      id?: string;
      subjectId: string;
      userId?: string;
      title: string;
      type: string;
      content: Record<string, unknown>;
      version?: number;
    }>();
    if (!body.title || !body.subjectId || !body.type) {
      return c.json({ error: 'Title, Subject ID, and Type are required' }, 400);
    }
    if (!body.userId) {
      return c.json({ error: 'Unauthorized: You must be signed in to sync materials' }, 401);
    }
    const { db } = getDb(c.env);

    const newMaterial = {
      id: body.id || crypto.randomUUID(),
      subjectId: body.subjectId,
      userId: body.userId,
      title: body.title.trim(),
      type: body.type as schema.MaterialType,
      content: body.content || {},
      version: body.version || 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await db.insert(schema.materials).values(newMaterial);
    return c.json({ data: newMaterial }, 201);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return c.json({ error: msg }, 500);
  }
});

app.put('/api/materials/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const body = await c.req.json<{
      title?: string;
      type?: string;
      content?: Record<string, unknown>;
      version?: number;
    }>();
    const { db } = getDb(c.env);
    const updates: Record<string, unknown> = { updatedAt: new Date() };
    if (body.title) updates.title = body.title.trim();
    if (body.type) updates.type = body.type;
    if (body.content !== undefined) updates.content = body.content;
    if (body.version !== undefined) updates.version = body.version;

    await db.update(schema.materials).set(updates).where(eq(schema.materials.id, id));
    return c.json({ success: true });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return c.json({ error: msg }, 500);
  }
});

app.delete('/api/materials/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const { db } = getDb(c.env);
    await db.delete(schema.materials).where(eq(schema.materials.id, id));
    return c.json({ success: true });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return c.json({ error: msg }, 500);
  }
});

// Deadlines endpoints (Turso DB)
app.get('/api/deadlines', async (c) => {
  try {
    const userId = c.req.query('userId');
    const folderId = c.req.query('folderId');
    const { db } = getDb(c.env);
    let query = db.select().from(schema.deadlines);
    if (userId) {
      const result = await query.where(eq(schema.deadlines.userId, userId));
      return c.json({ data: folderId ? result.filter((d) => d.folderId === folderId) : result });
    }
    const result = await query;
    return c.json({ data: result });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return c.json({ data: [], error: msg });
  }
});

app.post('/api/deadlines', async (c) => {
  try {
    const body = await c.req.json<{
      id?: string;
      folderId: string;
      subjectId?: string | null;
      userId?: string;
      title: string;
      description?: string;
      dueDate: number | string;
      isCompleted?: boolean;
    }>();
    if (!body.title || !body.folderId || !body.dueDate) {
      return c.json({ error: 'Title, Folder ID, and Due Date are required' }, 400);
    }
    if (!body.userId) {
      return c.json({ error: 'Unauthorized: You must be signed in to sync deadlines' }, 401);
    }
    const { db } = getDb(c.env);

    const newDeadline = {
      id: body.id || crypto.randomUUID(),
      folderId: body.folderId,
      subjectId: body.subjectId || null,
      userId: body.userId,
      title: body.title.trim(),
      description: body.description || null,
      dueDate: new Date(body.dueDate),
      isCompleted: body.isCompleted || false,
      completedAt: body.isCompleted ? new Date() : null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await db.insert(schema.deadlines).values(newDeadline);
    return c.json({ data: newDeadline }, 201);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return c.json({ error: msg }, 500);
  }
});

app.put('/api/deadlines/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const body = await c.req.json<{
      title?: string;
      description?: string | null;
      dueDate?: number | string;
      isCompleted?: boolean;
    }>();
    const { db } = getDb(c.env);
    const updates: Record<string, unknown> = { updatedAt: new Date() };
    if (body.title) updates.title = body.title.trim();
    if (body.description !== undefined) updates.description = body.description;
    if (body.dueDate) updates.dueDate = new Date(body.dueDate);
    if (body.isCompleted !== undefined) {
      updates.isCompleted = body.isCompleted;
      updates.completedAt = body.isCompleted ? new Date() : null;
    }

    await db.update(schema.deadlines).set(updates).where(eq(schema.deadlines.id, id));
    return c.json({ success: true });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return c.json({ error: msg }, 500);
  }
});

app.delete('/api/deadlines/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const { db } = getDb(c.env);
    await db.delete(schema.deadlines).where(eq(schema.deadlines.id, id));
    return c.json({ success: true });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return c.json({ error: msg }, 500);
  }
});

// AI Generation Endpoint
app.post('/api/generate', async (c) => {
  const idempotencyKey = c.req.header('Idempotency-Key') || crypto.randomUUID();
  try {
    const body = await c.req.json<Omit<GenerationRequest, 'idempotencyKey'> & { userId?: string }>();
    if (!body.type || !body.prompt) {
      return c.json({ error: 'Missing required parameters: type and prompt' }, 400);
    }

    const userId = c.req.query('userId') || body.userId;
    if (userId) {
      const { db } = getDb(c.env);
      const cost = ['presentation', 'infographic', 'assignment'].includes(body.type) ? 5 : 2;
      const creditRes = await billing.deductUserCredit(db, userId, cost, body.type, `Generated ${body.type}`);
      if (!creditRes.success) {
        return c.json({ error: creditRes.error || 'Insufficient AI generation credits' }, 403);
      }
    }

    const genReq: GenerationRequest = {
      ...body,
      idempotencyKey,
    };

    const routerOutput = await runAIRouter(genReq, c.env);
    return c.json({
      success: true,
      idempotencyKey,
      provider: routerOutput.provider,
      data: routerOutput.result,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return c.json({ error: msg || 'Generation failed' }, 500);
  }
});

// Ask AI Chat Endpoint
app.post('/api/chat', async (c) => {
  try {
    const body = await c.req.json<{
      userId?: string;
      message: string;
      sourceText?: string;
      contextSubjectNames?: string[];
      history?: Array<{ role: 'user' | 'assistant'; content: string }>;
    }>();

    const userId = c.req.query('userId') || body.userId;
    if (userId) {
      const { db } = getDb(c.env);
      const creditRes = await billing.deductUserCredit(db, userId, 1, 'chat', 'Ask AI query');
      if (!creditRes.success) {
        return c.json({ error: creditRes.error || 'Insufficient AI credits' }, 403);
      }
    }

    const apiKey = c.env.AI_API_KEY || c.env.OPENAI_API_KEY || c.env.DEEPSEEK_API_KEY;
    const baseUrl = (c.env.AI_BASE_URL || 'https://api.openai.com/v1').replace(/\/+$/, '');
    const model = c.env.AI_MODEL || 'gpt-4o-mini';

    if (!apiKey) {
      return c.json({
        content: `I am ready to help! Context: ${body.contextSubjectNames?.join(', ') || 'General'}. (Note: Add AI_API_KEY in .env for live completions)`,
      });
    }

    const systemPrompt = `You are eStudesk AI study assistant. Help the student understand topics, answer questions, analyze source notes, and suggest creating flashcards, notes, or quizzes. Keep responses clear, accurate, and structured with clean markdown.`;

    const messages = [
      { role: 'system', content: systemPrompt },
      ...(body.history || []),
      {
        role: 'user',
        content: `Question: ${body.message}${body.sourceText ? `\n\nAttached Source:\n${body.sourceText}` : ''}`,
      },
    ];

    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: model,
        messages: messages,
        temperature: 0.5,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      return c.json({ error: `AI Error ${response.status}: ${errText}` }, 500);
    }

    const resJson = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const aiMessage = resJson.choices?.[0]?.message?.content || 'No response generated.';
    return c.json({ content: aiMessage });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return c.json({ error: msg }, 500);
  }
});

// ==========================================
// Notification & ZeptoMail Endpoints
// ==========================================

// Get user notification preferences
app.get('/api/notifications/preferences', async (c) => {
  try {
    const userId = c.req.query('userId');
    if (!userId) return c.json({ error: 'User ID is required' }, 400);

    const { db } = getDb(c.env);
    const prefs = await getNotificationPreferences(db, userId);

    const [testLimit, digestLimit] = await Promise.all([
      checkRateLimit(db, userId, 'test_email'),
      checkRateLimit(db, userId, 'weekly_digest_preview'),
    ]);

    return c.json({
      data: prefs,
      limits: {
        testEmail: {
          allowed: testLimit.allowed,
          nextAllowedAt: testLimit.nextAllowedAt ? testLimit.nextAllowedAt.toISOString() : null,
          remainingDays: testLimit.remainingDays ?? 0,
        },
        digestPreview: {
          allowed: digestLimit.allowed,
          nextAllowedAt: digestLimit.nextAllowedAt ? digestLimit.nextAllowedAt.toISOString() : null,
          remainingDays: digestLimit.remainingDays ?? 0,
        },
      },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return c.json({ error: msg }, 500);
  }
});

// Update user notification preferences
app.put('/api/notifications/preferences', async (c) => {
  try {
    const body = await c.req.json<{
      userId: string;
      weeklyDigestEnabled?: boolean;
      weeklyDigestDay?: string;
      weeklyDigestTime?: string;
      deadlineAlertEnabled?: boolean;
      deadlineAlertHoursBefore?: number;
      timezone?: string;
      emailFormat?: 'html' | 'plain';
    }>();

    if (!body.userId) return c.json({ error: 'User ID is required' }, 400);

    const { db } = getDb(c.env);
    const updated = await updateNotificationPreferences(db, body.userId, body);
    return c.json({ data: updated });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return c.json({ error: msg }, 500);
  }
});

// Get recent notification logs for user
app.get('/api/notifications/logs', async (c) => {
  try {
    const userId = c.req.query('userId');
    if (!userId) return c.json({ error: 'User ID is required' }, 400);

    const { db } = getDb(c.env);
    const logs = await getNotificationLogs(db, userId, 20);
    return c.json({ data: logs });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return c.json({ error: msg }, 500);
  }
});

// Send a test email via Zoho ZeptoMail Canada (1 per month per user limit)
app.post('/api/notifications/test-email', async (c) => {
  try {
    const body = await c.req.json<{ userId: string; email: string; name?: string }>();
    if (!body.email) return c.json({ error: 'Recipient email is required' }, 400);

    const { db } = getDb(c.env);
    const user = {
      id: body.userId || 'test_user',
      name: body.name || body.email.split('@')[0],
      email: body.email,
    };

    const result = await sendTestEmailNotification(db, c.env, user);
    return c.json({
      success: result.success,
      messageId: result.messageId,
      error: result.error,
      gateway: 'eStudesk Cloud Mail',
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return c.json({ error: msg }, 500);
  }
});

// Trigger Weekly Deadline Digest manually or via cron
app.post('/api/notifications/send-digest', async (c) => {
  try {
    const body = await c.req.json<{ userId: string; isPreview?: boolean }>();
    if (!body.userId) return c.json({ error: 'User ID is required' }, 400);

    const { db } = getDb(c.env);
    const isPreview = body.isPreview !== undefined ? body.isPreview : true;
    const result = await sendWeeklyDigestForUser(db, c.env, body.userId, isPreview);
    return c.json({
      success: result.success,
      messageId: result.messageId,
      error: result.error,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return c.json({ error: msg }, 500);
  }
});

// Trigger 24h Deadline Alerts scan
app.post('/api/notifications/send-deadline-alerts', async (c) => {
  try {
    const { db } = getDb(c.env);
    const result = await processDeadlineAlerts(db, c.env);
    return c.json({ success: true, processedCount: result.processedCount });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return c.json({ error: msg }, 500);
  }
});

// Trigger Scheduled Weekly Digests scan across all matching users
app.post('/api/notifications/send-scheduled-digests', async (c) => {
  try {
    const { db } = getDb(c.env);
    const result = await processScheduledWeeklyDigests(db, c.env);
    return c.json({ success: true, dispatchedCount: result.dispatched });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return c.json({ error: msg }, 500);
  }
});

// ==========================================
// Billing, Subscriptions & PayPal Endpoints
// ==========================================

// Get Public PayPal Configuration
app.get('/api/billing/config', (c) => {
  const clientId = c.env.PAYPAL_CLIENT_ID || c.env.VITE_PAYPAL_CLIENT_ID || '';
  const environment = c.env.PAYPAL_ENVIRONMENT || 'sandbox';
  return c.json({
    clientId,
    environment,
    isConfigured: Boolean(clientId),
  });
});

// Get All Database-Driven Subscription Plans
app.get('/api/billing/plans', async (c) => {
  try {
    const { db } = getDb(c.env);
    const plans = await billing.getSubscriptionPlans(db);
    return c.json({ data: plans });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return c.json({ data: billing.DEFAULT_PLANS, error: msg });
  }
});

// Get User Active Subscription, Credit Balance & Recent Usage
app.get('/api/billing/subscription', async (c) => {
  try {
    const userId = c.req.query('userId');
    if (!userId) return c.json({ error: 'User ID is required' }, 400);

    const { db } = getDb(c.env);
    const details = await billing.getUserSubscriptionDetails(db, userId);
    if (!details) {
      return c.json({
        tier: 'free',
        planId: 'free',
        creditBalance: 100,
        monthlyQuotaLimit: 100,
        subscription: null,
        recentTransactions: [],
      });
    }
    return c.json({ data: details });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return c.json({ error: msg }, 500);
  }
});

// Authoritative Server-to-Server PayPal Subscription Verification & Pro Activation
app.post('/api/billing/verify-paypal-subscription', async (c) => {
  try {
    const body = await c.req.json<{
      subscriptionId: string;
      planId: string;
      userId: string;
    }>();

    if (!body.subscriptionId || !body.planId || !body.userId) {
      return c.json({ error: 'Missing required parameters: subscriptionId, planId, userId' }, 400);
    }

    const { db } = getDb(c.env);

    // 1. Authoritative PayPal server verification
    const verification = await billing.verifyPayPalSubscription(c.env, body.subscriptionId);
    if (!verification.valid) {
      return c.json({ error: verification.error || 'PayPal subscription could not be verified.' }, 403);
    }

    // 2. Fetch plan details
    const plan = await db
      .select()
      .from(schema.subscriptionPlans)
      .where(eq(schema.subscriptionPlans.id, body.planId))
      .get();

    const planName = plan?.name || 'Pro Plan';
    const durationMonths = plan?.durationMonths || 1;
    const priceAmount = plan?.priceAmount || 9.99;
    const creditsToGrant = (plan?.aiCreditsMonthly || 1000) * durationMonths;

    const periodStart = new Date();
    const periodEnd = verification.nextBillingTime
      ? new Date(verification.nextBillingTime)
      : new Date(Date.now() + durationMonths * 30 * 24 * 60 * 60 * 1000);

    // 3. Upsert Active Subscription Record in Turso DB (Strict 1:1 row per user)
    const existingSub = await db
      .select()
      .from(schema.subscriptions)
      .where(eq(schema.subscriptions.userId, body.userId))
      .get();

    const subId = existingSub?.id || crypto.randomUUID();

    if (existingSub) {
      await db
        .update(schema.subscriptions)
        .set({
          planId: body.planId,
          paypalSubscriptionId: body.subscriptionId,
          paypalPayerId: verification.subscriberEmail || null,
          status: 'active',
          billingCycle: plan?.billingCycle || 'monthly',
          currentPeriodStart: periodStart,
          currentPeriodEnd: periodEnd,
          cancelAtPeriodEnd: false,
          canceledAt: null,
          updatedAt: periodStart,
        })
        .where(eq(schema.subscriptions.id, existingSub.id));
    } else {
      await db.insert(schema.subscriptions).values({
        id: subId,
        userId: body.userId,
        planId: body.planId,
        paypalSubscriptionId: body.subscriptionId,
        paypalPayerId: verification.subscriberEmail || null,
        status: 'active',
        billingCycle: plan?.billingCycle || 'monthly',
        currentPeriodStart: periodStart,
        currentPeriodEnd: periodEnd,
        cancelAtPeriodEnd: false,
        createdAt: periodStart,
        updatedAt: periodStart,
      });
    }

    const targetQuota = plan?.aiCreditsMonthly || 1000;

    // 4. Update User tier and set monthly quota (1,000 credits fixed, no runaway stacking)
    await db
      .update(schema.user)
      .set({
        generationTier: 'premium',
        updatedAt: new Date(),
      })
      .where(eq(schema.user.id, body.userId));

    await billing.setUserMonthlyQuota(
      db,
      body.userId,
      targetQuota,
      `Activated ${planName} via PayPal (${targetQuota} monthly AI credits quota)`
    );

    // 5. Generate and store invoice record
    const invoiceNum = `INV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    await db.insert(schema.invoices).values({
      id: crypto.randomUUID(),
      userId: body.userId,
      subscriptionId: subId,
      invoiceNumber: invoiceNum,
      amount: priceAmount,
      currency: 'USD',
      status: 'paid',
      planName: planName,
      billingPeriod: `${periodStart.toLocaleDateString()} - ${periodEnd.toLocaleDateString()}`,
      paypalOrderId: body.subscriptionId,
      paidAt: periodStart,
      createdAt: periodStart,
    });

    // 6. Save PayPal payment method
    if (verification.subscriberEmail) {
      await db.insert(schema.paymentMethods).values({
        id: crypto.randomUUID(),
        userId: body.userId,
        type: 'paypal',
        brand: 'paypal',
        paypalEmail: verification.subscriberEmail,
        isDefault: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    return c.json({
      success: true,
      tier: 'pro',
      creditsGranted: creditsToGrant,
      message: `Successfully activated ${planName}!`,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return c.json({ error: msg }, 500);
  }
});

// Direct Plan Switch / Upgrade / Downgrade Endpoint
app.post('/api/billing/change-plan', async (c) => {
  try {
    const body = await c.req.json<{
      userId: string;
      planId: string;
    }>();

    if (!body.userId || !body.planId) {
      return c.json({ error: 'User ID and Plan ID are required' }, 400);
    }

    const { db } = getDb(c.env);
    const plan = await db
      .select()
      .from(schema.subscriptionPlans)
      .where(eq(schema.subscriptionPlans.id, body.planId))
      .get();

    if (!plan) return c.json({ error: 'Invalid plan selected' }, 400);

    const now = new Date();

    // Check user's current active subscription
    const currentSub = await db
      .select()
      .from(schema.subscriptions)
      .where(eq(schema.subscriptions.userId, body.userId))
      .orderBy(desc(schema.subscriptions.createdAt))
      .get();

    const isCurrentSubActive =
      currentSub &&
      currentSub.status === 'active' &&
      currentSub.planId !== 'free' &&
      currentSub.currentPeriodEnd &&
      new Date(currentSub.currentPeriodEnd) > now;

    // CASE 1: DOWNGRADE TO FREE
    if (plan.id === 'free') {
      if (isCurrentSubActive && currentSub) {
        // Schedule downgrade at end of active period — keep Pro benefits until period ends
        await db
          .update(schema.subscriptions)
          .set({
            cancelAtPeriodEnd: true,
            canceledAt: now,
            updatedAt: now,
          })
          .where(eq(schema.subscriptions.id, currentSub.id));

        const endDate = new Date(currentSub.currentPeriodEnd);
        return c.json({
          success: true,
          scheduled: true,
          currentPeriodEnd: endDate.toISOString(),
          message: `Your Pro plan will downgrade to Free at the end of your billing cycle on ${endDate.toLocaleDateString()}. You will continue enjoying full Pro features and credits until then.`,
        });
      }

      // User has no active paid plan; ensure tier is free
      await db
        .update(schema.user)
        .set({ generationTier: 'free', updatedAt: now })
        .where(eq(schema.user.id, body.userId));

      return c.json({
        success: true,
        scheduled: false,
        message: 'Free tier is your active plan.',
      });
    }

    // CASE 2: PAID UPGRADE ATTEMPT WITHOUT PAYPAL VERIFICATION
    // Paid upgrades (Pro Monthly, Pro Semester) MUST go through PayPal verification
    return c.json(
      {
        error:
          'Paid subscriptions must be completed securely through PayPal Checkout. Please click the Upgrade with PayPal button.',
      },
      400
    );
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return c.json({ error: msg }, 500);
  }
});

// Cancel Subscription Renewal (Schedule Downgrade to Free)
app.post('/api/billing/cancel-subscription', async (c) => {
  try {
    const body = await c.req.json<{ userId: string }>();
    if (!body.userId) return c.json({ error: 'User ID is required' }, 400);

    const { db } = getDb(c.env);
    const now = new Date();

    const sub = await db
      .select()
      .from(schema.subscriptions)
      .where(eq(schema.subscriptions.userId, body.userId))
      .orderBy(desc(schema.subscriptions.createdAt))
      .get();

    if (sub) {
      await db
        .update(schema.subscriptions)
        .set({
          cancelAtPeriodEnd: true,
          canceledAt: now,
          updatedAt: now,
        })
        .where(eq(schema.subscriptions.id, sub.id));
    }

    return c.json({
      success: true,
      message: 'Automatic renewal cancelled. Your Pro features and credits remain active until the end of your billing cycle.',
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return c.json({ error: msg }, 500);
  }
});

// Resume Subscription Renewal (Un-cancel)
app.post('/api/billing/resume-subscription', async (c) => {
  try {
    const body = await c.req.json<{ userId: string }>();
    if (!body.userId) return c.json({ error: 'User ID is required' }, 400);

    const { db } = getDb(c.env);
    const sub = await db
      .select()
      .from(schema.subscriptions)
      .where(eq(schema.subscriptions.userId, body.userId))
      .orderBy(desc(schema.subscriptions.createdAt))
      .get();

    if (sub) {
      await db
        .update(schema.subscriptions)
        .set({
          cancelAtPeriodEnd: false,
          canceledAt: null,
          updatedAt: new Date(),
        })
        .where(eq(schema.subscriptions.id, sub.id));
    }

    return c.json({
      success: true,
      message: 'Automatic subscription renewal has been resumed successfully!',
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return c.json({ error: msg }, 500);
  }
});

// Admin / Developer Endpoint: Reset User to Free Tier with 100 Credits
app.post('/api/billing/reset-to-free', async (c) => {
  try {
    const body = await c.req.json<{ userId: string }>();
    if (!body.userId) return c.json({ error: 'User ID is required' }, 400);

    const { db } = getDb(c.env);
    const now = new Date();

    // 1. Reset user tier and balance
    await db
      .update(schema.user)
      .set({
        generationTier: 'free',
        creditBalance: 100,
        updatedAt: now,
      })
      .where(eq(schema.user.id, body.userId));

    // 2. Mark active subscriptions as canceled
    await db
      .update(schema.subscriptions)
      .set({
        status: 'canceled',
        cancelAtPeriodEnd: false,
        canceledAt: now,
        updatedAt: now,
      })
      .where(eq(schema.subscriptions.userId, body.userId));

    // 3. Log credit transaction
    await db.insert(schema.creditTransactions).values({
      id: crypto.randomUUID(),
      userId: body.userId,
      amount: 100,
      type: 'initial_grant',
      balanceAfter: 100,
      description: 'Account manually reset to default Free tier (100 credits)',
      createdAt: now,
    });

    return c.json({
      success: true,
      tier: 'free',
      creditBalance: 100,
      message: 'Account successfully reset to Free tier with 100 credits.',
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return c.json({ error: msg }, 500);
  }
});

// Admin / Developer Endpoint: Override User Limit, Tier & Credits
app.post('/api/billing/override-user', async (c) => {
  try {
    const body = await c.req.json<{
      userId: string;
      tier?: 'free' | 'premium' | 'pro';
      creditBalance?: number;
      planId?: string;
    }>();

    if (!body.userId) return c.json({ error: 'User ID is required' }, 400);

    const { db } = getDb(c.env);
    const now = new Date();

    const newTier = body.tier || 'free';
    const newCredits =
      body.creditBalance !== undefined
        ? body.creditBalance
        : newTier === 'free'
        ? 100
        : 1000;

    await db
      .update(schema.user)
      .set({
        generationTier: newTier,
        creditBalance: newCredits,
        updatedAt: now,
      })
      .where(eq(schema.user.id, body.userId));

    if (newTier === 'free') {
      await db
        .update(schema.subscriptions)
        .set({ status: 'canceled', cancelAtPeriodEnd: false, updatedAt: now })
        .where(eq(schema.subscriptions.userId, body.userId));
    } else if (body.planId && body.planId !== 'free') {
      const existingSub = await db
        .select()
        .from(schema.subscriptions)
        .where(eq(schema.subscriptions.userId, body.userId))
        .get();

      const periodEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

      if (existingSub) {
        await db
          .update(schema.subscriptions)
          .set({
            planId: body.planId,
            status: 'active',
            billingCycle: body.planId === 'pro_semester' ? 'semester' : 'monthly',
            currentPeriodStart: now,
            currentPeriodEnd: periodEnd,
            cancelAtPeriodEnd: false,
            canceledAt: null,
            updatedAt: now,
          })
          .where(eq(schema.subscriptions.id, existingSub.id));
      } else {
        await db.insert(schema.subscriptions).values({
          id: crypto.randomUUID(),
          userId: body.userId,
          planId: body.planId,
          status: 'active',
          billingCycle: body.planId === 'pro_semester' ? 'semester' : 'monthly',
          currentPeriodStart: now,
          currentPeriodEnd: periodEnd,
          cancelAtPeriodEnd: false,
          createdAt: now,
          updatedAt: now,
        });
      }
    }

    await db.insert(schema.creditTransactions).values({
      id: crypto.randomUUID(),
      userId: body.userId,
      amount: newCredits,
      type: 'bonus',
      balanceAfter: newCredits,
      description: `Manual admin override: set tier to ${newTier} with ${newCredits} credits`,
      createdAt: now,
    });

    return c.json({
      success: true,
      tier: newTier,
      creditBalance: newCredits,
      message: `User overridden: Tier=${newTier}, Credits=${newCredits}`,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return c.json({ error: msg }, 500);
  }
});

// Get User Invoices & Receipts
app.get('/api/billing/invoices', async (c) => {
  try {
    const userId = c.req.query('userId');
    if (!userId) return c.json({ error: 'User ID is required' }, 400);

    const { db } = getDb(c.env);
    const invoiceList = await db
      .select()
      .from(schema.invoices)
      .where(eq(schema.invoices.userId, userId))
      .all();

    return c.json({ data: invoiceList });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return c.json({ error: msg }, 500);
  }
});

// Get Credit Transactions Audit Log
app.get('/api/billing/usage', async (c) => {
  try {
    const userId = c.req.query('userId');
    if (!userId) return c.json({ error: 'User ID is required' }, 400);

    const { db } = getDb(c.env);
    const transactions = await db
      .select()
      .from(schema.creditTransactions)
      .where(eq(schema.creditTransactions.userId, userId))
      .all();

    return c.json({ data: transactions });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return c.json({ error: msg }, 500);
  }
});

// Record Credit Deduction & Telemetry in Turso DB
app.post('/api/billing/usage', async (c) => {
  try {
    const body = await c.req.json<{
      userId: string;
      cost: number;
      materialType?: string;
      description?: string;
    }>();

    if (!body.userId || !body.cost) {
      return c.json({ error: 'User ID and cost are required' }, 400);
    }

    const { db } = getDb(c.env);
    const result = await billing.deductUserCredit(
      db,
      body.userId,
      body.cost,
      body.materialType || 'notes',
      body.description || `Generated ${body.materialType || 'study material'}`
    );

    return c.json(result);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return c.json({ error: msg }, 500);
  }
});

// PayPal Webhook Receiver
app.post('/api/billing/paypal-webhook', async (c) => {
  try {
    const body = await c.req.json<{
      event_type?: string;
      resource?: {
        id?: string;
        custom_id?: string;
        status?: string;
      };
    }>();

    console.log(`[PayPal Webhook Received]: ${body.event_type}`);
    const { db } = getDb(c.env);

    if (body.event_type === 'BILLING.SUBSCRIPTION.CANCELLED') {
      const subId = body.resource?.id;
      if (subId) {
        await db
          .update(schema.subscriptions)
          .set({ status: 'canceled', canceledAt: new Date(), updatedAt: new Date() })
          .where(eq(schema.subscriptions.paypalSubscriptionId, subId));
      }
    }

    return c.json({ status: 'received' });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return c.json({ error: msg }, 500);
  }
});

// ==========================================
// User Profile, GDPR & Account Settings Endpoints
// ==========================================

// Get Full User Profile
app.get('/api/user/profile', async (c) => {
  try {
    const userId = c.req.query('userId');
    if (!userId) return c.json({ error: 'User ID is required' }, 400);

    const { db } = getDb(c.env);
    const profile = await userOps.getUserProfile(db, userId);
    if (!profile) return c.json({ error: 'User not found' }, 404);
    return c.json({ data: profile });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return c.json({ error: msg }, 500);
  }
});

// Update User Profile
app.put('/api/user/profile', async (c) => {
  try {
    const body = await c.req.json<{
      userId: string;
      name?: string;
      image?: string | null;
      institution?: string;
      fieldOfStudy?: string;
      bio?: string;
      timezone?: string;
    }>();

    if (!body.userId) return c.json({ error: 'User ID is required' }, 400);

    const { db } = getDb(c.env);
    const updated = await userOps.updateUserProfile(db, body.userId, body);
    return c.json({ data: updated });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return c.json({ error: msg }, 500);
  }
});

// List User Active Sessions
app.get('/api/user/sessions', async (c) => {
  try {
    const userId = c.req.query('userId');
    if (!userId) return c.json({ error: 'User ID is required' }, 400);

    const { db } = getDb(c.env);
    const sessions = await userOps.getUserSessions(db, userId);
    return c.json({ data: sessions });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return c.json({ error: msg }, 500);
  }
});

// Revoke Specific Session
app.delete('/api/user/sessions/:id', async (c) => {
  try {
    const sessionId = c.req.param('id');
    const userId = c.req.query('userId');
    if (!userId) return c.json({ error: 'User ID is required' }, 400);

    const { db } = getDb(c.env);
    await userOps.revokeUserSession(db, sessionId, userId);
    return c.json({ success: true });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return c.json({ error: msg }, 500);
  }
});

// GDPR Data Export Archive
app.get('/api/user/export-data', async (c) => {
  try {
    const userId = c.req.query('userId');
    if (!userId) return c.json({ error: 'User ID is required' }, 400);

    const { db } = getDb(c.env);
    const exportBundle = await userOps.exportUserData(db, userId);
    return c.json({ data: exportBundle });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return c.json({ error: msg }, 500);
  }
});

// GDPR Soft Account Deletion (30-day grace period)
app.post('/api/user/delete-account', async (c) => {
  try {
    const body = await c.req.json<{ userId: string }>();
    if (!body.userId) return c.json({ error: 'User ID is required' }, 400);

    const { db } = getDb(c.env);
    const result = await userOps.softDeleteUserAccount(db, body.userId);
    return c.json(result);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return c.json({ error: msg }, 500);
  }
});

// Export worker handler with scheduled cron support
export default {
  fetch: app.fetch,
  async scheduled(event: { cron: string }, env: Bindings, ctx: { waitUntil: (promise: Promise<unknown>) => void }) {
    console.log(`[Worker Cron Triggered] Pattern: ${event.cron}`);
    const { db } = getDb(env);

    // Run deadline alerts (every 15 min) and scheduled weekly digests (hourly)
    ctx.waitUntil(
      Promise.all([
        processDeadlineAlerts(db, env).catch((err) => {
          console.error('[Worker Cron Error in Deadline Alerts]', err);
        }),
        processScheduledWeeklyDigests(db, env).catch((err) => {
          console.error('[Worker Cron Error in Weekly Digest]', err);
        }),
      ])
    );
  },
};