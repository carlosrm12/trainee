import { useCallback, useEffect, useState } from "react";
import { SQLiteRoutineRepository } from "../../data/repositories/SQLiteRoutineRepository";
import { SQLiteWorkoutSessionRepository } from "../../data/repositories/SQLiteWorkoutSessionRepository";
import type { WorkoutSession } from "../../domain/entities";

const sessionRepo = new SQLiteWorkoutSessionRepository();
const routineRepo = new SQLiteRoutineRepository();

export type SessionWithRoutineName = WorkoutSession & { routineName: string };

export function useSessionHistory() {
  const [sessions, setSessions] = useState<SessionWithRoutineName[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const history = await sessionRepo.getHistory(50);
    const routineNameCache = new Map<string, string>();

    const withNames = await Promise.all(
      history.map(async (s) => {
        if (!routineNameCache.has(s.routineId)) {
          const routine = await routineRepo.getById(s.routineId);
          routineNameCache.set(
            s.routineId,
            routine?.name ?? "Rutina eliminada",
          );
        }
        return { ...s, routineName: routineNameCache.get(s.routineId)! };
      }),
    );

    setSessions(withNames);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { sessions, loading, reload: load };
}
