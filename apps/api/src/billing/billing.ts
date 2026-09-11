import { eq, desc } from 'drizzle-orm';
import * as schema from '../db/schema';
import type { Bindings } from '../index';

export interface PlanData {
  id: string;
  name: string;
  billingCycle: 'once' | 'monthly' | 'semester' | 'yearly';
  durationMonths: number;
  priceAmount: number;
  currency: string;
  discountPercent: number;
  discountReason: string | null;
  isActive: boolean;
  aiCreditsMonthly: number;
  features: string[];
  paypalPlanId?: string | null;
  sortOrder: number;
}

export const DEFAULT_PLANS: PlanData[] = [
  {
    id: 'free',
    name: 'Free',
    billingCycle: 'once',
    durationMonths: 1,
    priceAmount: 0.0,
    currency: 'USD',
    discountPercent: 0,
    discountReason: null,
    isActive: true,
    aiCreditsMonthly: 100,
    features: [
      '100 Initial AI Generation Credits',
      'Basic Study Notes & Flashcards Generator',
      'Local Dexie.js Offline Storage + Cloud Sync',
      'Standard AI Generation Queue',
      'Export Study Materials to TXT',
    ],
    sortOrder: 1,
  },
  {
    id: 'pro_monthly',
    name: 'Pro Monthly',
    billingCycle: 'monthly',
    durationMonths: 1,
    priceAmount: 9.99,
    currency: 'USD',
    discountPercent: 0,
    discountReason: null,
    isActive: true,
    aiCreditsMonthly: 1000,
    features: [
      '1,000 AI Generation Credits / month',
      'All 7 Study Formats (Notes, Cheatsheets, Flashcards, Quizzes, Infographics, Assignments, Slides)',
      'Multi-Modal Source Extraction (PDF, DOCX, TXT, CSV, Audio, OCR)',
      '24h Deadline Email Alerts & Monday Weekly Digests',
      'Priority High-Speed AI Router (DeepSeek V3 / MiMo / Gemini)',
      'Rich PDF, TXT, & JSON Study Material Downloads',
    ],
    sortOrder: 2,
  },
  {
    id: 'pro_semester',
    name: 'Pro Semester (4 Months)',
    billingCycle: 'semester',
    durationMonths: 4,
    priceAmount: 29.99,
    currency: 'USD',
    discountPercent: 25,
    discountReason: 'Semester Saver • 25% Off',
    isActive: true,
    aiCreditsMonthly: 1000,
    features: [
      '1,000 AI Generation Credits / month (4,000 total credits)',
      'Full University 4-Month Semester Coverage',
      'All 7 Study Material Formats with Instant AI Refinements',
      'Multi-Modal Source Extraction (PDF, OCR Image, Audio Transcripts)',
      '24h Deadline Alerts & Timezone-Aware Weekly Digests',
      'Full Semester Archive One-Click Student Backup',
      'Dedicated High-Throughput AI Priority Queue',
    ],
    sortOrder: 3,
  },
  {
    id: 'pro_yearly',
    name: 'Pro Yearly',
    billingCycle: 'yearly',
    durationMonths: 12,
    priceAmount: 79.99,
    currency: 'USD',
    discountPercent: 35,
    discountReason: 'Annual Best Value • 35% Off',
    isActive: false, // COMING SOON
    aiCreditsMonthly: 1000,
    features: [
      '1,000 AI Generation Credits / month (12,000 total credits)',
      'Full 12-Month Academic Access to All Features',
      'All 7 Study Material Types & Infinite Version History',
      'Advanced Multi-Modal File Parser & Instant Tesseract OCR',
      'Priority Email Notifications & Weekly Digest Reports',
      'VIP Priority AI Routing & Early Feature Access',
    ],
    sortOrder: 4,
  },
];

/**
 * Seed or refresh the dynamic subscription plans in Turso DB
 */
