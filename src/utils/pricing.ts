import type { SubscriptionPlan } from '@/types';

export interface CalculatedPricing {
  originalPrice: number;
  discountPercent: number;
  hasDiscount: boolean;
  discountedPrice: number;
  effectivePrice: number;
  monthlyEquivalent: number;
  discountReason: string | null;
  savingsAmount: number;
}

/**
 * Standardized pricing calculation:
 * - `priceAmount` in database/plan is the ORIGINAL FULL PRICE (e.g. $39.99, $9.99, $119.99).
 * - If `discountPercent > 0`:
 *    - `originalPrice` is shown with strikethrough.
 *    - `effectivePrice` is calculated as `priceAmount * (1 - discountPercent / 100)` (e.g. $29.99).
 * - If `discountPercent === 0`:
 *    - `effectivePrice` is `priceAmount` and no strikethrough is shown.
 */
export function calculatePlanPricing(
  plan: SubscriptionPlan | { priceAmount: number; discountPercent?: number | null; discountReason?: string | null; durationMonths?: number }
): CalculatedPricing {
  const originalPrice = Number(plan.priceAmount || 0);
  const discountPercent = Number(plan.discountPercent || 0);
  const hasDiscount = discountPercent > 0;
  const durationMonths = Number(plan.durationMonths || 1);

  const discountedPrice = hasDiscount
    ? Number((originalPrice * (1 - discountPercent / 100)).toFixed(2))
    : originalPrice;

  const effectivePrice = discountedPrice;

  const monthlyEquivalent = durationMonths > 1
    ? Number((effectivePrice / durationMonths).toFixed(2))
    : effectivePrice;

  const savingsAmount = hasDiscount
    ? Number((originalPrice - effectivePrice).toFixed(2))
    : 0;

  return {
    originalPrice,
    discountPercent,
    hasDiscount,
    discountedPrice,
    effectivePrice,
    monthlyEquivalent,
    discountReason: plan.discountReason || null,
    savingsAmount,
  };
}
