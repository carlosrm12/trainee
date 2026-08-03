import { useEffect, useRef, useState } from "react";
import { SQLiteWorkoutSessionRepository } from "../../data/repositories/SQLiteWorkoutSessionRepository";
import type { SetLog, WorkoutSession } from "../../domain/entities";

const sessionRepo = new SQLiteWorkoutSessionRepository();

export function useWorkoutSession(routineId: string) {
  const [session, setSession] = useState<WorkoutSession | null>(null);
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    (async () => {
      // Si ya hay una sesión activa para esta misma rutina, la reusamos
      // en vez de crear una nueva (esto es lo que permite reanudar).
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

  async function completeSession(notes: string | null = null) {
    if (!session) return;
    await sessionRepo.complete(session.id, notes);
  }

  async function discardSession() {
    if (!session) return;
    await sessionRepo.discard(session.id);
  }

  return { session, logSet, getLoggedSets, completeSession, discardSession };
}