export async function seedSubscriptionPlans(db: any) {
  try {
    for (const plan of DEFAULT_PLANS) {
      const existing = await db
        .select()
        .from(schema.subscriptionPlans)
        .where(eq(schema.subscriptionPlans.id, plan.id))
        .get();

      if (!existing) {
        await db.insert(schema.subscriptionPlans).values({
          id: plan.id,
          name: plan.name,
          billingCycle: plan.billingCycle,
          durationMonths: plan.durationMonths,
          priceAmount: plan.priceAmount,
          currency: plan.currency,
          discountPercent: plan.discountPercent,
          discountReason: plan.discountReason,
          isActive: plan.isActive,
          aiCreditsMonthly: plan.aiCreditsMonthly,
          features: JSON.stringify(plan.features),
          sortOrder: plan.sortOrder,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }
    }
  } catch (err) {
    console.error('Failed to seed subscription plans:', err);
  }
}

/**
 * Get all available subscription plans from database
 */
export async function getSubscriptionPlans(db: any) {
  await seedSubscriptionPlans(db);
  const rows = await db.select().from(schema.subscriptionPlans).all();
  return rows
    .map((row: any) => ({
      ...row,
      features: typeof row.features === 'string' ? JSON.parse(row.features) : row.features,
    }))
    .sort((a: any, b: any) => a.sortOrder - b.sortOrder);
}

/**
 * Get PayPal REST API Base URL based on environment
 */
export function getPayPalBaseUrl(env: Bindings): string {
  const envType = env.PAYPAL_ENVIRONMENT || 'sandbox';
  return envType === 'live'
    ? 'https://api-m.paypal.com'
    : 'https://api-m.sandbox.paypal.com';
}

/**
 * Exchange Client ID and Secret for an OAuth2 Bearer Access Token with PayPal
 */
export async function getPayPalAccessToken(env: Bindings): Promise<string | null> {
  const clientId = env.PAYPAL_CLIENT_ID;
  const secret = env.PAYPAL_CLIENT_SECRET;

  if (!clientId || !secret) {
    return null;
  }

  const baseUrl = getPayPalBaseUrl(env);
  const auth = btoa(`${clientId}:${secret}`);

  try {
    const res = await fetch(`${baseUrl}/v1/oauth2/token`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'grant_type=client_credentials',
    });

    if (!res.ok) {
      console.error(`PayPal token error status: ${res.status}`);
      return null;
    }

    const data = (await res.json()) as { access_token?: string };
    return data.access_token || null;
  } catch (err) {
    console.error('Failed to get PayPal access token:', err);
    return null;
  }
}

/**
 * Authoritative Server-to-Server Verification of PayPal Subscription ID
 */
export async function verifyPayPalSubscription(
  env: Bindings,
  subscriptionId: string
): Promise<{
  valid: boolean;
  status?: string;
  planId?: string;
  subscriberEmail?: string;
  nextBillingTime?: string;
  error?: string;
}> {
  // If in sandbox mode without credentials provided, allow simulation for development test
  if (!env.PAYPAL_CLIENT_SECRET) {
    console.warn('PAYPAL_CLIENT_SECRET not configured. Development mode mock verification active.');
    return {
      valid: true,
      status: 'ACTIVE',
      subscriberEmail: 'scholar_demo@estudesk.test',
      nextBillingTime: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    };
  }

  const token = await getPayPalAccessToken(env);
  if (!token) {
    return { valid: false, error: 'Could not authenticate with PayPal API.' };
  }

  const baseUrl = getPayPalBaseUrl(env);

  try {
    const res = await fetch(`${baseUrl}/v1/billing/subscriptions/${subscriptionId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!res.ok) {
      const errText = await res.text();
      return { valid: false, error: `PayPal error (${res.status}): ${errText}` };
    }

    const data = (await res.json()) as {
      status?: string;
      plan_id?: string;
      subscriber?: { email_address?: string };
      billing_info?: { next_billing_time?: string };
    };

    const status = data.status?.toUpperCase();
    const isValid = status === 'ACTIVE' || status === 'APPROVED';

    return {
      valid: isValid,
      status: data.status,
      planId: data.plan_id,
      subscriberEmail: data.subscriber?.email_address,
      nextBillingTime: data.billing_info?.next_billing_time,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { valid: false, error: msg };
  }
}

/**
 * Deduct AI generation credits and record in audit log
 */
export async function deductUserCredit(
  db: any,
  userId: string,
  costCredits: number,
  materialType: string,
  description: string
): Promise<{ success: boolean; balance: number; error?: string }> {
  try {
    const u = await db
      .select()
      .from(schema.user)
      .where(eq(schema.user.id, userId))
      .get();

    if (!u) {
      return { success: false, balance: 0, error: 'User not found' };
    }

    const currentBalance = u.creditBalance ?? 100;
    if (currentBalance < costCredits) {
      return {
        success: false,
        balance: currentBalance,
        error: `Insufficient AI credits (${currentBalance} remaining, requires ${costCredits}). Please upgrade your plan for 1,000 monthly credits.`,
      };
    }

    const newBalance = currentBalance - costCredits;

    // Update user balance and insert audit transaction
    await db
      .update(schema.user)
      .set({
        creditBalance: newBalance,
        updatedAt: new Date(),
      })
      .where(eq(schema.user.id, userId));

    await db.insert(schema.creditTransactions).values({
      id: crypto.randomUUID(),
      userId,
      amount: -costCredits,
      type: materialType === 'chat' ? 'chat_spend' : 'generation_spend',
      materialType,
      balanceAfter: newBalance,
      description,
      createdAt: new Date(),
    });

    return { success: true, balance: newBalance };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, balance: 0, error: msg };
  }
}

/**
 * Add / Grant credits to a user (e.g. on subscription renewal or signup)
 */
export async function grantUserCredits(
  db: any,
  userId: string,
  amount: number,
  type: 'monthly_grant' | 'initial_grant' | 'bonus',
  description: string
): Promise<{ success: boolean; newBalance: number }> {
  try {
    const u = await db
      .select()
      .from(schema.user)
      .where(eq(schema.user.id, userId))
      .get();

    if (!u) return { success: false, newBalance: 0 };

    const current = u.creditBalance ?? 0;
    const newBalance = current + amount;

    await db
      .update(schema.user)
      .set({
        creditBalance: newBalance,
        updatedAt: new Date(),
      })
      .where(eq(schema.user.id, userId));

    await db.insert(schema.creditTransactions).values({
      id: crypto.randomUUID(),
      userId,
      amount,
      type,
      balanceAfter: newBalance,
      description,
      createdAt: new Date(),
    });

    return { success: true, newBalance };
  } catch (err) {
    console.error('Failed to grant credits:', err);
    return { success: false, newBalance: 0 };
  }
}

/**
 * Get detailed user subscription, credit balance, and usage telemetry
 */
export async function getUserSubscriptionDetails(db: any, userId: string) {
  const u = await db
    .select()
    .from(schema.user)
    .where(eq(schema.user.id, userId))
    .get();

  if (!u) return null;

  const sub = await db
    .select()
    .from(schema.subscriptions)
    .where(eq(schema.subscriptions.userId, userId))
    .orderBy(desc(schema.subscriptions.createdAt))
    .get();

  const now = new Date();
  let isPro = false;
  let activePlanId = 'free';
  let cancelAtPeriodEnd = false;
  let currentPeriodEnd: string | null = null;
  let currentPeriodStart: string | null = null;

  if (sub && sub.planId !== 'free') {
    const periodEnd = sub.currentPeriodEnd ? new Date(sub.currentPeriodEnd) : null;
    if (sub.status === 'active' && periodEnd && periodEnd > now) {
      isPro = true;
      activePlanId = sub.planId;
      cancelAtPeriodEnd = !!sub.cancelAtPeriodEnd;
      currentPeriodEnd = periodEnd.toISOString();
      currentPeriodStart = sub.currentPeriodStart ? new Date(sub.currentPeriodStart).toISOString() : null;
    } else if (sub.status === 'active' && periodEnd && periodEnd <= now) {
      // Subscription period ended -> transition to expired and downgrade user
      try {
        await db
          .update(schema.subscriptions)
          .set({ status: 'expired', updatedAt: now })
          .where(eq(schema.subscriptions.id, sub.id));
        await db
          .update(schema.user)
          .set({ generationTier: 'free', updatedAt: now })
          .where(eq(schema.user.id, userId));
      } catch (e) {
        console.error('Failed to expire subscription:', e);
      }
      isPro = false;
      activePlanId = 'free';
    }
  }

  // Check fallback if user tier is premium but no active sub
  if (!isPro && (u.generationTier === 'premium' || u.generationTier === 'pro')) {
    isPro = true;
    activePlanId = sub?.planId && sub.planId !== 'free' ? sub.planId : 'pro_monthly';
  }

  const tier = isPro ? 'pro' : 'free';
  const quotaLimit = isPro ? 1000 : 100;
  const currentCredits = u.creditBalance ?? (isPro ? 1000 : 100);

  const transactions = await db
    .select()
    .from(schema.creditTransactions)
    .where(eq(schema.creditTransactions.userId, userId))
    .orderBy(desc(schema.creditTransactions.createdAt))
    .limit(15);

  return {
    tier,
    planId: activePlanId,
    creditBalance: currentCredits,
    monthlyQuotaLimit: quotaLimit,
    accountCreatedAt: u.createdAt,
    subscription: sub
      ? {
          ...sub,
          planId: activePlanId,
          isPro,
          cancelAtPeriodEnd,
          currentPeriodEnd: currentPeriodEnd || (sub.currentPeriodEnd ? new Date(sub.currentPeriodEnd).toISOString() : null),
          currentPeriodStart: currentPeriodStart || (sub.currentPeriodStart ? new Date(sub.currentPeriodStart).toISOString() : null),
        }
      : null,
    recentTransactions: transactions || [],
  };
}
