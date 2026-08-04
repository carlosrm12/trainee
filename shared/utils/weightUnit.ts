import type { WeightUnit } from "../../domain/entities";

export function kgToLb(kg: number): number {
  return Math.round(kg * 2.20462 * 10) / 10;
}

export function formatWeight(kg: number, unit: WeightUnit): string {
  return unit === "lb" ? `${kgToLb(kg)} lb` : `${kg} kg`;
}
