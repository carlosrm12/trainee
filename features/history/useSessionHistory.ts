import { useCallback, useEffect, useState } from "react";
import { SQLiteRoutineRepository } from "../../data/repositories/SQLiteRoutineRepository";
import { SQLiteWorkoutSessionRepository } from "../../data/repositories/SQLiteWorkoutSessionRepository";
import type { WorkoutSession } from "../../domain/entities";

const sessionRepo = new SQLiteWorkoutSessionRepository();
const routineRepo = new SQLiteRoutineRepository();

export type SessionWithStats = WorkoutSession & {
  routineName: string;
  totalSets: number;
  totalVolumeKg: number;
  durationMinutes: number | null;
};

export function useSessionHistory() {
  const [sessions, setSessions] = useState<SessionWithStats[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const history = await sessionRepo.getHistory(50);
    const routineNameCache = new Map<string, string>();

    const withStats = await Promise.all(
      history.map(async (s) => {
        if (!routineNameCache.has(s.routineId)) {
          const routine = await routineRepo.getById(s.routineId);
          routineNameCache.set(
            s.routineId,
            routine?.name ?? "Rutina eliminada",
          );
        }

        const logs = await sessionRepo.getSetLogsForSession(s.id);
        const workingLogs = logs.filter((l) => !l.isWarmup);
        const totalVolumeKg = workingLogs.reduce(
          (sum, l) => sum + l.weightKg * l.reps,
          0,
        );
        const durationMinutes = s.completedAt
          ? Math.max(
              1,
              Math.round(
                (new Date(s.completedAt).getTime() -
                  new Date(s.date).getTime()) /
                  60000,
              ),
            )
          : null;

        return {
          ...s,
          routineName: routineNameCache.get(s.routineId)!,
          totalSets: workingLogs.length,
          totalVolumeKg,
          durationMinutes,
        };
      }),
    );

    setSessions(withStats);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { sessions, loading, reload: load };
}
