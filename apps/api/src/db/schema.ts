import {
  sqliteTable,
  text,
  integer,
  real,
} from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

// --- Type definitions ---
export type RoleType = 'student' | 'admin' | 'owner';
export type GenerationTier = 'free' | 'premium' | 'enterprise';
export type MaterialType =
  | 'notes'
  | 'cheatsheet'
  | 'infographic'
  | 'flashcards'
  | 'quiz'
  | 'assignment'
  | 'presentation'
  | 'other';
export type SourceMaterialType =
  | 'pdf'
  | 'doc'
  | 'docx'
  | 'xls'
  | 'xlsx'
  | 'csv'
  | 'md'
  | 'txt'
  | 'audio'
  | 'video'
  | 'url'
  | 'youtube'
  | 'image'
  | 'pasted_text';
export type Weekday =
  | 'monday'
  | 'tuesday'
  | 'wednesday'
  | 'thursday'
  | 'friday'
  | 'saturday'
  | 'sunday';
export type EmailFormat = 'html' | 'plain';
export type NotificationType = 'weekly_digest' | 'deadline_alert';
export type NotificationProvider = 'ses' | 'zeptomail';
export type NotificationStatus =
  | 'queued'
  | 'sent'
  | 'delivered'
  | 'bounced'
  | 'complained'
  | 'failed';
export type ChatRole = 'user' | 'assistant' | 'system';
export type GenerationStatus = 'success' | 'retry' | 'fallback' | 'failed';

// Helper for generating UUID v4 in JS/SQLite
const randomId = () => crypto.randomUUID();

// --- Better Auth Core Tables (SQLite) ---

export const user = sqliteTable('user', {
  id: text('id').primaryKey().$defaultFn(randomId),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: integer('email_verified', { mode: 'boolean' }).default(false).notNull(),
  image: text('image'),
  createdAt: integer('created_at', { mode: 'timestamp_ms' })
    .default(sql`(CURRENT_TIMESTAMP)`)
    .notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp_ms' })
    .default(sql`(CURRENT_TIMESTAMP)`)
    .notNull(),
  // Extended eStudesk Profile Fields
  generationTier: text('generation_tier', { enum: ['free', 'premium', 'enterprise'] })
    .default('free')
    .notNull(),
  creditBalance: integer('credit_balance').default(100).notNull(),
  dailyGenerationCount: integer('daily_generation_count').default(0).notNull(),
  monthlyGenerationCount: integer('monthly_generation_count').default(0).notNull(),
  dailyGenerationReset: integer('daily_generation_reset', { mode: 'timestamp_ms' }),
  monthlyGenerationReset: integer('monthly_generation_reset', { mode: 'timestamp_ms' }),
  institution: text('institution'),
  fieldOfStudy: text('field_of_study'),
  bio: text('bio'),
  billingAddress: text('billing_address', { mode: 'json' }),
  timezone: text('timezone').default('UTC').notNull(),
  deletedAt: integer('deleted_at', { mode: 'timestamp_ms' }),
});

export const session = sqliteTable('session', {
  id: text('id').primaryKey().$defaultFn(randomId),
  expiresAt: integer('expires_at', { mode: 'timestamp_ms' }).notNull(),
  token: text('token').notNull().unique(),
  createdAt: integer('created_at', { mode: 'timestamp_ms' })
    .default(sql`(CURRENT_TIMESTAMP)`)
    .notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp_ms' })
    .default(sql`(CURRENT_TIMESTAMP)`)
    .notNull(),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
});

export const account = sqliteTable('account', {
  id: text('id').primaryKey().$defaultFn(randomId),
  accountId: text('account_id').notNull(),
  providerId: text('provider_id').notNull(),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  accessToken: text('access_token'),
  refreshToken: text('refresh_token'),
  idToken: text('id_token'),
  accessTokenExpiresAt: integer('access_token_expires_at', { mode: 'timestamp_ms' }),
  refreshTokenExpiresAt: integer('refresh_token_expires_at', { mode: 'timestamp_ms' }),
  scope: text('scope'),
  password: text('password'),
  createdAt: integer('created_at', { mode: 'timestamp_ms' })
    .default(sql`(CURRENT_TIMESTAMP)`)
    .notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp_ms' })
    .default(sql`(CURRENT_TIMESTAMP)`)
    .notNull(),
});

