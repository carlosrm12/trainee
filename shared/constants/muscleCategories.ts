import type { MuscleGroup } from "../../domain/entities";

export type MuscleCategory = "empuje" | "tiron" | "pierna" | "otro";

const CATEGORY_BY_MUSCLE: Record<MuscleGroup, MuscleCategory> = {
  chest: "empuje",
  shoulders: "empuje",
  triceps: "empuje",
  back: "tiron",
  biceps: "tiron",
  forearms: "tiron",
  traps: "tiron",
  quads: "pierna",
  hamstrings: "pierna",
  glutes: "pierna",
  calves: "pierna",
  abs: "otro",
  cardio: "otro",
};

export const MUSCLE_CATEGORY_LABEL: Record<MuscleCategory, string> = {
  empuje: "Empuje",
  tiron: "Tirón",
  pierna: "Pierna",
  otro: "Otro",
};

export function getMuscleCategory(muscleGroup: MuscleGroup): MuscleCategory {
  return CATEGORY_BY_MUSCLE[muscleGroup];
}

// Categoría dominante de una rutina: la que más se repite entre los
// muscleGroup de sus ejercicios. Si la rutina no tiene ejercicios todavía,
// devuelve null (no se cuenta en ningún chip salvo "Todas").
export function getDominantCategory(
  muscleGroups: MuscleGroup[],
): MuscleCategory | null {
  if (muscleGroups.length === 0) return null;

  const counts: Record<MuscleCategory, number> = {
    empuje: 0,
    tiron: 0,
    pierna: 0,
    otro: 0,
  };
  for (const mg of muscleGroups) {
    counts[getMuscleCategory(mg)] += 1;
  }

  let best: MuscleCategory = "otro";
  let bestCount = -1;
  (Object.keys(counts) as MuscleCategory[]).forEach((cat) => {
    if (counts[cat] > bestCount) {
      bestCount = counts[cat];
      best = cat;
    }
  });
  return best;
}
