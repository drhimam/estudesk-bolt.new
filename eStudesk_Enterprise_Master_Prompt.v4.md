# eStudesk — Enterprise-Grade Master Prompt

## Privacy-First, AI-Powered Study Preparation Platform

---

## 1. Product Identity & Positioning

eStudesk is a standalone, privacy-first study preparation platform for students. It is NOT an "AI wrapper" — it is a study tool that happens to use AI as infrastructure. The product wins on speed, focus, and trust; AI is the how, not the what.

**Core promise:** Attach any source material → generate structured study materials in one click → refine iteratively → own your data completely.

**Non-negotiable:** No dependencies on or references to any other product. No third-party auth. Chat is never persisted server-side.

---

## 2. Architecture & Infrastructure (Enterprise Grade)

### 2.1 Stack

- **Frontend:** React 19 + TypeScript 5 + Vite (strict mode, no `any` leakage)
- **Client Storage:** IndexedDB via Dexie.js — chat messages, drafts, in-progress attachments, offline queue
- **API:** Cloudflare Workers + Hono (strict validation via Zod on every route)
- **Server DB:** Neon Postgres + Drizzle ORM — `@neondatabase/serverless` HTTP driver only (no TCP in Workers)
- **File Storage:** Cloudflare R2, short-lived — originals purged after extraction per configurable retention window (default 24h, max 7d)
- **Email Delivery:** Amazon SES (primary) + Zoho ZeptoMail (fallback). SES for bulk (weekly digests), ZeptoMail for transactional (24h alerts). Both via HTTP APIs (Worker-compatible).
- **Auth:** Self-hosted Better Auth running inside Cloudflare Workers. Database-backed sessions with Drizzle adapter targeting Neon Postgres. Supports email/password, OAuth (Google, GitHub, etc.), magic links, passkeys. Built-in rate limiting, CSRF protection, scrypt password hashing, session revocation. Custom hooks for audit logging. RBAC with `student`/`admin`/`owner` roles. No third-party managed auth provider — auth logic runs in your own Worker, data lives in your own database.
- **AI Router:** Multi-provider (DeepSeek, Mistral, Google Gemini, OpenAI/ChatGPT, Xiaomi MiMo, MoonshotAI, Custom OpenAI-compatible slot). Internal contract: OpenAI-compatible chat-completions + forced tool-calling shape. Thin adapter per provider. Config-driven priority per material type. Circuit breaker on failure rate (>5% in 5min window) AND spend ceiling (per-provider + global). Failing or over-budget provider is skipped, not retried forever.

### 2.2 Security & Zero-Trust Posture

- **Authentication:** Better Auth database-backed sessions with `better-auth` cookie strategy. Scrypt password hashing (irreversible, memory-hard). CSRF protection on all state-changing endpoints. Built-in rate limiting: 5 sign-in attempts per 10-minute window, 3 sign-up attempts per 10-minute window. Device fingerprinting via session metadata. Session revocation instant (delete row = immediate logout). OAuth via Google/GitHub/etc. with PKCE. Magic links and passkeys supported via plugins.
- **Authorization:** RBAC with three base roles — `student` (default), `admin` (system-level), `owner` (account owner). Permissions are resource-scoped (semester/subject/material level). Every access check is explicit; never assume implicit trust. Better Auth roles extended with custom `eStudeskRoles` table for fine-grained permissions.
- **Input Sanitization:** All user inputs validated via Zod schemas server-side. File uploads: strict MIME-type validation + magic-number checking + size limits (PDF max 50MB, audio max 100MB, images max 20MB). DOMPurify on ALL HTML outputs before iframe render.
- **Headers:** Strict CSP (`default-src 'self'` with explicit script/style/img/connect/frame-src allowances), HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy. No inline scripts.
- **Secrets:** Cloudflare Secrets (not env vars) for all API keys, DB connection strings, Better Auth secret, OAuth client secrets. No secrets in client bundle ever.
- **Data Encryption:** AES-256-GCM for sensitive fields at rest (PII, auth tokens). TLS 1.3 in transit minimum.
- **Email Security:** SPF, DKIM, DMARC configured for sending domain. Bounce and complaint handling via SNS webhooks. Email content sanitized (no user-generated HTML in emails — only structured text + pre-approved templates). Unsubscribe links in every non-transactional email.
- **Audit Logging:** Every authentication event, permission change, data export, deletion request, and admin action is logged to an immutable `audit_logs` table with timestamp, actor, action, resource, IP, user-agent, and before/after state snapshots.
- **Compliance Alignment:** GDPR (right to erasure, data portability, consent management), CCPA (opt-out, disclosure), SOC 2 Type II controls (access logs, change management, incident response). Privacy policy and Terms of Service are drafting briefs for legal review — never ship without lawyer sign-off.

### 2.3 Observability & Reliability

- **Structured Logging:** JSON logs from Workers with trace IDs propagated across every request. Log levels: ERROR (alerting), WARN (dashboard), INFO (analytics), DEBUG (dev only).
- **Email Metrics:** Delivery rate, bounce rate, complaint rate, open rate (via 1x1 tracking pixel, opt-in), SES send quota utilization, ZeptoMail fallback trigger count.
- **Metrics:** Request latency (p50/p95/p99), error rate by endpoint, AI provider success/fallback rates, generation cost per user, DB connection pool health, R2 upload/download latency.
- **Health Checks:** `/health` (liveness), `/ready` (readiness — DB + R2 connectivity), `/metrics` (Prometheus format for scraping).
- **Email Alerting:** Alert on bounce rate >5%, complaint rate >0.1%, SES quota at 80%, ZeptoMail fallback triggered >3 times in 1 hour.
- **Alerting:** PagerDuty/webhook alerts on: error rate >1% for 5min, DB connection failures, AI provider complete outage (all providers down), R2 upload failures >5%.
- **Circuit Breakers:** AI provider circuit (failure rate + spend), DB connection circuit (Neon HTTP timeout fallback), R2 upload circuit (retry 2x then queue for background worker).
- **Graceful Degradation:** If AI providers are all down, show a clear "Service temporarily unavailable — your sources are safe, try again in a few minutes" message. If DB is unreachable, queue writes to Durable Objects for replay. If R2 is down, store small files (<5MB) base64-encoded in Postgres temporarily.
- **Idempotency:** Every generation endpoint requires an `Idempotency-Key` header (UUID v4). Server stores key + response for 24h. Double-clicks never double-bill.

