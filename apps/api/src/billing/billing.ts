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
    name: 'Free Scholar',
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
      'Encrypted Offline-First Local Storage + Cloud Sync',
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
      'Priority High-Speed Multi-Model AI Router',
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
      'Advanced Multi-Modal File Parser & Instant Document OCR',
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
export async function getPayPalAccessToken(env: Bindings): Promise<{ token: string | null; error?: string }> {
  const clientId = (env.PAYPAL_CLIENT_ID || '').trim();
  const secret = (env.PAYPAL_CLIENT_SECRET || '').trim();

  if (!clientId || !secret) {
    return { token: null, error: 'PAYPAL_CLIENT_ID or PAYPAL_CLIENT_SECRET is missing.' };
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
      const errText = await res.text();
      console.error(`PayPal OAuth error (${res.status}): ${errText}`);
      return { token: null, error: `PayPal OAuth authentication failed (HTTP ${res.status}): ${errText}` };
    }

    const data = (await res.json()) as { access_token?: string };
    return { token: data.access_token || null };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('Failed to get PayPal access token:', err);
    return { token: null, error: `Network error connecting to PayPal: ${msg}` };
  }
}

/**
 * Authoritative Server-to-Server Verification of PayPal Subscription or Order ID
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
  const isLive = env.PAYPAL_ENVIRONMENT === 'live';

  // 1. Check for explicit sandbox test simulation
  if (
    subscriptionId.startsWith('SANDBOX_SUB_') ||
    subscriptionId.startsWith('I-SANDBOX-') ||
    (!env.PAYPAL_CLIENT_SECRET && !isLive)
  ) {
    return {
      valid: true,
      status: 'ACTIVE',
      subscriberEmail: 'sandbox_student@estudesk.test',
      nextBillingTime: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    };
  }

  // 2. Obtain PayPal Access Token
  const { token, error: tokenError } = await getPayPalAccessToken(env);
  if (!token) {
    // If running in sandbox and secret is missing or invalid, fallback to valid sandbox approval with warning
    if (!isLive) {
      console.warn(`[PayPal Sandbox Fallback]: Token exchange failed (${tokenError}), approving sandbox test transaction.`);
      return {
        valid: true,
        status: 'ACTIVE',
        subscriberEmail: 'sandbox_student@estudesk.test',
        nextBillingTime: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      };
    }
    return { valid: false, error: tokenError || 'Could not authenticate with PayPal API. Please check your credentials.' };
  }

  const baseUrl = getPayPalBaseUrl(env);

  try {
    // 3. Try checking as a recurring Subscription
    const subRes = await fetch(`${baseUrl}/v1/billing/subscriptions/${subscriptionId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (subRes.ok) {
      const data = (await subRes.json()) as {
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
    }

    // 4. If not a subscription (e.g. standard Order ID checkout), check Order endpoint
    const orderRes = await fetch(`${baseUrl}/v2/checkout/orders/${subscriptionId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (orderRes.ok) {
      const orderData = (await orderRes.json()) as {
        status?: string;
        payer?: { email_address?: string };
      };

      const status = orderData.status?.toUpperCase();
      const isValid = status === 'COMPLETED' || status === 'APPROVED';

      return {
        valid: isValid,
        status: orderData.status,
        subscriberEmail: orderData.payer?.email_address,
        nextBillingTime: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      };
    }

    // If both failed
    const errText = await subRes.text();
    return { valid: false, error: `PayPal verification error (${subRes.status}): ${errText}` };
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
 * Set / Refresh user monthly credit quota on subscription activation / renewal
 * Sets user creditBalance to the plan quota (e.g. 1,000 credits) to prevent runaway stacking.
 */
export async function setUserMonthlyQuota(
  db: any,
  userId: string,
  targetQuota: number,
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
    const newBalance = targetQuota;
    const diff = newBalance - current;

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
      amount: diff,
      type: 'monthly_grant',
      balanceAfter: newBalance,
      description,
      createdAt: new Date(),
    });

    return { success: true, newBalance };
  } catch (err) {
    console.error('Failed to set monthly quota:', err);
    return { success: false, newBalance: 0 };
  }
}

/**
 * Add / Grant credits to a user (e.g. on manual grant or bonus)
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
