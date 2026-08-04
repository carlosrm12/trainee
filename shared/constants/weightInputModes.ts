import type { WeightInputMode } from "../../domain/entities";

export const WEIGHT_INPUT_MODES: { label: string; value: WeightInputMode }[] = [
  { label: "Total (cable/máquina/mancuerna)", value: "total" },
  { label: "Por lado (barra)", value: "per_side" },
];