export const verification = sqliteTable('verification', {
  id: text('id').primaryKey().$defaultFn(randomId),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: integer('expires_at', { mode: 'timestamp_ms' }).notNull(),
  createdAt: integer('created_at', { mode: 'timestamp_ms' }).default(sql`(CURRENT_TIMESTAMP)`),
  updatedAt: integer('updated_at', { mode: 'timestamp_ms' }).default(sql`(CURRENT_TIMESTAMP)`),
});

// --- Role-Based Access Control ---

export const userRoles = sqliteTable('user_roles', {
  id: text('id').primaryKey().$defaultFn(randomId),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  role: text('role', { enum: ['student', 'admin', 'owner'] }).default('student').notNull(),
  assignedBy: text('assigned_by').references(() => user.id),
  assignedAt: integer('assigned_at', { mode: 'timestamp_ms' })
    .default(sql`(CURRENT_TIMESTAMP)`)
    .notNull(),
});

export const auditLogs = sqliteTable('audit_logs', {
  id: text('id').primaryKey().$defaultFn(randomId),
  actorId: text('actor_id').references(() => user.id, { onDelete: 'set null' }),
  action: text('action').notNull(),
  resourceType: text('resource_type').notNull(),
  resourceId: text('resource_id'),
  beforeState: text('before_state', { mode: 'json' }),
  afterState: text('after_state', { mode: 'json' }),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  createdAt: integer('created_at', { mode: 'timestamp_ms' })
    .default(sql`(CURRENT_TIMESTAMP)`)
    .notNull(),
});

// --- Organizational Hierarchy (Semesters & Subjects) ---

export const folders = sqliteTable('folders', {
  id: text('id').primaryKey().$defaultFn(randomId),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  color: text('color').default('#4F46E5').notNull(),
  sortOrder: integer('sort_order').default(0).notNull(),
  isPinned: integer('is_pinned', { mode: 'boolean' }).default(false).notNull(),
  createdAt: integer('created_at', { mode: 'timestamp_ms' })
    .default(sql`(CURRENT_TIMESTAMP)`)
    .notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp_ms' })
    .default(sql`(CURRENT_TIMESTAMP)`)
    .notNull(),
});

export const subjects = sqliteTable('subjects', {
  id: text('id').primaryKey().$defaultFn(randomId),
  folderId: text('folder_id')
    .notNull()
    .references(() => folders.id, { onDelete: 'cascade' }),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  color: text('color').notNull(),
  sortOrder: integer('sort_order').default(0).notNull(),
  isPinned: integer('is_pinned', { mode: 'boolean' }).default(false).notNull(),
  createdAt: integer('created_at', { mode: 'timestamp_ms' })
    .default(sql`(CURRENT_TIMESTAMP)`)
    .notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp_ms' })
    .default(sql`(CURRENT_TIMESTAMP)`)
    .notNull(),
});

// --- Study Materials ---

export const materials = sqliteTable('materials', {
  id: text('id').primaryKey().$defaultFn(randomId),
  subjectId: text('subject_id')
    .notNull()
    .references(() => subjects.id, { onDelete: 'cascade' }),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  type: text('type', {
    enum: [
      'notes',
      'cheatsheet',
      'infographic',
      'flashcards',
      'quiz',
      'assignment',
      'presentation',
      'other',
    ],
  }).notNull(),
  content: text('content', { mode: 'json' }).notNull(),
  version: integer('version').default(1).notNull(),
  sourceIds: text('source_ids', { mode: 'json' }), // stringified array of source IDs
  config: text('config', { mode: 'json' }),
  createdAt: integer('created_at', { mode: 'timestamp_ms' })
    .default(sql`(CURRENT_TIMESTAMP)`)
    .notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp_ms' })
    .default(sql`(CURRENT_TIMESTAMP)`)
    .notNull(),
});

