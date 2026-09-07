import {
  pgTable,
  uuid,
  varchar,
  text,
  boolean,
  integer,
  decimal,
  timestamp,
  jsonb,
  pgEnum,
  time,
  inet,
} from 'drizzle-orm/pg-core';

// --- Enums ---
export const roleEnum = pgEnum('role_type', ['student', 'admin', 'owner']);
export const generationTierEnum = pgEnum('generation_tier', ['free', 'premium', 'enterprise']);
export const materialTypeEnum = pgEnum('material_type', [
  'notes',
  'cheatsheet',
  'infographic',
  'flashcards',
  'quiz',
  'assignment',
  'presentation',
]);
export const sourceMaterialTypeEnum = pgEnum('source_material_type', [
  'pdf',
  'doc',
  'docx',
  'xls',
  'xlsx',
  'csv',
  'md',
  'txt',
  'audio',
  'video',
  'url',
  'youtube',
  'image',
  'pasted_text',
]);
export const weekdayEnum = pgEnum('weekday', [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
]);
export const emailFormatEnum = pgEnum('email_format', ['html', 'plain']);
export const notificationTypeEnum = pgEnum('notification_type', ['weekly_digest', 'deadline_alert']);
export const notificationProviderEnum = pgEnum('notification_provider', ['ses', 'zeptomail']);
export const notificationStatusEnum = pgEnum('notification_status', [
  'queued',
  'sent',
  'delivered',
  'bounced',
  'complained',
  'failed',
]);
export const chatRoleEnum = pgEnum('chat_role', ['user', 'assistant', 'system']);
export const generationStatusEnum = pgEnum('generation_status', [
  'success',
  'retry',
  'fallback',
  'failed',
]);

// --- Better Auth Core Tables ---

export const user = pgTable('user', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: boolean('email_verified').notNull().default(false),
  image: text('image'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  // Extended eStudesk Profile Fields
  generationTier: generationTierEnum('generation_tier').default('free').notNull(),
  dailyGenerationCount: integer('daily_generation_count').default(0).notNull(),
  monthlyGenerationCount: integer('monthly_generation_count').default(0).notNull(),
  dailyGenerationReset: timestamp('daily_generation_reset'),
  monthlyGenerationReset: timestamp('monthly_generation_reset'),
  timezone: varchar('timezone', { length: 50 }).default('UTC').notNull(),
  deletedAt: timestamp('deleted_at'),
});

