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
- **Database & ORM**: **Neon Serverless Postgres** (`ep-lively-smoke-aejtoqhq-pooler.c-2.us-east-2.aws.neon.tech/neondb`) + Drizzle ORM (18-table schema in `apps/api/src/db/schema.ts`).
- **Auth Engine**: Better Auth running inside Cloudflare Worker with Drizzle Postgres adapter.
- **AI Router Engine**: Multi-provider router (`custom`, `deepseek`, `gemini`, `openai`, `mistral`) in `apps/api/src/ai/router.ts`. Integrated with live `/api/chat` endpoint and Xiaomi MiMo model `mimo-v2.5-pro` (`https://api.xiaomimimo.com/v1`).

---

## 3. Active Environment Variables (.env & apps/api/.dev.vars)

```env
DATABASE_URL=postgresql://user:password@your-neon-pooler-endpoint.aws.neon.tech/neondb?sslmode=require
BETTER_AUTH_SECRET=your_better_auth_secret_32_characters_long
BETTER_AUTH_URL=http://localhost:3000

# Active Verified AI Provider (Xiaomi MiMo)
AI_PROVIDER=custom
AI_API_KEY=your_ai_api_key_here
AI_BASE_URL=https://api.xiaomimimo.com/v1
AI_MODEL=mimo-v2.5-pro

R2_BUCKET=estudesk-sources
```

---

## 4. Maintenance History & Memory Log

- **2026-09-07**: Updated `AskAIPanel.tsx` to replace hardcoded responses with live AI completions via `/api/chat` and live fetch to Xiaomi MiMo (`mimo-v2.5-pro`). Added animated `isThinking` loading indicator.
- **2026-09-07**: Verified active Xiaomi MiMo AI provider (`mimo-v2.5-pro` at `https://api.xiaomimimo.com/v1`).
- **2026-09-07**: Neon Postgres database connected and synchronized.
- **2026-09-07**: Project memory established for `estudesk-bolt.new`.