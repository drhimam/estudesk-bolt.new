import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './apps/api/src/db/schema.ts',
  out: './drizzle',
  dialect: 'turso',
  dbCredentials: {
    url: process.env.TURSO_DATABASE_URL || process.env.DATABASE_URL || 'file:local.db',
    authToken: process.env.TURSO_AUTH_TOKEN,
  },
});
