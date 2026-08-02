import { useCallback, useEffect, useState } from "react";
import { SQLiteRoutineRepository } from "../../data/repositories/SQLiteRoutineRepository";
import type { Routine } from "../../domain/entities";

const repo = new SQLiteRoutineRepository();

const DAY_NAMES = [
  "Domingo",
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
];

export type RoutineWithMeta = Routine & {
  exerciseCount: number;
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
          dayLabel:
            r.dayOfWeek !== null ? DAY_NAMES[r.dayOfWeek] : "Sin día asignado",
        };
      }),
    );

    withMeta.sort((a, b) => (a.dayOfWeek ?? 99) - (b.dayOfWeek ?? 99));
    setRoutines(withMeta);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { routines, loading, reload: load };
}
