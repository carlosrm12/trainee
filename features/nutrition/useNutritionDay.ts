import { SQLiteMealLogRepository } from "@/data/repositories/SQLiteMealLogRepository";
import { SQLiteNutritionDayReportRepository } from "@/data/repositories/SQLiteNutritionDayReportRepository";
import type { NutritionProfile } from "@/domain/entities";
import { useCallback, useEffect, useState } from "react";
import { computeMealTotals, type DailyTotals } from "./computeMealTotals";
import { generateDayReport } from "./generateDayReport";
import { useGeminiApiKey } from "./useGeminiApiKey";
import { useNutritionProfile } from "./useNutritionProfile";

const mealLogRepo = new SQLiteMealLogRepository();
const dayReportRepo = new SQLiteNutritionDayReportRepository();

// Espejo de la "Condición única" del doc (§9): las dos causas (sin
// mealLogs, sin nutritionProfile) convergen acá en un solo chequeo antes
// de decidir si vale la pena llamar a Gemini — nunca dos guards separados
// que alguien podría implementar distinto entre la notificación y la
// apertura manual, porque los dos casos terminan en esta misma pantalla.
export type DayReportState =
  | { status: "loading" }
  | { status: "empty" }
  | { status: "no-profile"; totals: DailyTotals }
  | { status: "generating"; totals: DailyTotals }
  | { status: "ready"; totals: DailyTotals; reportText: string }
  | { status: "error"; totals: DailyTotals };

export function useNutritionDay(date: string) {
  const {
    profile,
    loading: profileLoading,
    reload: reloadProfile,
  } = useNutritionProfile();
  const { apiKey, loading: apiKeyLoading } = useGeminiApiKey();
  const [state, setState] = useState<DayReportState>({ status: "loading" });

  const generate = useCallback(
    async (totals: DailyTotals, currentProfile: NutritionProfile) => {
      setState({ status: "generating", totals });
      try {
        const reportText = await generateDayReport(
          date,
          totals,
          currentProfile,
          apiKey ?? "",
        );
        await dayReportRepo.save({ date, reportText });
        setState({ status: "ready", totals, reportText });
      } catch {
        // Fallback (§9): nunca se bloquea ver los números crudos por un
        // fallo de la IA — el estado "error" igual trae `totals` para que
        // la pantalla los muestre, más un botón de reintentar.
        setState({ status: "error", totals });
      }
    },
    [date, apiKey],
  );

  const load = useCallback(async () => {
    setState({ status: "loading" });
    const dayMeals = await mealLogRepo.getByDate(date);
    const completeMeals = dayMeals.filter(
      (m) => m.analysisStatus === "complete",
    );

    if (completeMeals.length === 0) {
      setState({ status: "empty" });
      return;
    }

    const totals = computeMealTotals(completeMeals);

    if (!profile || !profile.dailyCalorieTarget) {
      setState({ status: "no-profile", totals });
      return;
    }

    const cached = await dayReportRepo.get(date);
    if (cached) {
      setState({ status: "ready", totals, reportText: cached.reportText });
      return;
    }

    await generate(totals, profile);
  }, [date, profile, generate]);

  useEffect(() => {
    if (profileLoading || apiKeyLoading) return;
    load();
  }, [profileLoading, apiKeyLoading, load]);

  const retryGenerate = useCallback(() => {
    if (state.status !== "error" || !profile) return;
    generate(state.totals, profile);
  }, [state, profile, generate]);

  return { state, retryGenerate, reload: load, reloadProfile };
}
