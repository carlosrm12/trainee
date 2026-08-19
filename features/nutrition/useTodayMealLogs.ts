import { SQLiteMealLogRepository } from "@/data/repositories/SQLiteMealLogRepository";
import type { MealLog } from "@/domain/entities";
import { getLocalDateString } from "@/shared/utils/getLocalDateString";
import { useCallback, useEffect, useState } from "react";

const mealLogRepo = new SQLiteMealLogRepository();

export type DailyTotals = {
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
};

// `meals`: solo analysisStatus === "complete" del día de hoy (getLocalDateString,
// nunca toISOString — ver §9 del doc de Fase 2).
// `pendingMeals`: TODAS las pendientes, sin filtro de fecha — el comentario
// de getPending() en SQLiteMealLogRepository ya lo marca así para este paso:
// una fila pending vieja no debe desaparecer del dashboard solo porque
// cambió el día, si no el usuario nunca se entera de que quedó sin analizar.
export function useTodayMealLogs() {
  const [meals, setMeals] = useState<MealLog[]>([]);
  const [pendingMeals, setPendingMeals] = useState<MealLog[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const [todayLogs, pending] = await Promise.all([
      mealLogRepo.getByDate(getLocalDateString()),
      mealLogRepo.getPending(),
    ]);
    setMeals(todayLogs.filter((m) => m.analysisStatus === "complete"));
    setPendingMeals(pending);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const totals: DailyTotals = meals.reduce(
    (acc, m) => ({
      calories: acc.calories + m.calories,
      proteinG: acc.proteinG + m.proteinG,
      carbsG: acc.carbsG + m.carbsG,
      fatG: acc.fatG + m.fatG,
    }),
    { calories: 0, proteinG: 0, carbsG: 0, fatG: 0 },
  );

  return { meals, pendingMeals, totals, loading, reload: load };
}