### 2.4 Performance & Scalability

- **Frontend Targets:** LCP < 2.5s, FID < 100ms, CLS < 0.1, TTFB < 600ms. Bundle budget: initial chunk < 200KB gzipped. Lazy load every route + every material type editor.
- **Caching Strategy:**
- Static assets: Cloudflare Cache (1 year, immutable)
- API responses: Cache API for GET requests (5min TTL for lists, 1min for single resources), `stale-while-revalidate` for non-critical data
- AI responses: Do NOT cache — every generation is user-specific
- DB query results: Application-level cache in Worker (30s TTL for metadata, none for user data)
- **CDN:** Cloudflare CDN for all static assets + API edge caching. Images served via Cloudflare Images (transform on-the-fly).
- **Database:** Connection pooling via Neon's serverless driver (auto-scales). Query timeout: 10s. Slow query log threshold: 500ms. Index on: `user_id`, `folder_id`, `subject_id`, `deadline_date`, `created_at` for all tables.
- **Rate Limiting:** Per-IP: 100 req/min on auth endpoints, 1000 req/min on API. Per-user: 50 generations/day (free), 200/day (premium), 1000/day (enterprise). Enforced server-side, hard-rejected with 429 + `Retry-After` header.

### 2.5 Data Governance & Lifecycle

- **Retention:**
- Chat messages: Client-side only (IndexedDB), never server-side. User can clear anytime.
- Generated materials: Persisted in Postgres indefinitely (user-owned).
- Source files (R2): Purged after extraction (default 24h, configurable per-user up to 7d).
- Audit logs: 7 years (immutable, append-only).
- Deleted accounts: Soft delete → 30-day grace period → hard delete with cryptographic erasure.
- **Backup:** Daily automated snapshots (Neon), point-in-time recovery (7 days). Quarterly disaster-recovery drill.
- **Export:** User can export ALL data (subjects, materials, deadlines, chat history, audit logs) as a single JSON archive or structured ZIP. Export generated asynchronously, emailed via secure link (24h expiry).
- **Right to Erasure:** One-click account deletion initiates 30-day grace period (reversible). After grace period: cascade delete all user data, purge R2 objects, anonymize audit logs (retain action record, strip PII).

---

## 3. Data Model (Drizzle Schema)