export const session = pgTable('session', {
  id: text('id').primaryKey(),
  expiresAt: timestamp('expires_at').notNull(),
  token: text('token').notNull().unique(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
});

export const account = pgTable('account', {
  id: text('id').primaryKey(),
  accountId: text('account_id').notNull(),
  providerId: text('provider_id').notNull(),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  accessToken: text('access_token'),
  refreshToken: text('refresh_token'),
  idToken: text('id_token'),
  accessTokenExpiresAt: timestamp('access_token_expires_at'),
  refreshTokenExpiresAt: timestamp('refresh_token_expires_at'),
  scope: text('scope'),
  password: text('password'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const verification = pgTable('verification', {
  id: text('id').primaryKey(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// --- Role-Based Access Control ---

export const userRoles = pgTable('user_roles', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  role: roleEnum('role').default('student').notNull(),
  assignedBy: text('assigned_by').references(() => user.id),
  assignedAt: timestamp('assigned_at').defaultNow().notNull(),
});

export const auditLogs = pgTable('audit_logs', {
  id: uuid('id').defaultRandom().primaryKey(),
  actorId: text('actor_id').references(() => user.id, { onDelete: 'set null' }),
  action: varchar('action', { length: 100 }).notNull(),
  resourceType: varchar('resource_type', { length: 50 }).notNull(),
  resourceId: uuid('resource_id'),
  beforeState: jsonb('before_state'),
  afterState: jsonb('after_state'),
  ipAddress: inet('ip_address'),
  userAgent: text('user_agent'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// --- Organizational Hierarchy (Semesters & Subjects) ---

export const folders = pgTable('folders', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 100 }).notNull(),
  color: varchar('color', { length: 7 }).default('#4F46E5').notNull(),
  sortOrder: integer('sort_order').default(0).notNull(),
  isPinned: boolean('is_pinned').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const subjects = pgTable('subjects', {
  id: uuid('id').defaultRandom().primaryKey(),
  folderId: uuid('folder_id')
    .notNull()
    .references(() => folders.id, { onDelete: 'cascade' }),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 100 }).notNull(),
  color: varchar('color', { length: 7 }).notNull(),
  sortOrder: integer('sort_order').default(0).notNull(),
  isPinned: boolean('is_pinned').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// --- Study Materials ---

export const materials = pgTable('materials', {
  id: uuid('id').defaultRandom().primaryKey(),
  subjectId: uuid('subject_id')
    .notNull()
    .references(() => subjects.id, { onDelete: 'cascade' }),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  title: varchar('title', { length: 200 }).notNull(),
  type: materialTypeEnum('type').notNull(),
  content: jsonb('content').notNull(),
  version: integer('version').default(1).notNull(),
  sourceIds: uuid('source_ids').array(),
  config: jsonb('config'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const materialVersions = pgTable('material_versions', {
  id: uuid('id').defaultRandom().primaryKey(),
  materialId: uuid('material_id')
    .notNull()
    .references(() => materials.id, { onDelete: 'cascade' }),
  version: integer('version').notNull(),
  content: jsonb('content').notNull(),
  config: jsonb('config'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const extractedSources = pgTable('extracted_sources', {
  id: uuid('id').defaultRandom().primaryKey(),
  subjectId: uuid('subject_id').references(() => subjects.id, { onDelete: 'set null' }),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 255 }).notNull(),
  type: sourceMaterialTypeEnum('type').notNull(),
  content: text('content').notNull(),
  metadata: jsonb('metadata'),
  r2Key: varchar('r2_key', { length: 500 }),
  r2ExpiresAt: timestamp('r2_expires_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// --- Deadlines & Notifications ---

export const deadlines = pgTable('deadlines', {
  id: uuid('id').defaultRandom().primaryKey(),
  folderId: uuid('folder_id')
    .notNull()
    .references(() => folders.id, { onDelete: 'cascade' }),
  subjectId: uuid('subject_id').references(() => subjects.id, { onDelete: 'set null' }),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  title: varchar('title', { length: 200 }).notNull(),
  description: text('description'),
  dueDate: timestamp('due_date').notNull(),
  isCompleted: boolean('is_completed').default(false).notNull(),
  completedAt: timestamp('completed_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const notificationPreferences = pgTable('notification_preferences', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: text('user_id')
    .notNull()
    .unique()
    .references(() => user.id, { onDelete: 'cascade' }),
  weeklyDigestEnabled: boolean('weekly_digest_enabled').default(true).notNull(),
  weeklyDigestDay: weekdayEnum('weekly_digest_day').default('monday').notNull(),
  weeklyDigestTime: time('weekly_digest_time').default('08:00').notNull(),
  deadlineAlertEnabled: boolean('deadline_alert_enabled').default(true).notNull(),
  deadlineAlertHoursBefore: integer('deadline_alert_hours_before').default(24).notNull(),
  timezone: varchar('timezone', { length: 50 }).default('UTC').notNull(),
  emailFormat: emailFormatEnum('email_format').default('html').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const notificationLogs = pgTable('notification_logs', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  notificationType: notificationTypeEnum('notification_type').notNull(),
  deadlineId: uuid('deadline_id').references(() => deadlines.id, { onDelete: 'set null' }),
  provider: notificationProviderEnum('provider').notNull(),
  providerMessageId: varchar('provider_message_id', { length: 255 }),
  status: notificationStatusEnum('status').notNull(),
  errorMessage: text('error_message'),
  sentAt: timestamp('sent_at'),
  deliveredAt: timestamp('delivered_at'),
  openedAt: timestamp('opened_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const emailTemplates = pgTable('email_templates', {
  id: uuid('id').defaultRandom().primaryKey(),
  templateKey: varchar('template_key', { length: 100 }).notNull().unique(),
  subjectLine: varchar('subject_line', { length: 255 }).notNull(),
  htmlBody: text('html_body').notNull(),
  plainBody: text('plain_body').notNull(),
  version: integer('version').default(1).notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// --- Chat & Global Ask AI ---

export const conversations = pgTable('conversations', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  title: varchar('title', { length: 200 }).default('New conversation').notNull(),
  subjectContextIds: uuid('subject_context_ids').array(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const chatMessages = pgTable('chat_messages', {
  id: uuid('id').defaultRandom().primaryKey(),
  conversationId: uuid('conversation_id')
    .notNull()
    .references(() => conversations.id, { onDelete: 'cascade' }),
  role: chatRoleEnum('role').notNull(),
  content: text('content').notNull(),
  attachments: jsonb('attachments'),
  webSearchUsed: boolean('web_search_used').default(false).notNull(),
  pageContextUsed: boolean('page_context_used').default(false).notNull(),
  tokenCount: integer('token_count'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// --- AI Router & Telemetry ---

export const generationEvents = pgTable('generation_events', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  materialType: varchar('material_type', { length: 50 }).notNull(),
  provider: varchar('provider', { length: 50 }).notNull(),
  model: varchar('model', { length: 100 }).notNull(),
  promptTokens: integer('prompt_tokens').notNull(),
  completionTokens: integer('completion_tokens').notNull(),
  estimatedCostUsd: decimal('estimated_cost_usd', { precision: 10, scale: 6 }).notNull(),
  status: generationStatusEnum('status').notNull(),
  errorMessage: text('error_message'),
  latencyMs: integer('latency_ms').notNull(),
  idempotencyKey: uuid('idempotency_key').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
