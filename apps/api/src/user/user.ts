import { eq, and, desc } from 'drizzle-orm';
import * as schema from '../db/schema';

/**
 * Get comprehensive user profile
 */
export async function getUserProfile(db: any, userId: string) {
  const u = await db
    .select()
    .from(schema.user)
    .where(eq(schema.user.id, userId))
    .get();

  if (!u) return null;

  return {
    id: u.id,
    name: u.name,
    email: u.email,
    emailVerified: u.emailVerified,
    image: u.image,
    generationTier: u.generationTier,
    creditBalance: u.creditBalance ?? 100,
    institution: u.institution || '',
    fieldOfStudy: u.fieldOfStudy || '',
    bio: u.bio || '',
    timezone: u.timezone || 'UTC',
    createdAt: u.createdAt,
    deletedAt: u.deletedAt,
  };
}

/**
 * Update user profile fields
 */
export async function updateUserProfile(
  db: any,
  userId: string,
  updates: {
    name?: string;
    image?: string | null;
    institution?: string;
    fieldOfStudy?: string;
    bio?: string;
    timezone?: string;
  }
) {
  const fieldsToUpdate: Record<string, any> = {
    updatedAt: new Date(),
  };

  if (updates.name !== undefined && updates.name.trim()) fieldsToUpdate.name = updates.name.trim();
  if (updates.image !== undefined) fieldsToUpdate.image = updates.image;
  if (updates.institution !== undefined) fieldsToUpdate.institution = updates.institution.trim();
  if (updates.fieldOfStudy !== undefined) fieldsToUpdate.fieldOfStudy = updates.fieldOfStudy.trim();
  if (updates.bio !== undefined) fieldsToUpdate.bio = updates.bio.trim();
  if (updates.timezone !== undefined) fieldsToUpdate.timezone = updates.timezone;

  await db
    .update(schema.user)
    .set(fieldsToUpdate)
    .where(eq(schema.user.id, userId));

  return getUserProfile(db, userId);
}

/**
 * List all active sessions for a user
 */
export async function getUserSessions(db: any, userId: string) {
  const sessions = await db
    .select()
    .from(schema.session)
    .where(eq(schema.session.userId, userId))
    .orderBy(desc(schema.session.createdAt))
    .all();

  return sessions.map((s: any) => ({
    id: s.id,
    ipAddress: s.ipAddress || '127.0.0.1',
    userAgent: s.userAgent || 'Web Browser',
    createdAt: s.createdAt,
    expiresAt: s.expiresAt,
  }));
}

/**
 * Revoke a specific session
 */
export async function revokeUserSession(db: any, sessionId: string, userId: string) {
  await db
    .delete(schema.session)
    .where(and(eq(schema.session.id, sessionId), eq(schema.session.userId, userId)));
  return { success: true };
}

/**
 * Generate full GDPR Student Data Archive JSON
 */
export async function exportUserData(db: any, userId: string) {
  const [
    profile,
    userFolders,
    userSubjects,
    userMaterials,
    userDeadlines,
    userConversations,
    notificationPrefs,
    invoicesList,
    creditLogs,
  ] = await Promise.all([
    db.select().from(schema.user).where(eq(schema.user.id, userId)).get(),
    db.select().from(schema.folders).where(eq(schema.folders.userId, userId)).all(),
    db.select().from(schema.subjects).where(eq(schema.subjects.userId, userId)).all(),
    db.select().from(schema.materials).where(eq(schema.materials.userId, userId)).all(),
    db.select().from(schema.deadlines).where(eq(schema.deadlines.userId, userId)).all(),
    db.select().from(schema.conversations).where(eq(schema.conversations.userId, userId)).all(),
    db.select().from(schema.notificationPreferences).where(eq(schema.notificationPreferences.userId, userId)).get(),
    db.select().from(schema.invoices).where(eq(schema.invoices.userId, userId)).all(),
    db.select().from(schema.creditTransactions).where(eq(schema.creditTransactions.userId, userId)).all(),
  ]);

  return {
    exportDate: new Date().toISOString(),
    platform: 'eStudesk Privacy-First Study Suite',
    profile: profile ? {
      id: profile.id,
      name: profile.name,
      email: profile.email,
      tier: profile.generationTier,
      credits: profile.creditBalance,
      institution: profile.institution,
      fieldOfStudy: profile.fieldOfStudy,
      timezone: profile.timezone,
      createdAt: profile.createdAt,
    } : null,
    folders: userFolders,
    subjects: userSubjects,
    materials: userMaterials,
    deadlines: userDeadlines,
    conversations: userConversations,
    notifications: notificationPrefs || null,
    billingHistory: invoicesList,
    creditUsageHistory: creditLogs,
  };
}

/**
 * Soft delete user account with 30-day grace period
 */
export async function softDeleteUserAccount(db: any, userId: string) {
  const deleteDate = new Date();
  await db
    .update(schema.user)
    .set({
      deletedAt: deleteDate,
      updatedAt: deleteDate,
    })
    .where(eq(schema.user.id, userId));

  // Revoke all active sessions
  await db.delete(schema.session).where(eq(schema.session.userId, userId));

  return {
    success: true,
    message: 'Your account has been scheduled for deletion with a 30-day grace period.',
    deletedAt: deleteDate.toISOString(),
  };
}
