import { useCallback } from "react";
import { SQLiteWorkoutSessionRepository } from "../../data/repositories/SQLiteWorkoutSessionRepository";
import type { SetLog } from "../../domain/entities";

const sessionRepo = new SQLiteWorkoutSessionRepository();

export function useLastWeightLookup() {
  const getLastWeight = useCallback(
    async (exerciseId: string): Promise<number | null> => {
      const allSets = await sessionRepo.getSetHistoryForExercise(exerciseId);
      if (allSets.length === 0) return null;

      const bySession = new Map<string, SetLog[]>();
      for (const s of allSets) {
        const list = bySession.get(s.sessionId) ?? [];
        list.push(s);
        bySession.set(s.sessionId, list);
      }

      let mostRecentDate: string | null = null;
      let mostRecentSets: SetLog[] = [];

      for (const [sessionId, sets] of bySession) {
        const session = await sessionRepo.getById(sessionId);
        if (!session || session.status !== "completed") continue;
        if (!mostRecentDate || session.date > mostRecentDate) {
          mostRecentDate = session.date;
          mostRecentSets = sets;
        }
      }

      if (mostRecentSets.length === 0) return null;
      const lastSet = [...mostRecentSets].sort(
        (a, b) => b.setNumber - a.setNumber,
      )[0];
      return lastSet.weightKg;
    },
    [],
  );

  return { getLastWeight };
}
