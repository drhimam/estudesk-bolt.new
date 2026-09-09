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
  url?: string
) {
  const frontendUrl = env.FRONTEND_URL || 'https://estudesk.com';
  const verificationUrl = url || `${frontendUrl}?token=${token}&action=verify-email`;

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
  url?: string
) {
  const frontendUrl = env.FRONTEND_URL || 'https://estudesk.com';
  const resetUrl = url || `${frontendUrl}?token=${token}&action=reset-password`;

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

/**
 * Send a Test Email to verify Zoho ZeptoMail Canada pipeline
 */
export async function sendTestEmailNotification(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  db: any,
  env: EmailEnvBindings,
  user: { id: string; name?: string | null; email: string }
) {
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
    subject: '✓ ZeptoMail Canada Connection Verified - eStudesk',
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
 */
export async function sendWeeklyDigestForUser(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  db: any,
  env: EmailEnvBindings,
  userId: string
) {
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

  if (allDeadlines.length === 0) {
    return { success: true, message: 'No active deadlines to digest; skipped sending.' };
  }

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);
  const thisWeekEnd = new Date(todayStart.getTime() + 7 * 24 * 60 * 60 * 1000);

  const overdue: DeadlineItem[] = [];
  const dueToday: DeadlineItem[] = [];
  const dueThisWeek: DeadlineItem[] = [];
  const later: DeadlineItem[] = [];

  for (const d of allDeadlines) {
    const due = new Date(d.dueDate);
    const sub = d.subjectId ? subjectMap.get(d.subjectId) : undefined;
    const diffDays = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    const item: DeadlineItem = {
      id: d.id,
      title: d.title,
      subjectName: sub?.name,
      subjectColor: sub?.color,
      dueDate: due,
      daysRemainingOrOverdue: diffDays,
    };

    if (due.getTime() < todayStart.getTime()) {
      overdue.push(item);
    } else if (due.getTime() >= todayStart.getTime() && due.getTime() < todayEnd.getTime()) {
      dueToday.push(item);
    } else if (due.getTime() >= todayEnd.getTime() && due.getTime() <= thisWeekEnd.getTime()) {
      dueThisWeek.push(item);
    } else {
      later.push(item);
    }
  }

  const activeFolderName = userFolders[0]?.name || 'Academic Term';
  const frontendUrl = env.FRONTEND_URL || 'https://estudesk.com';

  const { html, text } = renderWeeklyDigestEmail({
    userName: user.name || user.email.split('@')[0],
    semesterName: activeFolderName,
    appUrl: frontendUrl,
    overdue,
    dueToday,
    dueThisWeek,
    later,
  });

  const res = await sendZeptoMail({
    toEmail: user.email,
    toName: user.name || user.email.split('@')[0],
    subject: `Your week ahead — ${overdue.length + dueToday.length + dueThisWeek.length} deadlines in ${activeFolderName}`,
    htmlBody: html,
    textBody: text,
    apiKey: env.ZEPTOMAIL_API_KEY,
    apiUrl: env.ZEPTOMAIL_API_URL || 'https://api.zeptomail.ca/v1.1/email',
    fromEmail: env.EMAIL_FROM_ADDRESS,
    fromName: env.EMAIL_FROM_NAME,
  });

  await logNotification(db, {
    userId: user.id,
    notificationType: 'weekly_digest',
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
    deadlineAlertHoursBefore: number;
    timezone: string;
    emailFormat: 'html' | 'plain';
  }>
) {
  await getNotificationPreferences(db, userId); // ensure row exists

  const updates: Record<string, unknown> = {
    ...prefs,
    updatedAt: new Date(),
  };

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
