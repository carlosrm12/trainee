import type { WeightUnit } from "../../domain/entities";

// La unidad "para nutrición" hereda de la global salvo que el usuario elija
// una propia en Ajustes de Nutrición. Ver §3 del doc de Fase 2.
export function resolveWeightUnit(
  globalUnit: WeightUnit,
  override: WeightUnit | null,
): WeightUnit {
  return override ?? globalUnit;
}
