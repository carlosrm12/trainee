import { useCallback, useEffect, useState } from "react";
import { SQLiteRoutineRepository } from "../../data/repositories/SQLiteRoutineRepository";
import { SQLiteWorkoutSessionRepository } from "../../data/repositories/SQLiteWorkoutSessionRepository";
import type { WorkoutSession } from "../../domain/entities";

const sessionRepo = new SQLiteWorkoutSessionRepository();
const routineRepo = new SQLiteRoutineRepository();

export type ActiveSessionInfo = WorkoutSession & { routineName: string };

export function useActiveSession() {
  const [activeSession, setActiveSession] = useState<ActiveSessionInfo | null>(
    null,
  );
  const [loading, setLoading] = useState(true);

  const check = useCallback(async () => {
    setLoading(true);
    const active = await sessionRepo.getActive();
    if (!active) {
      setActiveSession(null);
      setLoading(false);
      return;
    }
    const routine = await routineRepo.getById(active.routineId);
    setActiveSession({ ...active, routineName: routine?.name ?? "Rutina" });
    setLoading(false);
  }, []);

  useEffect(() => {
    check();
  }, [check]);

  async function discard() {
    if (!activeSession) return;
    await sessionRepo.discard(activeSession.id);
    await check();
  }

  return { activeSession, loading, discard, recheck: check };
}
