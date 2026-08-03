import { useCallback, useEffect, useState } from "react";
import { SQLiteExerciseRepository } from "../../data/repositories/SQLiteExerciseRepository";
import { SQLiteWorkoutSessionRepository } from "../../data/repositories/SQLiteWorkoutSessionRepository";
import type { SetLog } from "../../domain/entities";

const sessionRepo = new SQLiteWorkoutSessionRepository();
const exerciseRepo = new SQLiteExerciseRepository();

export type SessionSetGroup = {
  sessionId: string;
  dateIso: string;
  sets: SetLog[];
  maxWeightKg: number;
};

export function useExerciseProgress(exerciseId: string) {
  const [loading, setLoading] = useState(true);
  const [exerciseName, setExerciseName] = useState("");
  const [sessionGroups, setSessionGroups] = useState<SessionSetGroup[]>([]);

  const load = useCallback(async () => {
    setLoading(true);

    const exercise = await exerciseRepo.getById(exerciseId);
    setExerciseName(exercise?.name ?? "Ejercicio");

    const allSets = (
      await sessionRepo.getSetHistoryForExercise(exerciseId)
    ).filter((s) => !s.isWarmup);

    // Agrupa por sesión (un SetLog no trae la fecha directo, solo sessionId)
    const bySession = new Map<string, SetLog[]>();
    for (const set of allSets) {
      const list = bySession.get(set.sessionId) ?? [];
      list.push(set);
      bySession.set(set.sessionId, list);
    }

    const groups: SessionSetGroup[] = [];
    for (const [sessionId, sets] of bySession) {
      const session = await sessionRepo.getById(sessionId);
      if (!session || session.status !== "completed") continue;

      const sortedSets = [...sets].sort((a, b) => a.setNumber - b.setNumber);
      groups.push({
        sessionId,
        dateIso: session.date,
        sets: sortedSets,
        maxWeightKg: Math.max(...sortedSets.map((s) => s.weightKg)),
      });
    }

    groups.sort(
      (a, b) => new Date(b.dateIso).getTime() - new Date(a.dateIso).getTime(),
    );

    setSessionGroups(groups);
    setLoading(false);
  }, [exerciseId]);

  useEffect(() => {
    load();
  }, [load]);

  return { loading, exerciseName, sessionGroups, reload: load };
}
