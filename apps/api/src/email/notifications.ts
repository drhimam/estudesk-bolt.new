import { eq, and, sql, lte, gte } from 'drizzle-orm';
import * as schema from '../db/schema';
import { sendZeptoMail } from './zeptomail';
import {
  renderVerificationEmail,
  renderResetPasswordEmail,
  renderWeeklyDigestEmail,
  renderDeadlineAlertEmail,
  renderTestEmail,
  DeadlineItem,
} from './templates';

export interface EmailEnvBindings {
  ZEPTOMAIL_API_KEY?: string;
  ZEPTOMAIL_API_URL?: string;
  EMAIL_FROM_ADDRESS?: string;
  EMAIL_FROM_NAME?: string;
  FRONTEND_URL?: string;
}

/**
 * Log notification dispatch to Turso notification_logs table
 */
export async function logNotification(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  db: any,
  entry: {
    userId: string;
    notificationType: string;
    deadlineId?: string | null;
    provider: string;
    providerMessageId?: string | null;
    status: string;
    errorMessage?: string | null;
  }
) {
  try {
    await db.insert(schema.notificationLogs).values({
      id: crypto.randomUUID(),
      userId: entry.userId,
      notificationType: entry.notificationType,
      deadlineId: entry.deadlineId || null,
      provider: entry.provider,
      providerMessageId: entry.providerMessageId || null,
      status: entry.status,
      errorMessage: entry.errorMessage || null,
      sentAt: entry.status === 'sent' ? new Date() : null,
      createdAt: new Date(),
    });
  } catch (err) {
    console.error('[NotificationLog] Failed to log notification:', err);
  }
}

/**
 * Send Email Verification link via Zoho ZeptoMail Canada
 */
export async function sendVerificationNotification(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  db: any,
  env: EmailEnvBindings,
  user: { id: string; name?: string | null; email: string },
  token: string,
  _url?: string
) {
  const frontendUrl = (env.FRONTEND_URL || 'https://estudesk.com').replace(/\/+$/, '');
  const verificationUrl = `${frontendUrl}/?token=${encodeURIComponent(token)}&action=verify-email`;

  const { html, text } = renderVerificationEmail({
    userName: user.name || user.email.split('@')[0],
    verificationUrl,
  });

  const res = await sendZeptoMail({
    toEmail: user.email,
    toName: user.name || user.email.split('@')[0],
    subject: 'Verify your email address - eStudesk',
    htmlBody: html,
    textBody: text,
    apiKey: env.ZEPTOMAIL_API_KEY,
    apiUrl: env.ZEPTOMAIL_API_URL || 'https://api.zeptomail.ca/v1.1/email',
    fromEmail: env.EMAIL_FROM_ADDRESS,
    fromName: env.EMAIL_FROM_NAME,
  });

  await logNotification(db, {
    userId: user.id,
    notificationType: 'email_verification',
    provider: 'zeptomail',
    providerMessageId: res.messageId,
    status: res.success ? 'sent' : 'failed',
    errorMessage: res.error,
  });

  return res;
}

/**
 * Send Password Reset token link via Zoho ZeptoMail Canada
 */
export async function sendResetPasswordNotification(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  db: any,
  env: EmailEnvBindings,
  user: { id: string; name?: string | null; email: string },
  token: string,
  _url?: string
) {
  const frontendUrl = (env.FRONTEND_URL || 'https://estudesk.com').replace(/\/+$/, '');
  const resetUrl = `${frontendUrl}/?token=${encodeURIComponent(token)}&action=reset-password`;

  const { html, text } = renderResetPasswordEmail({
    userName: user.name || user.email.split('@')[0],
    resetUrl,
    expiresInMinutes: 60,
  });

  const res = await sendZeptoMail({
    toEmail: user.email,
    toName: user.name || user.email.split('@')[0],
    subject: 'Reset your password - eStudesk',
    htmlBody: html,
    textBody: text,
    apiKey: env.ZEPTOMAIL_API_KEY,
    apiUrl: env.ZEPTOMAIL_API_URL || 'https://api.zeptomail.ca/v1.1/email',
    fromEmail: env.EMAIL_FROM_ADDRESS,
    fromName: env.EMAIL_FROM_NAME,
  });

  await logNotification(db, {
    userId: user.id,
    notificationType: 'forgot_password',
    provider: 'zeptomail',
    providerMessageId: res.messageId,
    status: res.success ? 'sent' : 'failed',
    errorMessage: res.error,
  });

  return res;
}

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