```typescript
// Core identity
users: {
  id: uuid PK,
  // Core auth fields managed by Better Auth (in `user` table created by Better Auth schema):
  // email, email_verified, name, image, created_at, updated_at
  // See Better Auth schema: https://www.better-auth.com/docs/concepts/database#core-schema
  //
  // eStudesk-specific profile fields (extends Better Auth user):
  generation_tier: enum('free', 'premium', 'enterprise') default 'free',
  daily_generation_count: int default 0,
  monthly_generation_count: int default 0,
  daily_generation_reset: timestamp,
  monthly_generation_reset: timestamp,
  timezone: varchar(50) default 'UTC',
  deleted_at: timestamp nullable, // soft delete
}

// Better Auth core tables (auto-created by Better Auth Drizzle adapter):
// - user: id, name, email, email_verified, image, created_at, updated_at
// - session: id, user_id, token, expires_at, ip_address, user_agent, created_at, updated_at
// - account: id, user_id, account_id, provider_id, access_token, refresh_token, id_token, expires_at, password
// - verification: id, identifier, value, expires_at, created_at, updated_at
//
// eStudesk extends these with:

user_roles: {
  id: uuid PK,
  user_id: uuid FK -> user.id,
  role: enum('student', 'admin', 'owner') default 'student',
  assigned_by: uuid FK -> user.id nullable,
  assigned_at: timestamp default now(),
}

user_sessions: {
  id: uuid PK,
  user_id: uuid FK -> user.id,
  session_token: varchar(255) not null,
  device_fingerprint: varchar(255),
  ip_address: inet,
  user_agent: text,
  expires_at: timestamp not null,
  created_at: timestamp default now(),
}

// Auth & sessions
audit_logs: {
  id: uuid PK,
  actor_id: uuid FK -> users.id nullable, // system actions = null
  action: varchar(100) not null, // enum: login, logout, generate, export, delete, permission_change, etc.
  resource_type: varchar(50) not null,
  resource_id: uuid nullable,
  before_state: jsonb nullable,
  after_state: jsonb nullable,
  ip_address: inet,
  user_agent: text,
  created_at: timestamp default now(),
}

// Organization structure
folders: {
  id: uuid PK,
  user_id: uuid FK -> users.id,
  name: varchar(100) not null, // stored uppercase, displayed uppercase bold
  color: varchar(7) default '#4F46E5',
  sort_order: int default 0,
  is_pinned: boolean default false,
  created_at: timestamp default now(),
  updated_at: timestamp default now(),
}

subjects: {
  id: uuid PK,
  folder_id: uuid FK -> folders.id,
  user_id: uuid FK -> users.id,
  name: varchar(100) not null, // normal case
  color: varchar(7) not null, // subject color = navigation system
  sort_order: int default 0,
  is_pinned: boolean default false,
  created_at: timestamp default now(),
  updated_at: timestamp default now(),
}

// Study materials
materials: {
  id: uuid PK,
  subject_id: uuid FK -> subjects.id,
  user_id: uuid FK -> users.id,
  title: varchar(200) not null,
  type: enum('notes', 'cheatsheet', 'infographic', 'flashcards', 'quiz', 'assignment', 'presentation') not null,
  content: jsonb not null, // type-specific structured content
  version: int default 1,
  source_ids: uuid[] nullable, // references to extracted_sources
  config: jsonb nullable, // generation parameters used
  created_at: timestamp default now(),
  updated_at: timestamp default now(),
}

material_versions: {
  id: uuid PK,
  material_id: uuid FK -> materials.id,
  version: int not null,
  content: jsonb not null,
  config: jsonb nullable,
  created_at: timestamp default now(),
}

// Source materials (extracted text/embeddings, not raw files)
extracted_sources: {
  id: uuid PK,
  subject_id: uuid FK -> subjects.id nullable,
  user_id: uuid FK -> users.id,
  name: varchar(255) not null,
  type: enum('pdf', 'doc', 'docx', 'xls', 'xlsx', 'csv', 'md', 'txt', 'audio', 'video', 'url', 'youtube', 'image', 'pasted_text') not null,
  content: text not null, // extracted text
  metadata: jsonb nullable, // page count, duration, dimensions, etc.
  r2_key: varchar(500) nullable, // null if pasted text or small inline
  r2_expires_at: timestamp nullable,
  created_at: timestamp default now(),
}

// Email notifications & scheduling
notification_preferences: {
  id: uuid PK,
  user_id: uuid FK -> users.id unique,
  weekly_digest_enabled: boolean default true,
  weekly_digest_day: enum('monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday') default 'monday',
  weekly_digest_time: time default '08:00',
  deadline_alert_enabled: boolean default true,
  deadline_alert_hours_before: int default 24, // 24h default, user configurable: 12, 24, 48, 72
  timezone: varchar(50) default 'UTC',
  email_format: enum('html', 'plain') default 'html',
  created_at: timestamp default now(),
  updated_at: timestamp default now(),
}

notification_logs: {
  id: uuid PK,
  user_id: uuid FK -> users.id,
  notification_type: enum('weekly_digest', 'deadline_alert') not null,
  deadline_id: uuid FK -> deadlines.id nullable, // null for weekly digest
  provider: enum('ses', 'zeptomail') not null,
  provider_message_id: varchar(255) nullable,
  status: enum('queued', 'sent', 'delivered', 'bounced', 'complained', 'failed') not null,
  error_message: text nullable,
  sent_at: timestamp nullable,
  delivered_at: timestamp nullable,
  opened_at: timestamp nullable, // from tracking pixel
  created_at: timestamp default now(),
}

email_templates: {
  id: uuid PK,
  template_key: varchar(100) unique not null, // 'weekly_digest', 'deadline_alert_24h'
  subject_line: varchar(255) not null,
  html_body: text not null,
  plain_body: text not null,
  version: int default 1,
  is_active: boolean default true,
  created_at: timestamp default now(),
  updated_at: timestamp default now(),
}


// Deadlines
deadlines: {
  id: uuid PK,
  folder_id: uuid FK -> folders.id not null,
  subject_id: uuid FK -> subjects.id nullable, // null = semester-level "Other"
  user_id: uuid FK -> users.id,
  title: varchar(200) not null,
  description: text nullable,
  due_date: timestamp not null,
  urgency: enum('overdue', 'today', 'this_week', 'later', 'completed') generated always as (...) stored,
  is_completed: boolean default false,
  completed_at: timestamp nullable,
  created_at: timestamp default now(),
  updated_at: timestamp default now(),
}

// Chat (global, not subject-tied)
conversations: {
  id: uuid PK,
  user_id: uuid FK -> users.id,
  title: varchar(200) default 'New conversation',
  subject_context_ids: uuid[] nullable, // which subjects are attached as context
  created_at: timestamp default now(),
  updated_at: timestamp default now(),
}

chat_messages: {
  id: uuid PK,
  conversation_id: uuid FK -> conversations.id,
  role: enum('user', 'assistant', 'system') not null,
  content: text not null,
  attachments: jsonb nullable, // files, URLs, materials attached
  web_search_used: boolean default false,
  page_context_used: boolean default false,
  token_count: int nullable,
  created_at: timestamp default now(),
}

// AI generation telemetry
generation_events: {
  id: uuid PK,
  user_id: uuid FK -> users.id,
  material_type: varchar(50) not null,
  provider: varchar(50) not null,
  model: varchar(100) not null,
  prompt_tokens: int not null,
  completion_tokens: int not null,
  estimated_cost_usd: decimal(10,6) not null,
  status: enum('success', 'retry', 'fallback', 'failed') not null,
  error_message: text nullable,
  latency_ms: int not null,
  idempotency_key: uuid not null,
  created_at: timestamp default now(),
}
```

---

## 4. Core Structural Pattern: Two-Panel Shell

### 4.1 Desktop Layout

- **Left panel (narrow, fixed, 280px):** Collapsible folders as semesters. Each folder contains subjects. Selecting folder → semester dashboard. Selecting subject → tabbed view.
- **Right panel (fluid):** Content area. No max-width constraint on study material viewer — content breathes.
- **Subject tabs:** Study Material (default) / Deadline / Uploaded Materials.
- **Study Material sub-tabs:** Study Notes · Cheatsheet · Infographics · Flashcards · Quizzes · Assignments · Presentations.
- **Global Ask AI button:** Top-right corner of every page. Opens right-side panel (desktop: fixed 420px alongside content; mobile: full-overlay with backdrop).

### 4.2 Mobile Layout

- Left panel collapses to a drawer (swipeable, 85% width).
- Top-level tabs collapse to a bottom bar (4 items max, icon + label).
- Ask AI panel is full-screen overlay.
- Touch targets minimum 44x44px. No hover-dependent interactions.

### 4.3 Semester & Subject Management