export const materialVersions = sqliteTable('material_versions', {
  id: text('id').primaryKey().$defaultFn(randomId),
  materialId: text('material_id')
    .notNull()
    .references(() => materials.id, { onDelete: 'cascade' }),
  version: integer('version').notNull(),
  content: text('content', { mode: 'json' }).notNull(),
  config: text('config', { mode: 'json' }),
  createdAt: integer('created_at', { mode: 'timestamp_ms' })
    .default(sql`(CURRENT_TIMESTAMP)`)
    .notNull(),
});

export const extractedSources = sqliteTable('extracted_sources', {
  id: text('id').primaryKey().$defaultFn(randomId),
  subjectId: text('subject_id').references(() => subjects.id, { onDelete: 'set null' }),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  type: text('type').notNull(),
  content: text('content').notNull(),
  metadata: text('metadata', { mode: 'json' }),
  r2Key: text('r2_key'),
  r2ExpiresAt: integer('r2_expires_at', { mode: 'timestamp_ms' }),
  createdAt: integer('created_at', { mode: 'timestamp_ms' })
    .default(sql`(CURRENT_TIMESTAMP)`)
    .notNull(),
});

// --- Deadlines & Notifications ---

export const deadlines = sqliteTable('deadlines', {
  id: text('id').primaryKey().$defaultFn(randomId),
  folderId: text('folder_id')
    .notNull()
    .references(() => folders.id, { onDelete: 'cascade' }),
  subjectId: text('subject_id').references(() => subjects.id, { onDelete: 'set null' }),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  description: text('description'),
  dueDate: integer('due_date', { mode: 'timestamp_ms' }).notNull(),
  isCompleted: integer('is_completed', { mode: 'boolean' }).default(false).notNull(),
  completedAt: integer('completed_at', { mode: 'timestamp_ms' }),
  createdAt: integer('created_at', { mode: 'timestamp_ms' })
    .default(sql`(CURRENT_TIMESTAMP)`)
    .notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp_ms' })
    .default(sql`(CURRENT_TIMESTAMP)`)
    .notNull(),
});

export const notificationPreferences = sqliteTable('notification_preferences', {
  id: text('id').primaryKey().$defaultFn(randomId),
  userId: text('user_id')
    .notNull()
    .unique()
    .references(() => user.id, { onDelete: 'cascade' }),
  weeklyDigestEnabled: integer('weekly_digest_enabled', { mode: 'boolean' }).default(true).notNull(),
  weeklyDigestDay: text('weekly_digest_day').default('monday').notNull(),
  weeklyDigestTime: text('weekly_digest_time').default('08:00').notNull(),
  deadlineAlertEnabled: integer('deadline_alert_enabled', { mode: 'boolean' }).default(true).notNull(),
  deadlineAlertHoursBefore: integer('deadline_alert_hours_before').default(24).notNull(),
  timezone: text('timezone').default('UTC').notNull(),
  emailFormat: text('email_format', { enum: ['html', 'plain'] }).default('html').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp_ms' })
    .default(sql`(CURRENT_TIMESTAMP)`)
    .notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp_ms' })
    .default(sql`(CURRENT_TIMESTAMP)`)
    .notNull(),
});

export const notificationLogs = sqliteTable('notification_logs', {
  id: text('id').primaryKey().$defaultFn(randomId),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  notificationType: text('notification_type').notNull(),
  deadlineId: text('deadline_id').references(() => deadlines.id, { onDelete: 'set null' }),
  provider: text('provider').notNull(),
  providerMessageId: text('provider_message_id'),
  status: text('status').notNull(),
  errorMessage: text('error_message'),
  sentAt: integer('sent_at', { mode: 'timestamp_ms' }),
  deliveredAt: integer('delivered_at', { mode: 'timestamp_ms' }),
  openedAt: integer('opened_at', { mode: 'timestamp_ms' }),
  createdAt: integer('created_at', { mode: 'timestamp_ms' })
    .default(sql`(CURRENT_TIMESTAMP)`)
    .notNull(),
});