/**
 * Check rate limit for on-demand emails (1 per month per user)
 */
export async function checkRateLimit(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  db: any,
  userId: string,
  notificationType: 'test_email' | 'weekly_digest_preview'
): Promise<{ allowed: boolean; nextAllowedAt?: Date; remainingDays?: number }> {
  try {
    const logs = await db
      .select()
      .from(schema.notificationLogs)
      .where(
        and(
          eq(schema.notificationLogs.userId, userId),
          eq(schema.notificationLogs.notificationType, notificationType),
          eq(schema.notificationLogs.status, 'sent')
        )
      )
      .orderBy(sql`${schema.notificationLogs.createdAt} DESC`)
      .limit(1);

    if (!logs || logs.length === 0) {
      return { allowed: true };
    }

    const lastSent = new Date(logs[0].createdAt);
    const timeSince = Date.now() - lastSent.getTime();

    if (timeSince < THIRTY_DAYS_MS) {
      const nextAllowedAt = new Date(lastSent.getTime() + THIRTY_DAYS_MS);
      const remainingDays = Math.max(1, Math.ceil((nextAllowedAt.getTime() - Date.now()) / (24 * 60 * 60 * 1000)));
      return { allowed: false, nextAllowedAt, remainingDays };
    }

    return { allowed: true };
  } catch (err) {
    console.error('[RateLimitCheck] Error checking rate limit:', err);
    return { allowed: true };
  }
}

/**
 * Send a Test Email to verify eStudesk Cloud Mail pipeline (Limit: 1 per month per user)
 */
export async function sendTestEmailNotification(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  db: any,
  env: EmailEnvBindings,
  user: { id: string; name?: string | null; email: string }
) {
  // Enforce 1 test email per month limit
  const limit = await checkRateLimit(db, user.id, 'test_email');
  if (!limit.allowed) {
    const nextDate = limit.nextAllowedAt?.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
    return {
      success: false,
      error: `Monthly limit reached (1 test email per month). Next test email will be available on ${nextDate || 'in a few days'}.`,
    };
  }

  const apiUrl = env.ZEPTOMAIL_API_URL || 'https://api.zeptomail.ca/v1.1/email';
  const { html, text } = renderTestEmail({
    userName: user.name || user.email.split('@')[0],
    userEmail: user.email,
    timestamp: new Date().toUTCString(),
    apiUrl,
  });

  const res = await sendZeptoMail({
    toEmail: user.email,
    toName: user.name || user.email.split('@')[0],
    subject: '✓ eStudesk Cloud Mail Connection Verified',
    htmlBody: html,
    textBody: text,
    apiKey: env.ZEPTOMAIL_API_KEY,
    apiUrl,
    fromEmail: env.EMAIL_FROM_ADDRESS,
    fromName: env.EMAIL_FROM_NAME,
  });

  await logNotification(db, {
    userId: user.id,
    notificationType: 'test_email',
    provider: 'zeptomail',
    providerMessageId: res.messageId,
    status: res.success ? 'sent' : 'failed',
    errorMessage: res.error,
  });

  return res;
}

/**
 * Build and send Weekly Deadline Digest for a specific user
 * @param isPreview When true, triggered on-demand (subject to 1/month preview limit & always dispatches email even if 0 items)
 */
