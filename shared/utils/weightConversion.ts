export const DEFAULT_BAR_WEIGHT_KG = 20;

export function perSideToTotal(
  perSideKg: number,
  barWeightKg: number = DEFAULT_BAR_WEIGHT_KG,
): number {
  return barWeightKg + perSideKg * 2;
}

export function totalToPerSide(
  totalKg: number,
  barWeightKg: number = DEFAULT_BAR_WEIGHT_KG,
): number {
  return Math.max(0, (totalKg - barWeightKg) / 2);
}
