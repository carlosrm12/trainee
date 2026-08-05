import { useEffect, useState } from "react";
import { SQLiteWorkoutSessionRepository } from "../../data/repositories/SQLiteWorkoutSessionRepository";
import type { RoutineWithMeta } from "./useRoutines";

const sessionRepo = new SQLiteWorkoutSessionRepository();

export function useFeaturedRoutine(routines: RoutineWithMeta[]) {
  const [featured, setFeatured] = useState<RoutineWithMeta | null>(null);

  useEffect(() => {
    if (routines.length === 0) {
      setFeatured(null);
      return;
    }

    let cancelled = false;

    (async () => {
      // 1. La programada para hoy (mismo convenio 0=Domingo que usa dayOfWeek)
      const todayDow = new Date().getDay();
      const todayMatch = routines.find((r) => r.dayOfWeek === todayDow);
      if (todayMatch) {
        if (!cancelled) setFeatured(todayMatch);
        return;
      }

      // 2. La última que usaste
      const history = await sessionRepo.getHistory(1);
      const lastUsed = history[0]
        ? routines.find((r) => r.id === history[0].routineId)
        : undefined;
      if (lastUsed) {
        if (!cancelled) setFeatured(lastUsed);
        return;
      }

      // 3. Fallback: la primera de la lista
      if (!cancelled) setFeatured(routines[0]);
    })();

    return () => {
      cancelled = true;
    };
  }, [routines]);

  return featured;
}
