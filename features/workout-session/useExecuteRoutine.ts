import { useCallback, useEffect, useState } from "react";
import { SQLiteExerciseRepository } from "../../data/repositories/SQLiteExerciseRepository";
import { SQLiteRoutineRepository } from "../../data/repositories/SQLiteRoutineRepository";
import type { Exercise, RoutineExercise } from "../../domain/entities";

const routineRepo = new SQLiteRoutineRepository();
const exerciseRepo = new SQLiteExerciseRepository();

export type ExecutionStep = RoutineExercise & { exercise: Exercise };

export function useExecuteRoutine(routineId: string) {
  const [steps, setSteps] = useState<ExecutionStep[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      const routineExercises = await routineRepo.getExercises(routineId);
      const withExercise = await Promise.all(
        routineExercises.map(async (re) => {
          const exercise = await exerciseRepo.getById(re.exerciseId);
          return { ...re, exercise: exercise! };
        }),
      );
      if (!cancelled) {
        setSteps(withExercise);
        setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [routineId]);

  const currentStep = steps[currentIndex] ?? null;
  const isLastStep = currentIndex === steps.length - 1;

  const goToNextExercise = useCallback(() => {
    setCurrentIndex((i) => Math.min(i + 1, steps.length - 1));
  }, [steps.length]);

  const goToPreviousExercise = useCallback(() => {
    setCurrentIndex((i) => Math.max(i - 1, 0));
  }, []);

  const goToIndex = useCallback(
    (index: number) => {
      setCurrentIndex(Math.max(0, Math.min(index, steps.length - 1)));
    },
    [steps.length],
  );

  return {
    loading,
    steps,
    currentStep,
    currentIndex,
    totalSteps: steps.length,
    isLastStep,
    goToNextExercise,
    goToPreviousExercise,
    goToIndex,
  };
}