export async function sendWeeklyDigestForUser(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  db: any,
  env: EmailEnvBindings,
  userId: string,
  isPreview = false
) {
  if (isPreview) {
    const limit = await checkRateLimit(db, userId, 'weekly_digest_preview');
    if (!limit.allowed) {
      const nextDate = limit.nextAllowedAt?.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
      return {
        success: false,
        error: `Monthly limit reached (1 digest preview per month). Next preview will be available on ${nextDate || 'in a few days'}.`,
      };
    }
  }

  // Fetch user
  const users = await db.select().from(schema.user).where(eq(schema.user.id, userId)).limit(1);
  if (users.length === 0) {
    return { success: false, error: 'User not found' };
  }
  const user = users[0];

  // Fetch subjects and folders for naming
  const userSubjects = await db.select().from(schema.subjects).where(eq(schema.subjects.userId, userId));
  const userFolders = await db.select().from(schema.folders).where(eq(schema.folders.userId, userId));

  const subjectMap = new Map<string, { name: string; color: string }>();
  userSubjects.forEach((s: { id: string; name: string; color: string }) => {
    subjectMap.set(s.id, { name: s.name, color: s.color });
  });

  const folderMap = new Map<string, string>();
  userFolders.forEach((f: { id: string; name: string }) => {
    folderMap.set(f.id, f.name);
  });

  // Fetch active/uncompleted deadlines
  const allDeadlines = await db
    .select()
    .from(schema.deadlines)
    .where(and(eq(schema.deadlines.userId, userId), eq(schema.deadlines.isCompleted, false)));

  // Automated scheduled cron skip if no deadlines, but PREVIEW always dispatches!
  if (!isPreview && allDeadlines.length === 0) {
    return { success: true, message: 'No active deadlines to digest; skipped sending.' };
  }

  const deadlineItems: DeadlineItem[] = allDeadlines.map((d: { id: string; title: string; description?: string | null; subjectId?: string | null; dueDate: number | Date | string }) => {
    const due = new Date(d.dueDate);
    const sub = d.subjectId ? subjectMap.get(d.subjectId) : undefined;
    return {
      id: d.id,
      title: d.title,
      description: d.description,
      subjectName: sub?.name,
      subjectColor: sub?.color,
      dueDate: due,
    };
  });

  const activeFolderName = userFolders[0]?.name || 'Current Term';
  const frontendUrl = env.FRONTEND_URL || 'https://estudesk.com';

  const { html, text, totalCount } = renderWeeklyDigestEmail({
    userName: user.name || user.email.split('@')[0],
    semesterName: activeFolderName,
    appUrl: frontendUrl,
    deadlines: deadlineItems,
  });

  const subjectPrefix = isPreview ? '[Preview] ' : '';
  const subjectLine = totalCount > 0
    ? `${subjectPrefix}Your week ahead — ${totalCount} deadline${totalCount > 1 ? 's' : ''} in ${activeFolderName}`
    : `${subjectPrefix}Weekly Briefing — All caught up in ${activeFolderName}`;

  const res = await sendZeptoMail({
    toEmail: user.email,
    toName: user.name || user.email.split('@')[0],
    subject: subjectLine,
    htmlBody: html,
    textBody: text,
    apiKey: env.ZEPTOMAIL_API_KEY,
    apiUrl: env.ZEPTOMAIL_API_URL || 'https://api.zeptomail.ca/v1.1/email',
    fromEmail: env.EMAIL_FROM_ADDRESS,
    fromName: env.EMAIL_FROM_NAME,
  });

  await logNotification(db, {
    userId: user.id,
    notificationType: isPreview ? 'weekly_digest_preview' : 'weekly_digest',
    provider: 'zeptomail',
    providerMessageId: res.messageId,
    status: res.success ? 'sent' : 'failed',
    errorMessage: res.error,
  });

  return res;
}

/**
 * Scan and send 24h deadline alerts
 */
export async function processDeadlineAlerts(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  db: any,
  env: EmailEnvBindings
) {
  const now = new Date();
  const alertWindowEnd = new Date(now.getTime() + 24 * 60 * 60 * 1000); // within 24h

  // Fetch uncompleted deadlines due between now and next 24h
  const upcoming = await db
    .select()
    .from(schema.deadlines)
    .where(
      and(
        eq(schema.deadlines.isCompleted, false),
        gte(schema.deadlines.dueDate, now),
        lte(schema.deadlines.dueDate, alertWindowEnd)
      )
    );

  let processedCount = 0;

  for (const deadline of upcoming) {
    // Check if alert already sent for this deadline
    const existingLog = await db
      .select()
      .from(schema.notificationLogs)
      .where(
        and(
          eq(schema.notificationLogs.userId, deadline.userId),
          eq(schema.notificationLogs.deadlineId, deadline.id),
          eq(schema.notificationLogs.status, 'sent')
        )
      )
      .limit(1);

    if (existingLog.length > 0) {
      continue; // Already notified
    }

    // Get user
    const users = await db.select().from(schema.user).where(eq(schema.user.id, deadline.userId)).limit(1);
    if (users.length === 0) continue;
    const user = users[0];

    // Get subject name if any
    let subjectName: string | undefined;
    if (deadline.subjectId) {
      const subs = await db.select().from(schema.subjects).where(eq(schema.subjects.id, deadline.subjectId)).limit(1);
      subjectName = subs[0]?.name;
    }

    const frontendUrl = env.FRONTEND_URL || 'https://estudesk.com';

    const { html, text } = renderDeadlineAlertEmail({
      userName: user.name || user.email.split('@')[0],
      deadlineTitle: deadline.title,
      subjectName,
      dueDate: new Date(deadline.dueDate),
      description: deadline.description || undefined,
      actionUrl: frontendUrl,
    });

    const res = await sendZeptoMail({
      toEmail: user.email,
      toName: user.name || user.email.split('@')[0],
      subject: `⏰ Due tomorrow: ${deadline.title}`,
      htmlBody: html,
      textBody: text,
      apiKey: env.ZEPTOMAIL_API_KEY,
      apiUrl: env.ZEPTOMAIL_API_URL || 'https://api.zeptomail.ca/v1.1/email',
      fromEmail: env.EMAIL_FROM_ADDRESS,
      fromName: env.EMAIL_FROM_NAME,
    });

    await logNotification(db, {
      userId: user.id,
      notificationType: 'deadline_alert',
      deadlineId: deadline.id,
      provider: 'zeptomail',
      providerMessageId: res.messageId,
      status: res.success ? 'sent' : 'failed',
      errorMessage: res.error,
    });

    processedCount++;
  }

  return { processedCount };
}

