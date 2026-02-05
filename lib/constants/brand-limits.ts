export const BRAND_LIMITS: Record<string, number> = {
  FREE: 1,
  STARTER: 1,
  GROWTH: 3,
  TEAM: Infinity,
};

export function getBrandLimit(planCode: string): number {
  return BRAND_LIMITS[planCode] ?? 1;
}