- **Semester names:** Mandatory uppercase, bold, wider letter-spacing (`tracking-widest`). Visually distinct from subject names (normal case, normal weight).
- **Three-dot menu:** Appears on hover (desktop) or long-press (mobile) for both semesters and subjects.
- Pin to top / Unpin from top → pinned items sort to top of group. Pin icon (small, subtle) next to pinned items.
- Rename → inline text field. Semesters auto-uppercase on save. Subjects preserve case. Enter to save, Escape to cancel.
- Delete → confirmation modal with consequence statement ("This will delete X materials, Y deadlines, and Z chat messages. This cannot be undone."). Navigate back to appropriate view after deletion.

---

## 5. Generation System: Forced Tool Calling

Every generation type uses forced tool/function calling against a strict JSON schema. Never ask the model to "output JSON" in prose. Server validates response against Zod schema. On failure: one corrective retry with same provider, then fallback to next provider in priority chain.

| Type | Tool Name | Params | Output Schema |
| --- | --- | --- | --- |
| Notes | `generate_notes` | detailLevel, focusAreas, additionalInstructions | Markdown: headings, bullets, tables, mnemonics, callout boxes |
| Cheatsheet | `generate_cheatsheet` | detailLevel, focusAreas, format, maxLength, includeExamples, additionalInstructions | Markdown optimized for dense reference: hierarchical headings, definition lists, formula blocks, comparison tables, mnemonic callouts. Designed for quick scan, not deep reading. |
| Infographic | `generate_infographic` | pageSize, orientation, colorMode, printable, type, additionalInfo | Self-contained sanitized HTML (DOMPurify mandatory). Rendered in sandboxed iframe with `sandbox="allow-scripts"` only. Never `innerHTML`'d directly. |
| Flashcards | `generate_flashcards` | count (1–20), difficulty, additionalInstructions | `{id: string, front: string, back: string}[]` |
| Quiz | `generate_quiz` | count (1–50), types (single/multi/short/mixed), difficulty, additionalInstructions | `{id: string, question: string, type: string, options: string[], correctAnswer: string[], explanation: string}[]` — `correctAnswer` is ALWAYS string array regardless of type. `options` empty array for short-answer. |
| Assignment | `complete_assignment` | instructions, wordCount, format, citationStyle, additionalInstructions | Markdown with **title page + table of contents required**. Grounded in attached source material. Persistent "review before submitting" banner baked into doc. This is a writing assistant, not a worksheet generator. |
| Presentation | `generate_presentation` | instructions, slideCount, tone, additionalInstructions | `{slideNumber: number, title: string, points: string[], notes?: string}[]` |

### 5.1 Cheatsheet Generation Specifications

The cheatsheet is a **dense reference document** — fundamentally different from notes. Where notes are pedagogical (teaching order, explanations, context), a cheatsheet is scannable (hierarchy, density, at-a-glance retrieval).

#### Output Format

- **Markdown** with strict structural discipline:
- H2 for topic areas (max 4–6 per cheatsheet)
- H3 for sub-concepts
- **Definition lists** for key terms: `**Term** — concise definition.`
- **Formula blocks:** fenced code blocks with language `math` or `formula` for equations, rendered via KaTeX
- **Comparison tables:** for contrasting concepts (e.g., "Mitosis vs. Meiosis")
- **Mnemonic callouts:** blockquote style with 🧠 prefix
- **Color-coded tags:** inline badges for difficulty (Fundamental / Intermediate / Advanced)
- **Two-column layout option:** When selected, output uses HTML table wrapper or CSS columns for side-by-side density. Rendered in Material Viewer with `column-count: 2` on desktop, single column on mobile.
- **One-page constraint:** When "1 page" selected, AI enforces density: shorter definitions, more abbreviations, tables over paragraphs. Hard cutoff at ~800 words.

#### Prompt Engineering

- System prompt explicitly distinguishes cheatsheet from notes: "You are generating a reference cheatsheet, not explanatory notes. Prioritize density, hierarchy, and quick lookup. Use fragments, not sentences. Avoid prose paragraphs."
- Source grounding: every fact must trace to uploaded source material. No hallucinated formulas or dates.
- Cross-reference links: where a concept depends on another, inline link to that section (`see §3.2`)

#### Refinement Specifics

- Common refinement requests handled specially:
- "Add more formulas" → injects formula blocks without expanding prose
- "Make it denser" → compresses existing content, removes redundancy
- "Add a comparison table" → converts related concepts into table format
- "Remove examples" → strips example blocks, keeps definitions
- "Add page breaks" → inserts `---` horizontal rules for print pagination

#### Print Optimization

- Print stylesheet: `column-fill: balance`, `break-inside: avoid` on tables, `orphans: 3`, `widows: 3`
- Font size: 10pt body, 8pt tables for one-page mode
- Margins: 0.5in all sides
- Header: subject name + cheatsheet title + generation date
- Footer: page numbers

### 5.2 Generation Studio (Full-Screen Overlay)

**Left Panel — Configuration:**

1. Title field (name your material)
2. Type selector dropdown (7 types)
3. Collapsible configuration per type:

- **Notes:** detail level (concise/balanced/comprehensive), focus areas (comma-separated tags)
- **Cheatsheet:** detail level (condensed/core/comprehensive), focus areas (comma-separated tags), format (structured Markdown / two-column layout / formula-heavy), max length (1 page / 2 pages / unlimited), include examples toggle (yes/no)
- **Flashcards:** count (slider 1–20), difficulty (basic/intermediate/advanced)
- **Quiz:** count (slider 1–50), question type (multiple choice / select-all / short answer / mixed), difficulty
- **Assignment:** word count, format (essay/report/analysis), citation style (none/APA/MLA/Chicago)
- **Presentation:** slide count, tone (academic/casual/professional)
- **Infographic:** page size (Letter/Legal/Tabloid), orientation (Portrait/Landscape), color mode (B/W/Color), type (Statistical/Timeline/Process/Comparison/List/Geographic/Flowchart/Hierarchical/Informational/Anatomical), additional info text box, print-friendly toggle

