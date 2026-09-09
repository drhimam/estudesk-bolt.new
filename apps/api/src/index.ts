import { eq } from 'drizzle-orm';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import * as schema from './db/schema';
import { initBetterAuth } from './auth/auth';
import { runAIRouter, GenerationRequest } from './ai/router';

export type Bindings = {
  TURSO_DATABASE_URL?: string;
  TURSO_AUTH_TOKEN?: string;
  DATABASE_URL?: string;
  BETTER_AUTH_SECRET: string;
  R2_BUCKET?: unknown;
  AI_PROVIDER?: string;
  AI_API_KEY?: string;
  AI_BASE_URL?: string;
  AI_MODEL?: string;
  DEEPSEEK_API_KEY?: string;
  OPENAI_API_KEY?: string;
  GEMINI_API_KEY?: string;
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

// Better Auth Route Handler
app.on(['POST', 'GET'], '/api/auth/*', (c) => {
  const { db } = getDb(c.env);
  const baseURL = new URL(c.req.url).origin;
  const auth = initBetterAuth(db, c.env.BETTER_AUTH_SECRET || 'default-secret', baseURL);
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

// Materials endpoints
app.get('/api/materials', async (c) => {
  try {
    const { db } = getDb(c.env);
    const result = await db.select().from(schema.materials);
    return c.json({ data: result });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return c.json({ data: [], error: msg });
  }
});

// Deadlines endpoints
app.get('/api/deadlines', async (c) => {
  try {
    const { db } = getDb(c.env);
    const result = await db.select().from(schema.deadlines);
    return c.json({ data: result });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return c.json({ data: [], error: msg });
  }
});

// AI Generation Endpoint
app.post('/api/generate', async (c) => {
  const idempotencyKey = c.req.header('Idempotency-Key') || crypto.randomUUID();
  try {
    const body = await c.req.json<Omit<GenerationRequest, 'idempotencyKey'>>();
    if (!body.type || !body.prompt) {
      return c.json({ error: 'Missing required parameters: type and prompt' }, 400);
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
      message: string;
      sourceText?: string;
      contextSubjectNames?: string[];
      history?: Array<{ role: 'user' | 'assistant'; content: string }>;
    }>();

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

export default app;