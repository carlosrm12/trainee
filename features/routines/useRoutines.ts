import { useCallback, useEffect, useState } from "react";
import { SQLiteExerciseRepository } from "../../data/repositories/SQLiteExerciseRepository";
import { SQLiteRoutineRepository } from "../../data/repositories/SQLiteRoutineRepository";
import type { MuscleGroup, Routine } from "../../domain/entities";
import { getDayLabel, sortableDay } from "../../shared/constants/days";
import {
  getDominantCategory,
  type MuscleCategory,
} from "../../shared/constants/muscleCategories";
import { estimateMinutes } from "../../shared/utils/routineEstimation";

const repo = new SQLiteRoutineRepository();
const exerciseRepo = new SQLiteExerciseRepository();

export type RoutineWithMeta = Routine & {
  exerciseCount: number;
  totalSets: number;
  minutesEstimate: number;
  dayLabel: string;
  category: MuscleCategory | null;
};

export function useRoutines() {
  const [routines, setRoutines] = useState<RoutineWithMeta[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const [all, catalog] = await Promise.all([
      repo.getAll(),
      exerciseRepo.getAll(),
    ]);
    const muscleById = new Map(catalog.map((e) => [e.id, e.muscleGroup]));

    const withMeta = await Promise.all(
      all.map(async (r) => {
        const exercises = await repo.getExercises(r.id);
        const muscleGroups = exercises
          .map((e) => muscleById.get(e.exerciseId))
          .filter((mg): mg is MuscleGroup => Boolean(mg));

        return {
          ...r,
          exerciseCount: exercises.length,
          totalSets: exercises.reduce((sum, e) => sum + e.targetSets, 0),
          minutesEstimate: estimateMinutes(
            exercises.map((e) => ({
              targetSets: e.targetSets,
              restSeconds: e.restSeconds,
            })),
          ),
          dayLabel: getDayLabel(r.dayOfWeek),
          category: getDominantCategory(muscleGroups),
        };
      }),
    );

    withMeta.sort(
      (a, b) => sortableDay(a.dayOfWeek) - sortableDay(b.dayOfWeek),
    );
    setRoutines(withMeta);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { routines, loading, reload: load };
}
