import type { WeightInputMode, WeightUnit } from "../../domain/entities";
import {
  DEFAULT_BAR_WEIGHT_KG,
  DEFAULT_BAR_WEIGHT_LB,
} from "./weightConversion";

export function kgToLb(kg: number): number {
  return Math.round(kg * 2.20462 * 10) / 10;
}

export function lbToKg(lb: number): number {
  return Math.round((lb / 2.20462) * 100) / 100;
}

export function formatWeight(kg: number, unit: WeightUnit): string {
  return unit === "lb" ? `${kgToLb(kg)} lb` : `${Math.round(kg * 10) / 10} kg`;
}

export function getDefaultBarWeight(unit: WeightUnit): number {
  return unit === "lb" ? DEFAULT_BAR_WEIGHT_LB : DEFAULT_BAR_WEIGHT_KG;
}

// Incrementos típicos de disco/máquina según unidad y modo de peso.
export function getWeightStep(unit: WeightUnit, mode: WeightInputMode): number {
  if (mode === "per_side") return unit === "lb" ? 2.5 : 1.25;
  return unit === "lb" ? 5 : 2.5;
}
