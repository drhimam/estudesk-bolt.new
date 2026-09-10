# Project Memory & Mandatory Workflow Rules — `estudesk-bolt.new`

## 1. MANDATORY Operating Directives

> [!IMPORTANT]
> **Documentation Rule**: Whenever any feature, bug fix, API route, component update, or refactoring is implemented, it MUST be documented in [`WALKTHROUGH.md`](file:///d:/antigravity/estudesk-bolt.new/estudesk-bolt.new/WALKTHROUGH.md) (and the artifact `walkthrough.md`) at the end of the implementation phase before declaring completion to the user.

> [!NOTE]
> **Repository Target**: Always target the monorepo root at `d:\antigravity\estudesk-bolt.new\estudesk-bolt.new`.

> [!TIP]
> **Verification Requirements**: Every code edit MUST be verified by running `npm run typecheck` and `npm run lint`. No task is complete until both commands pass cleanly with exit code 0.

---

## 2. Core Repository Memory & Architecture

- **Project Identity**: Standalone, privacy-first study preparation platform for students. No third-party auth lock-in; chat sessions and attachments stay client-side in IndexedDB.
- **Frontend Stack**: React 18 + Vite + Tailwind CSS + Lucide React + KaTeX + React Markdown + Remark GFM + Tesseract.js OCR.
- **Client Storage**: IndexedDB via Dexie.js (`src/db/database.ts`).
- **Backend API Stack (`apps/api`)**: Cloudflare Workers + Hono framework.
- **Database & ORM**: **Turso (libSQL/SQLite at Edge)** (`@libsql/client` + `drizzle-orm/libsql` with 18-table schema in `apps/api/src/db/schema.ts`). Up to 9GB storage, 500 databases, and 1 billion row reads/month.
- **Auth Engine**: Better Auth running inside Cloudflare Worker with Drizzle SQLite adapter.
- **AI Router Engine**: Multi-provider router (`deepseek`, `gemini`, `openai`, `mistral`) in `apps/api/src/ai/router.ts`. Integrated with live `/api/chat` endpoint and DeepSeek model `deepseek-chat` (`https://api.deepseek.com/v1`).

---

## 3. Active Environment Variables (.env & apps/api/.dev.vars)

```env
# Database Connection (Turso libSQL / SQLite at the Edge)
TURSO_DATABASE_URL=libsql://your-db-org.turso.io
TURSO_AUTH_TOKEN=your_turso_auth_token
DATABASE_URL=libsql://your-db-org.turso.io

BETTER_AUTH_SECRET=your_better_auth_secret_32_characters_long
BETTER_AUTH_URL=http://localhost:3000

# Active Verified AI Provider (DeepSeek)
AI_PROVIDER=deepseek
AI_API_KEY=your_ai_api_key_here
AI_BASE_URL=https://api.deepseek.com/v1
AI_MODEL=deepseek-chat

R2_BUCKET=estudesk-sources
```

---

## 4. Maintenance History & Memory Log

- **2026-09-07**: Migrated serverless database layer from Neon Postgres to **Turso (libSQL/SQLite)** with `@libsql/client` and `drizzle-orm/libsql`. Converted all 18 tables to SQLite schema and Better Auth SQLite adapter.
- **2026-09-07**: Connected live Turso database (`estudesk-db-drhimam`) and pushed all 18 tables to production.
- **2026-09-07**: Updated `AskAIPanel.tsx` to replace hardcoded responses with live AI completions via `/api/chat` and live fetch to Xiaomi MiMo (`mimo-v2.5-pro`). Added animated `isThinking` loading indicator.
- **2026-09-07**: Verified active Xiaomi MiMo AI provider (`mimo-v2.5-pro` at `https://api.xiaomimimo.com/v1`).
- **2026-09-07**: Project memory established for `estudesk-bolt.new`.