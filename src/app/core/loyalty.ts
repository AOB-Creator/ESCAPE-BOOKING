import { Tier } from './models';

/** 1 ball har 20 000 so‘m to‘lov uchun. */
export const SPEND_PER_POINT = 20_000;
/** 1 ball = 1 000 so‘m chegirma. */
export const POINT_VALUE = 1_000;
/** Ball bilan bron summasining ko‘pi bilan 30% i to‘lanadi. */
export const MAX_REDEEM_SHARE = 0.3;

export const TIERS: Tier[] = [
  { id: 'silver', name: 'Kumush', min: 0 },
  { id: 'gold', name: 'Oltin', min: 1000 },
  { id: 'platinum', name: 'Platina', min: 3000 },
];

export function pointsForPayment(paid: number): number {
  return Math.max(0, Math.floor(paid / SPEND_PER_POINT));
}

export function maxRedeemablePoints(total: number, balance: number): number {
  const cap = Math.floor((total * MAX_REDEEM_SHARE) / POINT_VALUE);
  return Math.max(0, Math.min(balance, cap));
}

export function tierFor(lifetime: number): Tier {
  return [...TIERS].reverse().find((t) => lifetime >= t.min) ?? TIERS[0];
}

export interface TierProgress {
  tier: Tier;
  next: Tier | null;
  /** 0..1 */
  ratio: number;
  remaining: number;
}

export function tierProgress(lifetime: number): TierProgress {
  const tier = tierFor(lifetime);
  const next = TIERS[TIERS.indexOf(tier) + 1] ?? null;
  if (!next) return { tier, next, ratio: 1, remaining: 0 };
  const ratio = (lifetime - tier.min) / (next.min - tier.min);
  return { tier, next, ratio: Math.min(1, Math.max(0, ratio)), remaining: next.min - lifetime };
}

export interface PriceBreakdown {
  subtotal: number;
  pointsUsed: number;
  discount: number;
  paid: number;
  pointsEarned: number;
}

export function priceBreakdown(subtotal: number, balance: number, usePoints: boolean): PriceBreakdown {
  const pointsUsed = usePoints ? maxRedeemablePoints(subtotal, balance) : 0;
  const discount = pointsUsed * POINT_VALUE;
  const paid = subtotal - discount;
  return { subtotal, pointsUsed, discount, paid, pointsEarned: pointsForPayment(paid) };
}
