import { useEffect, useRef, useState } from "react";
import { SQLiteWorkoutSessionRepository } from "../../data/repositories/SQLiteWorkoutSessionRepository";
import type { SetLog, WorkoutSession } from "../../domain/entities";

const sessionRepo = new SQLiteWorkoutSessionRepository();

export function useWorkoutSession(routineId: string) {
  const [session, setSession] = useState<WorkoutSession | null>(null);
  const started = useRef(false);

  useEffect(() => {
    // Guard contra doble-ejecución de useEffect en modo desarrollo (React StrictMode),
    // que si no crearía dos WorkoutSession por cada entrada a esta pantalla.
    if (started.current) return;
    started.current = true;
    sessionRepo.start(routineId).then(setSession);
  }, [routineId]);

  async function logSet(input: Omit<SetLog, "id" | "sessionId">) {
    if (!session) return null;
    return sessionRepo.logSet({ ...input, sessionId: session.id });
  }

  async function completeSession(notes: string | null = null) {
    if (!session) return;
    await sessionRepo.complete(session.id, notes);
  }

  async function discardSession() {
    if (!session) return;
    await sessionRepo.discard(session.id);
  }

  return { session, logSet, completeSession, discardSession };
}
