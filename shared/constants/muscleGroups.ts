import type { MuscleGroup } from "../../domain/entities";

export const MUSCLE_GROUPS: { label: string; value: MuscleGroup }[] = [
  // Torso
  { label: "Pecho", value: "chest" },
  { label: "Espalda", value: "back" },
  { label: "Hombros", value: "shoulders" },
  // Brazos
  { label: "Bíceps", value: "biceps" },
  { label: "Tríceps", value: "triceps" },
  { label: "Antebrazos", value: "forearms" },
  // Piernas
  { label: "Cuádriceps", value: "quads" },
  { label: "Femorales", value: "hamstrings" },
  { label: "Glúteos", value: "glutes" },
  { label: "Pantorrillas", value: "calves" },
  // Tronco y otros
  { label: "Abdomen", value: "abs" },
  { label: "Trapecios", value: "traps" },
  { label: "Cardio / General", value: "cardio" },
];

export function getMuscleGroupLabel(value: MuscleGroup): string {
  return MUSCLE_GROUPS.find((g) => g.value === value)?.label ?? value;
}
