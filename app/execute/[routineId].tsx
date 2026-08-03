import { useExecuteRoutine } from "@/features/workout-session/useExecuteRoutine";
import { useLastWeightLookup } from "@/features/workout-session/useLastWeightLookup";
import { useWorkoutSession } from "@/features/workout-session/useWorkoutSession";
import { RestTimerRing } from "@/shared/components/RestTimerRing";
import { SetStepper } from "@/shared/components/SetStepper";
import { useRestTimer } from "@/shared/hooks/useRestTimer";
import {
  DEFAULT_BAR_WEIGHT_KG,
  perSideToTotal,
  totalToPerSide,
} from "@/shared/utils/weightConversion";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";

export default function ExecuteRoutineScreen() {
  const { routineId } = useLocalSearchParams<{ routineId: string }>();
  const router = useRouter();

  const execution = useExecuteRoutine(routineId);
  const { session, logSet, getLoggedSets, completeSession } =
    useWorkoutSession(routineId);
  const { getLastWeight } = useLastWeightLookup();
  const rest = useRestTimer();

  const [currentSetNumber, setCurrentSetNumber] = useState(1);
  const [weightKg, setWeightKg] = useState(0);
  const [reps, setReps] = useState(0);
  const [routineFinished, setRoutineFinished] = useState(false);
  const [initialized, setInitialized] = useState(false);

  // Helper: prepara los campos (set/reps/peso) para el ejercicio que se le pasa.
  // Se usa tanto al reanudar como al avanzar de ejercicio normalmente — un
  // único punto de verdad, nada de efectos reactivos adivinando cuándo correr.
  async function primeExercise(
    routineExerciseId: string,
    exerciseId: string,
    weightMode: string,
    repMin: number,
    setNumber: number,
  ) {
    setCurrentSetNumber(setNumber);
    setReps(repMin);
    const lastWeight = await getLastWeight(exerciseId);
    setWeightKg(
      lastWeight ?? (weightMode === "per_side" ? DEFAULT_BAR_WEIGHT_KG : 0),
    );
  }

  // Corre UNA sola vez, cuando ya cargaron ejercicios y sesión. Calcula en qué
  // ejercicio/set arrancar contando los SetLog ya existentes — sesión nueva
  // da "ejercicio 0, set 1" naturalmente; sesión reanudada retoma donde quedó.
  useEffect(() => {
    if (initialized) return;
    if (execution.loading || !session || execution.steps.length === 0) return;

    (async () => {
      const loggedSets = await getLoggedSets();
      const loggedCountByStep = new Map<string, number>();
      for (const log of loggedSets) {
        loggedCountByStep.set(
          log.routineExerciseId,
          (loggedCountByStep.get(log.routineExerciseId) ?? 0) + 1,
        );
      }

      let resumeIndex = 0;
      let resumeSetNumber = 1;
      let allDone = true;

      for (let i = 0; i < execution.steps.length; i++) {
        const s = execution.steps[i];
        const logged = loggedCountByStep.get(s.id) ?? 0;
        if (logged < s.targetSets) {
          resumeIndex = i;
          resumeSetNumber = logged + 1;
          allDone = false;
          break;
        }
      }

      if (allDone) {
        await completeSession(null);
        setRoutineFinished(true);
      } else {
        execution.goToIndex(resumeIndex);
        const resumeStep = execution.steps[resumeIndex];
        await primeExercise(
          resumeStep.id,
          resumeStep.exercise.id,
          resumeStep.exercise.weightInputMode,
          resumeStep.repMin,
          resumeSetNumber,
        );
      }
      setInitialized(true);
    })();
  }, [execution.loading, session, execution.steps.length, initialized]);

  async function handleMarkSet() {
    const step = execution.currentStep;
    if (!step) return;

    await logSet({
      routineExerciseId: step.id,
      setNumber: currentSetNumber,
      weightKg,
      reps,
    });

    const isLastSetOfExercise = currentSetNumber >= step.targetSets;
    const isVeryLastSet = isLastSetOfExercise && execution.isLastStep;

    if (isVeryLastSet) {
      await completeSession(null);
      setRoutineFinished(true);
      return;
    }

    rest.start(step.restSeconds, () => {
      if (isLastSetOfExercise) {
        const nextIndex = execution.currentIndex + 1;
        const nextStep = execution.steps[nextIndex];
        execution.goToIndex(nextIndex);
        if (nextStep) {
          primeExercise(
            nextStep.id,
            nextStep.exercise.id,
            nextStep.exercise.weightInputMode,
            nextStep.repMin,
            1,
          );
        }
      } else {
        setCurrentSetNumber((n) => n + 1);
      }
    });
  }

  if (execution.loading || !session || !initialized) {
    return (
      <View className="flex-1 items-center justify-center bg-bg-base">
        <ActivityIndicator color="#F5C518" />
      </View>
    );
  }

  if (routineFinished) {
    return (
      <View className="flex-1 items-center justify-center bg-bg-base px-6">
        <Text className="text-text-primary text-2xl font-bold text-center">
          ¡Rutina completada! 🎉
        </Text>
        <Text className="text-text-secondary text-center mt-2">
          El resumen detallado de la sesión llega en un paso más adelante.
        </Text>
        <Pressable
          onPress={() => router.replace("/")}
          className="mt-8 rounded-pill bg-accent px-6 py-3"
        >
          <Text className="text-text-on-accent font-semibold">
            Volver al inicio
          </Text>
        </Pressable>
      </View>
    );
  }

  if (rest.active) {
    return (
      <View className="flex-1 items-center justify-center bg-bg-base px-6">
        <Text className="text-text-primary text-xl font-bold mb-8">
          Descanso
        </Text>
        <RestTimerRing remaining={rest.remaining} total={rest.total} />
        <View className="flex-row gap-4 mt-10">
          <Pressable
            onPress={() => rest.adjust(-15)}
            className="rounded-pill bg-bg-surface-alt px-5 py-3"
          >
            <Text className="text-text-primary font-semibold">-15s</Text>
          </Pressable>
          <Pressable
            onPress={() => rest.adjust(15)}
            className="rounded-pill bg-bg-surface-alt px-5 py-3"
          >
            <Text className="text-text-primary font-semibold">+15s</Text>
          </Pressable>
        </View>
        <Pressable onPress={rest.skip} className="mt-8">
          <Text className="text-text-secondary underline">Saltar descanso</Text>
        </Pressable>
      </View>
    );
  }

  const step = execution.currentStep;
  if (!step) {
    return (
      <View className="flex-1 items-center justify-center bg-bg-base px-6">
        <Text className="text-text-primary text-lg text-center">
          Esta rutina no tiene ejercicios configurados.
        </Text>
      </View>
    );
  }

  const dots = Array.from(
    { length: step.targetSets },
    (_, i) => i < currentSetNumber - 1,
  );

  return (
    <View className="flex-1 bg-bg-base px-6 pt-16">
      <View className="flex-row items-center justify-between mb-8">
        <Pressable onPress={() => router.back()}>
          <Text className="text-text-secondary text-2xl">✕</Text>
        </Pressable>
        <Text className="text-text-secondary">
          Ejercicio {execution.currentIndex + 1} de {execution.totalSteps}
        </Text>
        <View style={{ width: 24 }} />
      </View>

      <Text className="text-text-primary text-3xl font-bold">
        {step.exercise.name}
      </Text>
      <Text className="text-text-secondary mt-1">
        grupo: {step.exercise.muscleGroup}
      </Text>

      <Text className="text-text-secondary mt-8">
        Set {currentSetNumber} de {step.targetSets} · objetivo {step.repMin}-
        {step.repMax} reps
      </Text>

      <View className="flex-row gap-4 mt-4">
        {step.exercise.weightInputMode === "per_side" ? (
          <SetStepper
            label="Peso por lado"
            value={totalToPerSide(weightKg)}
            unit="kg"
            step={2.5}
            helperText={`Total: ${weightKg}kg`}
            onChange={(perSide) => setWeightKg(perSideToTotal(perSide))}
          />
        ) : (
          <SetStepper
            label="Peso"
            value={weightKg}
            unit="kg"
            step={2.5}
            onChange={setWeightKg}
          />
        )}
        <SetStepper label="Reps" value={reps} step={1} onChange={setReps} />
      </View>

      <Pressable
        onPress={handleMarkSet}
        className="mt-8 self-center rounded-pill bg-accent px-8 py-4"
      >
        <Text className="text-text-on-accent font-semibold text-base">
          ✓ Marcar set
        </Text>
      </Pressable>

      <View className="flex-row justify-center gap-2 mt-6">
        {dots.map((done, i) => (
          <View
            key={i}
            className={`w-3 h-3 rounded-full ${done ? "bg-success" : "bg-bg-surface-alt"}`}
          />
        ))}
      </View>
    </View>
  );
}
