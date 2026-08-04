import { useCallback, useEffect, useState } from "react";
import { SQLiteExerciseRepository } from "../../data/repositories/SQLiteExerciseRepository";
import { SQLiteRoutineRepository } from "../../data/repositories/SQLiteRoutineRepository";
import type { Exercise, Routine, RoutineExercise } from "../../domain/entities";

const routineRepo = new SQLiteRoutineRepository();
const exerciseRepo = new SQLiteExerciseRepository();

export type RoutineExerciseWithName = RoutineExercise & {
  exerciseName: string;
};

export function useRoutineEditor(routineId: string) {
  const [loading, setLoading] = useState(true);
  const [routine, setRoutine] = useState<Routine | null>(null);
  const [items, setItems] = useState<RoutineExerciseWithName[]>([]);
  const [catalog, setCatalog] = useState<Exercise[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    const [r, exercises, allExercises] = await Promise.all([
      routineRepo.getById(routineId),
      routineRepo.getExercises(routineId),
      exerciseRepo.getAll(),
    ]);
    setRoutine(r);
    setCatalog(allExercises);

    const withNames = [...exercises]
      .sort((a, b) => a.order - b.order)
      .map((re) => ({
        ...re,
        exerciseName:
          allExercises.find((e) => e.id === re.exerciseId)?.name ?? "Ejercicio",
      }));
    setItems(withNames);
    setLoading(false);
  }, [routineId]);

  useEffect(() => {
    load();
  }, [load]);

  async function addExercise(exerciseId: string) {
    const nextOrder =
      items.length > 0 ? Math.max(...items.map((i) => i.order)) + 1 : 1;
    await routineRepo.addExercise({
      routineId,
      exerciseId,
      order: nextOrder,
      restSeconds: 90,
      targetSets: 3,
      repMin: 8,
      repMax: 12,
    });
    await load();
  }

  async function updateExercise(
    id: string,
    changes: Partial<Omit<RoutineExercise, "id" | "routineId">>,
  ) {
    await routineRepo.updateExercise(id, changes);
    await load();
  }

  async function removeExercise(id: string) {
    await routineRepo.removeExercise(id);
    await load();
  }

  async function moveExercise(id: string, direction: "up" | "down") {
    const index = items.findIndex((i) => i.id === id);
    if (index === -1) return;
    const swapIndex = direction === "up" ? index - 1 : index + 1;
    if (swapIndex < 0 || swapIndex >= items.length) return;

    const a = items[index];
    const b = items[swapIndex];
    await routineRepo.updateExercise(a.id, { order: b.order });
    await routineRepo.updateExercise(b.id, { order: a.order });
    await load();
  }

  async function updateRoutineInfo(changes: Partial<Omit<Routine, "id">>) {
    await routineRepo.update(routineId, changes);
    await load();
  }

  async function deleteRoutine() {
    await routineRepo.delete(routineId);
  }

  return {
    loading,
    routine,
    items,
    catalog,
    addExercise,
    updateExercise,
    removeExercise,
    moveExercise,
    updateRoutineInfo,
    deleteRoutine,
    reload: load,
  };
}
