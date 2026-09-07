import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './db/schema';
import { initBetterAuth } from './auth/auth';

export type Bindings = {
  DATABASE_URL: string;
  BETTER_AUTH_SECRET: string;
  R2_BUCKET?: any;
  DEEPSEEK_API_KEY?: string;
  OPENAI_API_KEY?: string;
  GEMINI_API_KEY?: string;
};

const app = new Hono<{ Bindings: Bindings }>();

// Middleware
app.use('*', logger());
app.use('*', cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization', 'Idempotency-Key'],
}));

// Health Check Endpoints
app.get('/health', (c) => {
  return c.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/ready', async (c) => {
  try {
    const dbUrl = c.env.DATABASE_URL;
    if (!dbUrl) {
      return c.json({ status: 'degraded', db: 'unconfigured' }, 503);
    }
    const sql = neon(dbUrl);
    await sql`SELECT 1`;
    return c.json({ status: 'ready', db: 'connected', timestamp: new Date().toISOString() });
  } catch (err: any) {
    return c.json({ status: 'error', db: err.message }, 500);
  }
});

app.get('/metrics', (c) => {
  return c.text(
    `# HELP estudesk_requests_total Total HTTP requests\n# TYPE estudesk_requests_total counter\nestudesk_requests_total 1\n`
  );
});

// Better Auth Route Handler
app.on(['POST', 'GET'], '/api/auth/*', (c) => {
  const sql = neon(c.env.DATABASE_URL || '');
  const db = drizzle(sql, { schema });
  const auth = initBetterAuth(db, c.env.BETTER_AUTH_SECRET || 'default-secret');
  return auth.handler(c.req.raw);
});

// Folder / Semester routes
app.get('/api/folders', async (c) => {
  const sql = neon(c.env.DATABASE_URL || '');
  const db = drizzle(sql, { schema });
  const result = await db.select().from(schema.folders);
  return c.json({ data: result });
});

export default app;
