import { useExecuteRoutine } from "@/features/workout-session/useExecuteRoutine";
import { useWorkoutSession } from "@/features/workout-session/useWorkoutSession";
import { RestTimerRing } from "@/shared/components/RestTimerRing";
import { SetStepper } from "@/shared/components/SetStepper";
import { useRestTimer } from "@/shared/hooks/useRestTimer";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";

export default function ExecuteRoutineScreen() {
  const { routineId } = useLocalSearchParams<{ routineId: string }>();
  const router = useRouter();

  const execution = useExecuteRoutine(routineId);
  const { session, logSet, completeSession } = useWorkoutSession(routineId);
  const rest = useRestTimer();

  const [currentSetNumber, setCurrentSetNumber] = useState(1);
  const [weightKg, setWeightKg] = useState(0);
  const [reps, setReps] = useState(0);
  const [routineFinished, setRoutineFinished] = useState(false);

  useEffect(() => {
    if (!execution.currentStep) return;
    setCurrentSetNumber(1);
    setReps(execution.currentStep.repMin);
  }, [execution.currentStep?.id]);

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
        execution.goToNextExercise();
      } else {
        setCurrentSetNumber((n) => n + 1);
      }
    });
  }

  if (execution.loading || !session) {
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

  // --- Pantalla de descanso (reemplaza el contenido normal mientras rest.active) ---
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
        <SetStepper
          label="Peso"
          value={weightKg}
          unit="kg"
          step={2.5}
          onChange={setWeightKg}
        />
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