export const emailTemplates = sqliteTable('email_templates', {
  id: text('id').primaryKey().$defaultFn(randomId),
  templateKey: text('template_key').notNull().unique(),
  subjectLine: text('subject_line').notNull(),
  htmlBody: text('html_body').notNull(),
  plainBody: text('plain_body').notNull(),
  version: integer('version').default(1).notNull(),
  isActive: integer('is_active', { mode: 'boolean' }).default(true).notNull(),
  createdAt: integer('created_at', { mode: 'timestamp_ms' })
    .default(sql`(CURRENT_TIMESTAMP)`)
    .notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp_ms' })
    .default(sql`(CURRENT_TIMESTAMP)`)
    .notNull(),
});

// --- Chat & Global Ask AI ---

export const conversations = sqliteTable('conversations', {
  id: text('id').primaryKey().$defaultFn(randomId),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  title: text('title').default('New conversation').notNull(),
  subjectContextIds: text('subject_context_ids', { mode: 'json' }), // stringified array
  createdAt: integer('created_at', { mode: 'timestamp_ms' })
    .default(sql`(CURRENT_TIMESTAMP)`)
    .notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp_ms' })
    .default(sql`(CURRENT_TIMESTAMP)`)
    .notNull(),
});

export const chatMessages = sqliteTable('chat_messages', {
  id: text('id').primaryKey().$defaultFn(randomId),
  conversationId: text('conversation_id')
    .notNull()
    .references(() => conversations.id, { onDelete: 'cascade' }),
  role: text('role', { enum: ['user', 'assistant', 'system'] }).notNull(),
  content: text('content').notNull(),
  attachments: text('attachments', { mode: 'json' }),
  webSearchUsed: integer('web_search_used', { mode: 'boolean' }).default(false).notNull(),
  pageContextUsed: integer('page_context_used', { mode: 'boolean' }).default(false).notNull(),
  tokenCount: integer('token_count'),
  createdAt: integer('created_at', { mode: 'timestamp_ms' })
    .default(sql`(CURRENT_TIMESTAMP)`)
    .notNull(),
});

// --- AI Router & Telemetry ---

export const generationEvents = sqliteTable('generation_events', {
  id: text('id').primaryKey().$defaultFn(randomId),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  materialType: text('material_type').notNull(),
  provider: text('provider').notNull(),
  model: text('model').notNull(),
  promptTokens: integer('prompt_tokens').notNull(),
  completionTokens: integer('completion_tokens').notNull(),
  estimatedCostUsd: real('estimated_cost_usd').notNull(),
  status: text('status', { enum: ['success', 'retry', 'fallback', 'failed'] }).notNull(),
  errorMessage: text('error_message'),
  latencyMs: integer('latency_ms').notNull(),
  idempotencyKey: text('idempotency_key').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp_ms' })
    .default(sql`(CURRENT_TIMESTAMP)`)
    .notNull(),
});

// --- Subscription Plans (Database-Driven Dynamic Pricing) ---

export const subscriptionPlans = sqliteTable('subscription_plans', {
  id: text('id').primaryKey(), // 'free', 'pro_monthly', 'pro_semester', 'pro_yearly'
  name: text('name').notNull(),
  billingCycle: text('billing_cycle', { enum: ['once', 'monthly', 'semester', 'yearly'] }).notNull(),
  durationMonths: integer('duration_months').default(1).notNull(),
  priceAmount: real('price_amount').default(0).notNull(),
  currency: text('currency').default('USD').notNull(),
  discountPercent: integer('discount_percent').default(0).notNull(),
  discountReason: text('discount_reason'),
  isActive: integer('is_active', { mode: 'boolean' }).default(true).notNull(),
  aiCreditsMonthly: integer('ai_credits_monthly').default(1000).notNull(),
  features: text('features', { mode: 'json' }).notNull(), // array of strings
  paypalPlanId: text('paypal_plan_id'),
  sortOrder: integer('sort_order').default(0).notNull(),
  createdAt: integer('created_at', { mode: 'timestamp_ms' })
    .default(sql`(CURRENT_TIMESTAMP)`)
    .notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp_ms' })
    .default(sql`(CURRENT_TIMESTAMP)`)
    .notNull(),
});

