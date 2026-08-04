import { useCallback, useEffect, useState } from "react";
import { SQLiteExerciseRepository } from "../../data/repositories/SQLiteExerciseRepository";
import type { Exercise, MuscleGroup } from "../../domain/entities";

const exerciseRepo = new SQLiteExerciseRepository();

export function useExerciseCatalog() {
  const [all, setAll] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [muscleGroupFilter, setMuscleGroupFilter] = useState<
    MuscleGroup | "all"
  >("all");

  const load = useCallback(async () => {
    setLoading(true);
    const rows = await exerciseRepo.getAll();
    setAll(rows);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const exercises = all.filter((ex) => {
    const matchesSearch = ex.name.toLowerCase().includes(search.toLowerCase());
    const matchesGroup =
      muscleGroupFilter === "all" || ex.muscleGroup === muscleGroupFilter;
    return matchesSearch && matchesGroup;
  });

  async function createExercise(input: Omit<Exercise, "id">) {
    const created = await exerciseRepo.create(input);
    await load();
    return created;
  }

  async function updateExercise(
    id: string,
    changes: Partial<Omit<Exercise, "id">>,
  ) {
    await exerciseRepo.update(id, changes);
    await load();
  }

  async function deleteExercise(id: string) {
    await exerciseRepo.delete(id);
    await load();
  }

  return {
    loading,
    exercises,
    search,
    setSearch,
    muscleGroupFilter,
    setMuscleGroupFilter,
    createExercise,
    updateExercise,
    deleteExercise,
    reload: load,
  };
}