4. Additional instructions textarea (appears for all types)
5. Sources section:

- File upload: PDF, DOC, DOCX, XLS, XLSX, CSV, MD, TXT, MP3, MP4, WEBM, PNG, JPG, WEBP
- Paste text area
- Attach URL (web page or YouTube)
- "Attach from study materials" — pick existing materials from any subject

6. Web search toggle (include up-to-date web sources)
7. Generate button (bottom, sticky)

**Right Panel — Generation Progress:**
When Generate is clicked, right panel shows staged progress indicator:

1. Analyzing sources → checkmark on complete
2. Structuring content → checkmark on complete
3. Generating draft → checkmark on complete
4. Finalizing → checkmark on complete

Each stage has a subtle progress bar and status text. No generic spinner. If a stage takes >10s, show "Still working..." with a cancel button.

**Right Panel — Live Preview:**
After generation, right panel shows live preview using the same renderer as the saved Material Viewer. Content is editable in-place for notes/assignments.

### 5.3 Refinement (Left Panel Becomes Chat)

After generation, left panel switches to refinement chat interface:

- User types adjustments → draft on right updates with new version
- Version navigation arrows in header (← →) browse previous versions
- Version counter: "Version 3 of 5"
- Save button in header saves current version as a study material
- **Cap:** Max 10 refinement turns per session (server-enforced, cost control). Counter shown: "7/10 turns used."

### 5.4 Post-Save Summary Screen

Instead of closing immediately, show:

- List of everything created in session (titles + types)
- Reminder of attached sources (still available for reuse)
- Grid of all 7 material types to pick from — click any to start new generation from same sources without re-uploading
- Sources persist across generations. Only type-specific settings reset on type switch.
- "Done" button closes studio.

---

## 6. Deadlines System

### 6.1 Data Model

- `deadlines` table: `folder_id` required, `subject_id` nullable.
- Two scopes: subject's own Deadline tab, and semester dashboard aggregated view.
- Non-subject deadlines created from semester dashboard "Add deadline" modal via explicit **"Other"** option in subject dropdown. No separate global nav item.

### 6.2 Urgency Color Coding

