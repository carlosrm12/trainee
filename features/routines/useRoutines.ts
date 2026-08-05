import { useCallback, useEffect, useState } from "react";
import { SQLiteRoutineRepository } from "../../data/repositories/SQLiteRoutineRepository";
import type { Routine } from "../../domain/entities";
import { getDayLabel, sortableDay } from "../../shared/constants/days";

const repo = new SQLiteRoutineRepository();

export type RoutineWithMeta = Routine & {
  exerciseCount: number;
  totalSets: number;
  dayLabel: string;
};

export function useRoutines() {
  const [routines, setRoutines] = useState<RoutineWithMeta[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const all = await repo.getAll();

    const withMeta = await Promise.all(
      all.map(async (r) => {
        const exercises = await repo.getExercises(r.id);
        return {
          ...r,
          exerciseCount: exercises.length,
          totalSets: exercises.reduce((sum, e) => sum + e.targetSets, 0),
          dayLabel: getDayLabel(r.dayOfWeek),
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
