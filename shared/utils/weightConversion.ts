export const DEFAULT_BAR_WEIGHT_KG = 20;
// 45 lb es el estándar real de barra olímpica americana — NO es solo la
// conversión de 20kg (que daría 44.1 lb). Los gimnasios en lb usan 45.
export const DEFAULT_BAR_WEIGHT_LB = 45;

export function perSideToTotal(perSide: number, barWeight: number): number {
  return barWeight + perSide * 2;
}

export function totalToPerSide(total: number, barWeight: number): number {
  return Math.max(0, (total - barWeight) / 2);
}
