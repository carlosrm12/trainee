import { useEffect, useRef, useState } from "react";
import { SQLiteWorkoutSessionRepository } from "../../data/repositories/SQLiteWorkoutSessionRepository";
import type { SetLog, WorkoutSession } from "../../domain/entities";

const sessionRepo = new SQLiteWorkoutSessionRepository();

export function useWorkoutSession(routineId: string | undefined) {
  const [session, setSession] = useState<WorkoutSession | null>(null);
  // Guarda el routineId con el que ya arrancamos sesión, no un boolean.
  // Con un boolean simple, si el primer render llega con routineId vacío
  // (puede pasar según el timing de useLocalSearchParams), el guard
  // bloqueaba para siempre cualquier reintento con el id real.
  const startedForRoutineId = useRef<string | null>(null);

  useEffect(() => {
    if (!routineId) return;
    if (startedForRoutineId.current === routineId) return;
    startedForRoutineId.current = routineId;

    (async () => {
      const active = await sessionRepo.getActive();
      if (active && active.routineId === routineId) {
        setSession(active);
      } else {
        const newSession = await sessionRepo.start(routineId);
        setSession(newSession);
      }
    })();
  }, [routineId]);

  async function logSet(input: Omit<SetLog, "id" | "sessionId">) {
    if (!session) return null;
    return sessionRepo.logSet({ ...input, sessionId: session.id });
  }

  async function getLoggedSets(): Promise<SetLog[]> {
    if (!session) return [];
    return sessionRepo.getSetLogsForSession(session.id);
  }

  async function updatePosition(routineExerciseId: string) {
    if (!session) return;
    await sessionRepo.updateLastPosition(session.id, routineExerciseId);
  }

  async function completeSession(notes: string | null = null) {
    if (!session) return;
    await sessionRepo.complete(session.id, notes);
  }

  async function discardSession() {
    if (!session) return;
    await sessionRepo.discard(session.id);
  }

  return {
    session,
    logSet,
    getLoggedSets,
    updatePosition,
    completeSession,
    discardSession,
  };
}