- **Red background tint** (#FEF2F2) + red left border — overdue
- **Orange background tint** (#FFF7ED) + orange left border — due today
- **Amber background tint** (#FFFBEB) + amber left border — due this week
- **Neutral gray background** (#F9FAFB) — later or completed
- Colors appear in both semester dashboard and subject deadline tab.
- Completed deadlines: strikethrough text + muted color + checkmark icon.

### 6.3 Semester Dashboard Deadline Tabs

Below stats, three tabs:

1. **Date-wise** — groups by urgency category (Overdue, Today, This Week, Later). Categories are collapsible sections.
2. **Subject-wise** — groups under each subject with colored divider line matching subject color.
3. **Calendar** — monthly grid with deadline chips on due dates. Navigation arrows for month switch. Today highlighted.

### 6.4 Download Menu

Next to "Add deadline" button on both views:

- **Plain text (.txt)** — clean structured text. Header: student name, semester, scope (all-subjects or specific subject), generation date. Grouped by urgency category.
- **PDF (.pdf)** — formatted PDF with dark header band, info block, color-coded category bars matching urgency colors, page numbers in footer.
- Download button disabled when zero deadlines.

---

### 6.5 Deadline Email Notifications

#### Infrastructure

- **Primary Provider:** Amazon SES via `@aws-sdk/client-sesv2` (HTTP API, Worker-compatible). SES configured with dedicated sending domain, SPF, DKIM, DMARC. Dedicated IP pool for transactional emails (deadline alerts) to protect reputation. Shared IP pool for bulk (weekly digests).
- **Fallback Provider:** Zoho ZeptoMail via REST API. Triggered when SES returns 5xx, SES quota exceeded, or SES bounce/complaint rate spikes. Automatic provider health check every 5 minutes; unhealthy provider skipped for 15 minutes.
- **Queue:** Cloudflare Durable Objects for email queue (ordered, at-least-once delivery). Cron trigger on Worker dispatches queue processor every minute. Max 14 emails/second per provider (SES rate limit headroom).
- **Template Engine:** Handlebars server-side (pre-compiled templates). No user-generated HTML ever rendered in emails. All dynamic content escaped before injection.

#### Weekly Digest Email

- **Schedule:** Every Monday at user-configured time (default 08:00 in user's timezone). Cron expression: `0 {hour} * * 1` per timezone bucket.
- **Content:**
- Subject: "Your week ahead — {count} deadlines in {semester_name}"
- Header: Student name, semester name, week range (Mon–Sun)
- Sections grouped by urgency:
    - 🔴 Overdue — count + list (title, subject, original due date, days overdue)
    - 🟠 Due Today — count + list
    - 🟡 This Week — count + list (grouped by day: Monday, Tuesday, etc.)
    - ⚪ Later — count + upcoming 5 deadlines (subject, date, days until)
- Footer: "Manage notifications" link → opens notification preferences. "Open eStudesk" CTA button.
- Plain-text alternative: identical structure, ASCII bullet points.
- **Sending Logic:**

1. Cron trigger fires at 00:00 UTC, batches users by timezone.
2. For each user with `weekly_digest_enabled = true` and matching day/time:

    - Query deadlines for that user's active semesters (not completed, due within next 14 days OR overdue)
    - If zero deadlines: skip send (no empty digests)
    - Render template → queue to Durable Object
    - Log to `notification_logs` as `queued`

3. Queue processor dequeues in FIFO order, sends via SES.
4. On SES success: update `status = sent`, capture `provider_message_id`.
5. On SES failure (5xx, timeout): retry 2x with exponential backoff, then fallback to ZeptoMail.
6. On ZeptoMail failure: mark `status = failed`, alert ops, surface to user in-app ("Email delivery failed — check your address").

#### 24-Hour Deadline Alert

- **Trigger:** Background job runs every 15 minutes. Queries deadlines where `due_date - now() <= alert_hours_before` AND `is_completed = false` AND no alert already sent for this deadline (`notification_logs` check).
- **Content:**
- Subject: "⏰ Due tomorrow: {deadline_title}"
- Body: Deadline title, subject name (with color dot), due date/time, description preview (120 chars), direct link to subject deadline tab.
- CTA: "View in eStudesk" button + "Mark as complete" one-click link (signed URL, expires in 24h).
- Footer: "You're receiving this because you enabled deadline alerts. Manage preferences."
- **Batching:** If a user has multiple deadlines triggering within the same 15-minute window, send ONE combined email with all alerts (max 5 per email; overflow queued separately).
- **User Configurable:** Alert hours before: 12, 24 (default), 48, 72. Toggle on/off per user.

#### Delivery Tracking & Bounce Handling

- **SES SNS Webhooks:** HTTP endpoint receives bounce, complaint, delivery notifications.
- Bounce (permanent): mark email address as invalid, suppress future sends, notify user in-app to update email.
- Bounce (temporary): retry 3x over 24h, then mark failed.
- Complaint: immediately suppress user from ALL non-transactional emails, flag for review, log to audit.
- Delivery: update `notification_logs.delivered_at`.
- **Open Tracking:** 1x1 transparent GIF pixel embedded in HTML emails. Tracked only if user has not opted out of analytics. Pixel endpoint logs `opened_at` in `notification_logs`.
- **Unsubscribe:** Every non-transactional email (weekly digest) includes one-click unsubscribe link (signed JWT, no login required). Unsubscribe sets `weekly_digest_enabled = false`. Transactional emails (deadline alerts) include "Manage preferences" link instead — cannot unsubscribe from transactional without disabling the feature in-app.

#### Notification Preferences UI

- **Location:** User settings page, "Notifications" tab.
- **Controls:**
- Weekly digest: toggle + day selector (Mon–Sun dropdown) + time selector (15-min increments) + format (HTML/Plain)
- Deadline alerts: toggle + hours-before selector (12/24/48/72 dropdown)
- Timezone: auto-detected from browser, overrideable
- Email format preference: HTML (rich) or Plain text (accessible)
- **Preview:** "Send test email" button sends immediate test digest/alert to verify delivery.
- **Delivery History:** Table of last 30 notifications with status (sent/delivered/bounced), date, type. Click to expand error details.

#### Rate Limiting & Quotas

- **Per-user:** Max 1 weekly digest per week (obviously) + max 10 deadline alerts per day (flood protection).
- **Per-provider:** SES send quota monitored via API. At 80% quota, switch new sends to ZeptoMail. At 95%, pause bulk (digests) until reset, keep transactional (alerts) on ZeptoMail.
- **Global:** Max 1000 emails/minute across all users. Queue overflow held in Durable Object with visible backlog metric.

#### Privacy & Compliance

- **No PII in email subjects:** Subjects contain deadline titles and counts only, no student IDs or sensitive metadata.
- **Data minimization:** Email bodies contain only deadline info necessary for the notification. No chat history, no material content, no source filenames.
- **Retention:** `notification_logs` retained 90 days (delivery analytics), then anonymized (strip `user_id`, keep aggregate stats). Email templates versioned; old versions retained for legal compliance.
- **GDPR:** Unsubscribe honored within 24h. User can export their notification history as part of full data export.

#### Error Handling & Observability

- **Failed sends:** Logged to `notification_logs` with `status = failed` + error message. User sees in-app badge on Settings icon: "1 email failed to deliver."
- **Provider outage:** If both SES and ZeptoMail fail for >30 minutes, queue holds emails for 24h. In-app banner: "Email notifications are temporarily delayed. Your deadlines are still visible in eStudesk."
- **Dashboard:** Admin view shows daily email volume, delivery rate by provider, bounce/complaint rates, top failing domains, queue depth.

## 7. Global Ask AI

### 7.1 Panel Design

- **Trigger:** Global button top-right of every page. Toggles panel open/closed.
- **Desktop:** Right-side panel, 420px fixed width, slides in smoothly (`transform translateX`). Sits alongside main content; main content does NOT shrink.
- **Mobile:** Full-screen overlay with semi-transparent backdrop (`bg-black/30`). Slide up from bottom.
- **Close:** X icon in panel header + click backdrop (mobile) + Ask AI button toggle.

### 7.2 Panel Features

- **Subject context picker:** Multi-select subjects as context. Selected subjects appear as color-coded chips (subject color) with X to remove individually.
- **Web search toggle:** Toggle button with active state badge on message.
- **Chat with page toggle:** Lets AI see current page content.
- **Attachment menu:**
- Upload files (all supported types)
- Paste URL or text
- Attach existing study materials from any subject
- Paste image from clipboard
- **Suggested prompts:** When chat is empty, show 4 quick-start buttons (context-aware based on current page).
- **Clear chat:** Trash button wipes conversation history (client-side IndexedDB only).
- **Save to materials:** Hover over AI response → "Save as material" button. Saves as Notes type in current subject.

### 7.3 Chat History Sidebar

- **Toggle:** Left-pointing panel icon in header opens compact sidebar (absolute overlay, NOT pushing content).
- **List:** All past conversations sorted by most recently used. Auto-titled from first message (truncated to 40 chars).
- **New chat:** Button at top of sidebar + in header.
- **Rename:** Hover → pencil icon → inline rename. Enter save, Escape cancel.
- **Delete:** Hover → trash icon → inline confirmation ("Delete this conversation?" with Confirm/Cancel buttons right in list item).
- **Per-chat export:** Hover → download icon → menu: Plain text (readable transcript with timestamps + role labels) or JSON (full structured conversation). Filename: `{conversation_title}.{ext}`.
- **Global export:** Download icon at top of sidebar → exports ALL conversations as single JSON.
- **Global import:** Upload icon next to export → select previously exported JSON → creates new conversations with fresh IDs (no overwrite).
- **Full page view:** Maximize icon in header → pops chat into full-screen overlay. Minimize icon returns to side panel.
- **Click-away:** When history sidebar is open, clicking main chat area closes it. Transparent layer behind sidebar catches clicks.

### 7.4 Conversation-Aware Messaging

Each message linked to its conversation. Switching chats shows correct history. Database schema supports this without data loss.

---

## 8. Cost Control (Build Early)

- **Per-user daily cap:** Enforced server-side. Hard-rejected with clear message: "Daily generation limit reached. Resets at midnight UTC. Upgrade for more."
- **Per-user monthly cap:** Same pattern.
- **Per-session refinement cap:** Max 10 turns. Counter visible in UI.
- **Generation events table:** One row per AI call (success, retry, fallback, failed). Tracks provider, model, tokens, estimated cost, latency, idempotency key.
- **Per-provider spend ceiling:** Daily spend limit per provider. Exceeded → skip provider, log event.
- **Global spend ceiling:** Daily total spend limit. Exceeded → queue generations with "High demand" message, process when budget resets.
- **Idempotency:** Generation endpoint requires `Idempotency-Key`. Stored for 24h. Same key = same response, no double-billing.

---

## 9. Visual Design Direction (Deliberate, Not Generic)

### 9.1 Philosophy

**Subject color is the navigation system, not decoration.** Base UI stays quiet (ink/paper/one sparing accent) so 8–10 subject hues carry real meaning. A user should be able to tell which subject they're in from peripheral vision alone.

### 9.2 Typography

- **Headings:** Considered serif (e.g., Source Serif 4, Fraunces, or ET Book). Used for page titles, material headings, presentation titles.
- **Body:** Legible sans (e.g., Inter, Geist, or IBM Plex Sans). Used for all UI text, body copy, labels.
- **Bold:** Used sparingly and semantically — key terms on first mention, not every "important" phrase. Real heading hierarchy (H1→H2→H3) carries weight, not bolded paragraphs.
- **NO ALL-CAPS eyebrow labels.** Use sentence case or title case. If hierarchy is needed, use size, weight, or color — not shouting.
- **NO middle-dot-joined meta strings** (e.g., "Draft · 2 min ago · 3 versions"). Use commas, pipes, or separate lines.

### 9.3 Layout & Components

- **Cards:** Use only when content is genuinely card-like (distinct units: flashcards, deadline items). Do NOT put every piece of content in a card. Lists can be lists. Tables can be tables.
- **Shadows:** One subtle shadow level only (`0 1px 3px rgba(0,0,0,0.1)`). No elevation hierarchy via shadow stacks.
- **Borders:** Prefer 1px borders in subtle gray over shadows for separation. Use subject color as left-border accent for active items.
- **Buttons:**
- Primary: filled, subject color background, white text.
- Secondary: ghost, subject color border + text.
- Tertiary: text-only, subtle hover background.
- **NO arrow-suffixed buttons** ("Generate →"). The action is the button; the arrow is noise.
- **Empty states:** Designed as demonstrations, not placeholders. Show a populated example of the product working (e.g., sample flashcard deck, example note structure) with a clear single CTA.

### 9.4 AI Integration Aesthetic

- **AI is infrastructure, not a feature badge.** No "AI-powered" labels on every button. No sparkle icons on every action. AI capabilities are woven invisibly into the workflow.
- **Loading states:** Staged progress indicators (analyzing → structuring → generating → finalizing) with descriptive text. No generic spinners. No "Thinking..." with a bouncing dot.
- **AI outputs:** Rendered in the same typography system as hand-built content. No special "AI output" styling (different background, different font, robot avatar). The output IS the content.

### 9.5 Explicitly Avoid (Anti-Patterns)

- ALL-CAPS eyebrow labels
- Middle-dot-joined meta strings
- Arrow-suffixed buttons
- Identical soft-shadow cards on everything
- Generic gradient backgrounds (especially purple-blue "AI gradients")
- Overuse of emojis in UI labels
- ChatGPT-clone interface layouts (sidebar chat list + main chat area is fine for Ask AI, but nowhere else)
- Generic loading spinners for multi-step operations
- Toast spam (max 1 toast at a time, auto-dismiss 5s)
- Modal hell (prefer inline editing, side panels, or full-screen overlays)
- Bolded pseudo-structure (using bold instead of real headings/tables)

---

## 10. Accessibility (WCAG 2.2 AA Compliance)

- **Keyboard Navigation:** Every interactive element reachable via Tab. Logical tab order follows visual order. No keyboard traps.
- **Focus Management:** Visible focus rings (2px offset, subject color or system blue). Focus trapped inside modals/drawers. Focus returned to trigger on close.
- **Screen Readers:** All icons have `aria-label` or `aria-hidden`. Dynamic content announces via `aria-live` regions (generation progress, save confirmation). Landmark regions (`main`, `nav`, `aside`, `article`) used correctly.
- **Color Contrast:** Minimum 4.5:1 for normal text, 3:1 for large text/UI components. Subject colors automatically checked for contrast; if too light, auto-adjust text to black/white.
- **Motion:** Respect `prefers-reduced-motion`. All transitions degrade to instant or fade. No auto-playing animations.
- **Touch:** Mobile touch targets minimum 44x44px. No hover-only interactions (everything must work on tap).
- **Forms:** All inputs have associated labels. Error messages linked via `aria-describedby`. Required fields indicated programmatically, not just with asterisk color.
- **Skip Link:** "Skip to main content" link as first focusable element on every page.

---

## 11. Interaction Design (Think Outside the Box)

### 11.1 Command Palette (Cmd+K / Ctrl+K)

Every action in the product accessible via global command palette:

- Navigate to any semester, subject, or material
- Create new semester/subject/deadline
- Generate any material type for current subject
- Toggle web search in Ask AI
- Export data
- Keyboard-only workflow: no mouse required for power users.
- Fuzzy search forgiving typos. Recent actions surfaced by default.

### 11.2 Bento Grid Dashboards

Semester dashboard uses bento grid layout (modular, asymmetric cards) for stats and deadline overview:

- Large card: upcoming deadlines (this week)
- Medium card: generation usage (daily cap visualized)
- Small cards: subject quick-links with color-coded borders
- Card sizing communicates hierarchy, not just aesthetics.

### 11.3 Calm Design Principles

- Default views show only what's needed for the current workflow.
- Advanced settings hidden behind progressive disclosure ("Show advanced" expander).
- Generous whitespace as functional tool, not decoration.
- Typography does heavy lifting — no icons competing for attention.
- One clear next action per screen.

### 11.4 Progressive Disclosure

- New users see simple canvas with basic tools.
- Advanced features (batch generation, custom prompts, API access) revealed after 3+ sessions or explicit "Show advanced" toggle.
- Empty states teach ONE action, not ten.
- Tooltips appear on hover for advanced options, not by default.

### 11.5 Micro-Interactions (Functional, Not Decorative)

- Button press: subtle scale(0.98) + opacity shift — confirms input received.
- Generation progress: stage transitions with smooth height animation, not just text swap.
- Save confirmation: brief checkmark morph on button itself, not a toast.
- Deadline completion: strikethrough animates left-to-right, checkmark draws in.
- Drag-and-drop upload: file ghost follows cursor with subject color tint; drop zone pulses on hover.

### 11.6 Role-Based Adaptive Interface

- **Student (default):** Study-focused view. Generation studio prominent. Deadlines visible. Admin features hidden.
- **Admin:** System health dashboard, user management, audit log viewer, cost analytics, provider status.
- **Owner:** Billing, seat management, organization settings, data export/retention controls.
- Same product, different default views. Neither user sees the other's complexity.

---

## 12. Build Order (Phase-by-Phase)

### Phase 0: Foundation

1. Database schema (Drizzle, all tables, indexes, relations)
2. Design tokens (colors, typography, spacing, shadows, breakpoints) in CSS variables + Tailwind config
3. Bare Worker-to-Postgres path (health check endpoint)
4. Auth scaffold (Better Auth setup in Hono Worker, Drizzle adapter, email/password + OAuth, login/register UI)

### Phase 1: Client-Side Core

5. IndexedDB scaffold (Dexie schema for chat, drafts, attachments, offline queue)
6. Two-panel shell layout (responsive, collapsible sidebar, mobile drawer)
7. Folder/Subject CRUD (with pin, rename, delete, color picker)
8. Semester dashboard (bento grid, stats, deadline aggregation)

### Phase 2: First AI Pipeline

9. One AI provider wired end-to-end for `generate_notes` only
10. File upload + extraction pipeline (PDF text extraction, image OCR, audio transcription)
11. Generation Studio overlay (configuration panel, source upload, staged progress)
12. Material viewer (notes renderer with proper typography)

### Phase 3: Hardening

13. Cost controls (daily/monthly caps, generation_events table, idempotency)
14. Circuit breakers (provider failure + spend ceilings)
15. Error boundaries + graceful degradation
16. Rate limiting + input validation hardened

### Phase 4: Full Material Suite

17. Cheatsheet, Infographic, Flashcards, Quiz, Assignment, Presentation generation
18. Refinement chat (versioning, turn caps)
19. Post-save summary screen
20. Material type switchers (reuse sources)

### Phase 5: Deadlines & Polish

21. Deadline CRUD with urgency color coding
22. Calendar view (monthly grid)
23. Deadline export (txt + PDF)
24. Command palette (Cmd+K)
25. Notification preferences UI (settings page, toggles, timezone, format)
26. Email template system (Handlebars, HTML + plain variants, versioned)
27. Weekly digest scheduler (cron + Durable Object queue + SES primary)
28. 24h deadline alert scheduler (15-min background job + batching)
29. SES + ZeptoMail fallback wiring (provider health checks, automatic failover)
30. SNS webhook endpoints (bounce, complaint, delivery tracking)
31. Notification delivery history + in-app status

### Phase 6: Ask AI & Global Features

32. Global Ask AI panel (chat, attachments, context picker)
33. Chat history sidebar (conversations, rename, delete, export, import)
34. Full-page chat view
35. Save AI responses as materials

### Phase 7: Enterprise Hardening

36. RBAC + admin dashboard
37. Audit log viewer
38. Data export (full account archive)
39. Account deletion + right to erasure
40. Accessibility audit (WCAG 2.2 AA)
41. Performance audit (Core Web Vitals)
42. Security audit (penetration test, dependency audit)

---

## 13. Legal Posture

- **Responsibility sits with the user via ToS**, not platform-side policing.
- Required clauses (drafting brief for lawyer):
- AI-output accuracy disclaimer
- Explicit user-responsibility clause for `complete_assignment` output regarding academic integrity
- Source-material upload representations (user warrants they have rights to uploaded material)
- Indemnification
- Data processing agreement (GDPR)
- Limitation of liability
- **Never ship ToS copy without legal review.**

---

## 14. Quality Gates

Before any feature ships:

- [ ] Zod validation on all API inputs
- [ ] Error boundary covers the feature
- [ ] Keyboard-navigable
- [ ] Screen-reader tested
- [ ] Color contrast checked
- [ ] Mobile responsive
- [ ] Loading states designed (not generic spinner)
- [ ] Empty states designed (demonstration, not placeholder)
- [ ] Audit log entry added (if user-mutating)
- [ ] Generation event logging (if AI-invoking)
- [ ] Rate limiting tested
- [ ] Idempotency tested