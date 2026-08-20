import type { MealLog } from "@/domain/entities";

export type DailyTotals = {
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
};

// Extraído de useTodayMealLogs (paso 6) para que el handler de
// nutrition-day/[date].tsx (paso 7) lo reutilice para cualquier fecha, no
// solo "hoy". Solo suma mealLogs con analysisStatus === "complete" — el
// llamador filtra eso antes de pasar el array acá.
export function computeMealTotals(meals: MealLog[]): DailyTotals {
  return meals.reduce(
    (acc, m) => ({
      calories: acc.calories + m.calories,
      proteinG: acc.proteinG + m.proteinG,
      carbsG: acc.carbsG + m.carbsG,
      fatG: acc.fatG + m.fatG,
    }),
    { calories: 0, proteinG: 0, carbsG: 0, fatG: 0 },
  );
}
