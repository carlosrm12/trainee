import { SQLiteMealLogRepository } from "@/data/repositories/SQLiteMealLogRepository";
import { getLocalDateString } from "@/shared/utils/getLocalDateString";
import { useCallback, useEffect, useState } from "react";
import { computeMealTotals, type DailyTotals } from "./computeMealTotals";

const mealLogRepo = new SQLiteMealLogRepository();
const HISTORY_DAYS = 30;

export type NutritionHistoryDay = {
  date: string;
  totals: DailyTotals;
  mealCount: number;
};

// Punto de entrada que faltaba en el doc original (§9 asume que ya existe
// un "historial nutricional" desde donde se llega a nutrition-day/[date]
// para cualquier día pasado, pero el roadmap §16 nunca lo construye como
// paso propio — hueco encontrado probando el paso 7 en dispositivo). Trae
// los últimos 30 días vía getByDateRange (ya existía desde el paso 2, sin
// usar hasta ahora) y agrupa client-side por fecha — no hay una query de
// "fechas distintas" en el repo, y con 30 días de volumen típico no hace
// falta optimizarlo más que esto.
export function useNutritionHistory() {
  const [days, setDays] = useState<NutritionHistoryDay[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const end = getLocalDateString();
    const start = new Date();
    start.setDate(start.getDate() - HISTORY_DAYS);
    const startDate = getLocalDateString(start);

    const rows = await mealLogRepo.getByDateRange(startDate, end);
    const complete = rows.filter((m) => m.analysisStatus === "complete");

    const byDate = new Map<string, typeof complete>();
    for (const meal of complete) {
      const existing = byDate.get(meal.date) ?? [];
      existing.push(meal);
      byDate.set(meal.date, existing);
    }

    const grouped: NutritionHistoryDay[] = Array.from(byDate.entries())
      .map(([date, meals]) => ({
        date,
        totals: computeMealTotals(meals),
        mealCount: meals.length,
      }))
      .sort((a, b) => (a.date < b.date ? 1 : -1)); // más reciente primero

    setDays(grouped);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { days, loading, reload: load };
}