/**
 * Get or create default notification preferences for a user
 */
export async function getNotificationPreferences(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  db: any,
  userId: string
) {
  const existing = await db
    .select()
    .from(schema.notificationPreferences)
    .where(eq(schema.notificationPreferences.userId, userId))
    .limit(1);

  if (existing.length > 0) {
    return existing[0];
  }

  const defaultPrefs = {
    id: crypto.randomUUID(),
    userId,
    weeklyDigestEnabled: true,
    weeklyDigestDay: 'monday',
    weeklyDigestTime: '08:00',
    deadlineAlertEnabled: true,
    deadlineAlertHoursBefore: 24,
    timezone: 'UTC',
    emailFormat: 'html' as const,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  await db.insert(schema.notificationPreferences).values(defaultPrefs);
  return defaultPrefs;
}

/**
 * Update notification preferences for a user
 */
export async function updateNotificationPreferences(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  db: any,
  userId: string,
  prefs: Partial<{
    weeklyDigestEnabled: boolean;
    weeklyDigestDay: string;
    weeklyDigestTime: string;
    deadlineAlertEnabled: boolean;
    deadlineAlertHoursBefore: number | string;
    timezone: string;
    emailFormat: 'html' | 'plain';
  }>
) {
  await getNotificationPreferences(db, userId); // ensure row exists

  const updates: Record<string, unknown> = {
    updatedAt: new Date(),
  };

  if (typeof prefs.weeklyDigestEnabled === 'boolean') {
    updates.weeklyDigestEnabled = prefs.weeklyDigestEnabled;
  }
  if (typeof prefs.weeklyDigestDay === 'string' && prefs.weeklyDigestDay.trim()) {
    updates.weeklyDigestDay = prefs.weeklyDigestDay.trim();
  }
  if (typeof prefs.weeklyDigestTime === 'string' && prefs.weeklyDigestTime.trim()) {
    updates.weeklyDigestTime = prefs.weeklyDigestTime.trim();
  }
  if (typeof prefs.deadlineAlertEnabled === 'boolean') {
    updates.deadlineAlertEnabled = prefs.deadlineAlertEnabled;
  }
  if (prefs.deadlineAlertHoursBefore !== undefined && prefs.deadlineAlertHoursBefore !== null) {
    const hours = Number(prefs.deadlineAlertHoursBefore);
    if (!isNaN(hours) && hours > 0) {
      updates.deadlineAlertHoursBefore = hours;
    }
  }
  if (typeof prefs.timezone === 'string' && prefs.timezone.trim()) {
    updates.timezone = prefs.timezone.trim();
  }
  if (prefs.emailFormat === 'html' || prefs.emailFormat === 'plain') {
    updates.emailFormat = prefs.emailFormat;
  }

  await db
    .update(schema.notificationPreferences)
    .set(updates)
    .where(eq(schema.notificationPreferences.userId, userId));

  return getNotificationPreferences(db, userId);
}

/**
 * Get recent notification logs for user
 */
export async function getNotificationLogs(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  db: any,
  userId: string,
  limit = 20
) {
  return db
    .select()
    .from(schema.notificationLogs)
    .where(eq(schema.notificationLogs.userId, userId))
    .orderBy(sql`${schema.notificationLogs.createdAt} DESC`)
    .limit(limit);
}