// --- Active User Subscriptions ---

export const subscriptions = sqliteTable('subscriptions', {
  id: text('id').primaryKey().$defaultFn(randomId),
  userId: text('user_id')
    .notNull()
    .unique()
    .references(() => user.id, { onDelete: 'cascade' }),
  planId: text('plan_id')
    .notNull()
    .references(() => subscriptionPlans.id),
  paypalSubscriptionId: text('paypal_subscription_id'),
  paypalPayerId: text('paypal_payer_id'),
  status: text('status', { enum: ['active', 'canceled', 'past_due', 'paused', 'expired'] })
    .default('active')
    .notNull(),
  billingCycle: text('billing_cycle', { enum: ['once', 'monthly', 'semester', 'yearly'] }).notNull(),
  currentPeriodStart: integer('current_period_start', { mode: 'timestamp_ms' })
    .default(sql`(CURRENT_TIMESTAMP)`)
    .notNull(),
  currentPeriodEnd: integer('current_period_end', { mode: 'timestamp_ms' }).notNull(),
  cancelAtPeriodEnd: integer('cancel_at_period_end', { mode: 'boolean' }).default(false).notNull(),
  canceledAt: integer('canceled_at', { mode: 'timestamp_ms' }),
  createdAt: integer('created_at', { mode: 'timestamp_ms' })
    .default(sql`(CURRENT_TIMESTAMP)`)
    .notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp_ms' })
    .default(sql`(CURRENT_TIMESTAMP)`)
    .notNull(),
});

// --- Billing Invoices & Receipts ---

export const invoices = sqliteTable('invoices', {
  id: text('id').primaryKey().$defaultFn(randomId),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  subscriptionId: text('subscription_id').references(() => subscriptions.id, { onDelete: 'set null' }),
  invoiceNumber: text('invoice_number').notNull().unique(),
  amount: real('amount').notNull(),
  currency: text('currency').default('USD').notNull(),
  status: text('status', { enum: ['paid', 'pending', 'failed', 'refunded'] }).default('paid').notNull(),
  planName: text('plan_name').notNull(),
  billingPeriod: text('billing_period'),
  paypalOrderId: text('paypal_order_id'),
  pdfUrl: text('pdf_url'),
  paidAt: integer('paid_at', { mode: 'timestamp_ms' }).default(sql`(CURRENT_TIMESTAMP)`),
  createdAt: integer('created_at', { mode: 'timestamp_ms' })
    .default(sql`(CURRENT_TIMESTAMP)`)
    .notNull(),
});

// --- Payment Methods ---

export const paymentMethods = sqliteTable('payment_methods', {
  id: text('id').primaryKey().$defaultFn(randomId),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  type: text('type', { enum: ['paypal', 'card'] }).default('paypal').notNull(),
  brand: text('brand'), // 'visa', 'mastercard', 'paypal', etc.
  last4: text('last4'),
  paypalEmail: text('paypal_email'),
  isDefault: integer('is_default', { mode: 'boolean' }).default(true).notNull(),
  createdAt: integer('created_at', { mode: 'timestamp_ms' })
    .default(sql`(CURRENT_TIMESTAMP)`)
    .notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp_ms' })
    .default(sql`(CURRENT_TIMESTAMP)`)
    .notNull(),
});

// --- Credit Usage & Telemetry Transactions ---

export const creditTransactions = sqliteTable('credit_transactions', {
  id: text('id').primaryKey().$defaultFn(randomId),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  amount: integer('amount').notNull(), // negative for spend (-1, -5), positive for grant (+1000)
  type: text('type', { enum: ['monthly_grant', 'initial_grant', 'generation_spend', 'chat_spend', 'bonus'] }).notNull(),
  materialType: text('material_type'), // 'notes', 'quiz', 'chat', etc.
  balanceAfter: integer('balance_after').notNull(),
  description: text('description').notNull(),
  metadata: text('metadata', { mode: 'json' }),
  createdAt: integer('created_at', { mode: 'timestamp_ms' })
    .default(sql`(CURRENT_TIMESTAMP)`)
    .notNull(),
});

