import { useCallback, useEffect, useState } from "react";
import { SQLiteExerciseRepository } from "../../data/repositories/SQLiteExerciseRepository";
import { SQLiteRoutineRepository } from "../../data/repositories/SQLiteRoutineRepository";
import { SQLiteWorkoutSessionRepository } from "../../data/repositories/SQLiteWorkoutSessionRepository";
import type { SetLog } from "../../domain/entities";

const sessionRepo = new SQLiteWorkoutSessionRepository();
const routineRepo = new SQLiteRoutineRepository();
const exerciseRepo = new SQLiteExerciseRepository();

export type ExerciseGroup = {
  routineExerciseId: string;
  exerciseId: string;
  exerciseName: string;
  sets: SetLog[];
};

export function useSessionDetail(sessionId: string) {
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [routineName, setRoutineName] = useState("");
  const [dateIso, setDateIso] = useState("");
  const [groups, setGroups] = useState<ExerciseGroup[]>([]);
  const [totalVolumeKg, setTotalVolumeKg] = useState(0);
  const [totalSets, setTotalSets] = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    setNotFound(false);
    const session = await sessionRepo.getById(sessionId);
    if (!session) {
      setNotFound(true);
      setLoading(false);
      return;
    }

    const [routine, setLogs] = await Promise.all([
      routineRepo.getById(session.routineId),
      sessionRepo.getSetLogsForSession(sessionId),
    ]);

    const routineExercises = await routineRepo.getExercises(session.routineId);

    const groupsMap = new Map<string, ExerciseGroup>();
    for (const re of routineExercises) {
      const exercise = await exerciseRepo.getById(re.exerciseId);
      groupsMap.set(re.id, {
        routineExerciseId: re.id,
        exerciseId: re.exerciseId,
        exerciseName: exercise?.name ?? "Ejercicio eliminado",
        sets: [],
      });
    }

    for (const log of setLogs) {
      const group = groupsMap.get(log.routineExerciseId);
      if (group) group.sets.push(log);
    }

    const orderedGroups = Array.from(groupsMap.values())
      .filter((g) => g.sets.length > 0)
      .map((g) => ({
        ...g,
        sets: [...g.sets].sort((a, b) => a.setNumber - b.setNumber),
      }));

    setRoutineName(routine?.name ?? "Rutina eliminada");
    setDateIso(session.date);
    setGroups(orderedGroups);

    const workingSets = setLogs.filter((s) => !s.isWarmup);
    setTotalSets(workingSets.length);
    setTotalVolumeKg(
      workingSets.reduce((sum, s) => sum + s.weightKg * s.reps, 0),
    );
    setLoading(false);
  }, [sessionId]);

  useEffect(() => {
    load();
  }, [load]);

  async function deleteSession() {
    await sessionRepo.deleteSession(sessionId);
  }

  return {
    loading,
    routineName,
    dateIso,
    groups,
    totalVolumeKg,
    totalSets,
    deleteSession,
  };
}
