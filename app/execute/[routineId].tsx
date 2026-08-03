import type { SetLog } from "@/domain/entities";
import type { ExecutionStep } from "@/features/workout-session/useExecuteRoutine";
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
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";

// Helper: sets "de trabajo" (excluye calentamiento) para un ejercicio dado.
function workingSetsFor(logs: SetLog[], routineExerciseId: string) {
  return logs.filter(
    (l) => l.routineExerciseId === routineExerciseId && !l.isWarmup,
  );
}

function warmupSetsFor(logs: SetLog[], routineExerciseId: string) {
  return logs
    .filter((l) => l.routineExerciseId === routineExerciseId && l.isWarmup)
    .sort((a, b) => a.setNumber - b.setNumber);
}

export default function ExecuteRoutineScreen() {
  const { routineId } = useLocalSearchParams<{ routineId: string }>();
  const router = useRouter();

  const execution = useExecuteRoutine(routineId);
  const { session, logSet, getLoggedSets, updatePosition, completeSession } =
    useWorkoutSession(routineId);
  const { getLastWeight } = useLastWeightLookup();
  const rest = useRestTimer();

  const [currentSetNumber, setCurrentSetNumber] = useState(1);
  const [weightKg, setWeightKg] = useState(0);
  const [reps, setReps] = useState(0);
  const [routineFinished, setRoutineFinished] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const [sessionSetLogs, setSessionSetLogs] = useState<SetLog[]>([]);
  const [showExerciseList, setShowExerciseList] = useState(false);

  async function refreshSessionLogs(): Promise<SetLog[]> {
    const logs = await getLoggedSets();
    setSessionSetLogs(logs);
    return logs;
  }

  // Carga (o crea por defecto) los valores de peso/reps para un set de TRABAJO
  // puntual de un ejercicio dado. Los calentamientos nunca pasan por acá.
  async function loadSetValues(
    step: ExecutionStep,
    setNumber: number,
    logs: SetLog[],
  ) {
    const existing = workingSetsFor(logs, step.id).find(
      (l) => l.setNumber === setNumber,
    );
    setCurrentSetNumber(setNumber);
    if (existing) {
      setWeightKg(existing.weightKg);
      setReps(existing.reps);
      return;
    }
    setReps(step.repMin);
    const lastWeight = await getLastWeight(step.exercise.id);
    setWeightKg(
      lastWeight ??
        (step.exercise.weightInputMode === "per_side"
          ? DEFAULT_BAR_WEIGHT_KG
          : 0),
    );
  }

  function jumpToExercise(index: number, logs: SetLog[]) {
    const targetStep = execution.steps[index];
    if (!targetStep) return;
    execution.goToIndex(index);
    updatePosition(targetStep.id);
    const loggedForStep = workingSetsFor(logs, targetStep.id);
    const setNumber =
      loggedForStep.length < targetStep.targetSets
        ? loggedForStep.length + 1
        : 1;
    loadSetValues(targetStep, setNumber, logs);
  }

  useEffect(() => {
    if (initialized) return;
    if (execution.loading || !session) return;

    if (execution.steps.length === 0) {
      // Rutina sin ejercicios todavía (recién creada) — no hay nada que
      // reanudar, deja pasar a la pantalla de "sin ejercicios configurados".
      setInitialized(true);
      return;
    }

    (async () => {
      const logs = await refreshSessionLogs();

      const allDone = execution.steps.every(
        (s) => workingSetsFor(logs, s.id).length >= s.targetSets,
      );

      if (allDone) {
        await completeSession(null);
        setRoutineFinished(true);
      } else {
        // Prioriza retomar exactamente donde estabas parado. Solo cae a
        // "primer ejercicio incompleto" si nunca se guardó posición, o si
        // ese ejercicio en particular ya quedó completo (por edición manual).
        const lastIndex = session.lastRoutineExerciseId
          ? execution.steps.findIndex(
              (s) => s.id === session.lastRoutineExerciseId,
            )
          : -1;
        const lastStillIncomplete =
          lastIndex !== -1 &&
          workingSetsFor(logs, execution.steps[lastIndex].id).length <
            execution.steps[lastIndex].targetSets;

        const resumeIndex = lastStillIncomplete
          ? lastIndex
          : execution.steps.findIndex(
              (s) => workingSetsFor(logs, s.id).length < s.targetSets,
            );

        jumpToExercise(resumeIndex === -1 ? 0 : resumeIndex, logs);
      }
      setInitialized(true);
    })();
  }, [execution.loading, session, execution.steps.length, initialized]);

  async function handleAddWarmup() {
    const step = execution.currentStep;
    if (!step) return;
    const nextWarmupNumber = warmupSetsFor(sessionSetLogs, step.id).length + 1;
    await logSet({
      routineExerciseId: step.id,
      setNumber: nextWarmupNumber,
      weightKg,
      reps,
      isWarmup: true,
    });
    await refreshSessionLogs();
  }

  async function handleMarkSet() {
    const step = execution.currentStep;
    if (!step) return;

    const wasAlreadyLogged = workingSetsFor(sessionSetLogs, step.id).some(
      (s) => s.setNumber === currentSetNumber,
    );

    await logSet({
      routineExerciseId: step.id,
      setNumber: currentSetNumber,
      weightKg,
      reps,
      isWarmup: false,
    });
    const updatedLogs = await refreshSessionLogs();

    if (wasAlreadyLogged) {
      Alert.alert(
        "Set actualizado",
        `Guardé el cambio en el Set ${currentSetNumber}.`,
      );
      return;
    }

    const allDone = execution.steps.every(
      (s) => workingSetsFor(updatedLogs, s.id).length >= s.targetSets,
    );

    if (allDone) {
      await completeSession(null);
      setRoutineFinished(true);
      return;
    }

    const isLastSetOfExercise = currentSetNumber >= step.targetSets;

    rest.start(step.restSeconds, () => {
      if (!isLastSetOfExercise) {
        loadSetValues(step, currentSetNumber + 1, updatedLogs);
        return;
      }
      const nextIncompleteIndex = execution.steps.findIndex(
        (s) => workingSetsFor(updatedLogs, s.id).length < s.targetSets,
      );
      if (nextIncompleteIndex !== -1) {
        jumpToExercise(nextIncompleteIndex, updatedLogs);
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

  if (showExerciseList) {
    return (
      <View className="flex-1 bg-bg-base px-6 pt-16">
        <View className="flex-row items-center justify-between mb-6">
          <Pressable onPress={() => setShowExerciseList(false)}>
            <Text className="text-text-secondary text-2xl">✕</Text>
          </Pressable>
          <Text className="text-text-primary font-semibold">Ejercicios</Text>
          <View style={{ width: 24 }} />
        </View>
        <ScrollView contentContainerStyle={{ paddingBottom: 60 }}>
          {execution.steps.map((s, i) => {
            const logged = workingSetsFor(sessionSetLogs, s.id).length;
            const done = logged >= s.targetSets;
            return (
              <Pressable
                key={s.id}
                onPress={() => {
                  jumpToExercise(i, sessionSetLogs);
                  setShowExerciseList(false);
                }}
                className={`rounded-card border p-4 mb-3 bg-bg-surface ${
                  i === execution.currentIndex
                    ? "border-accent"
                    : "border-border-subtle"
                }`}
              >
                <Text className="text-text-primary font-semibold">
                  {s.exercise.name}
                </Text>
                <Text
                  className={`text-sm mt-1 ${done ? "text-success" : "text-text-secondary"}`}
                >
                  {logged}/{s.targetSets} sets {done ? "✓" : ""}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>
    );
  }

  const step = execution.currentStep;
  if (!step) {
    return (
      <View className="flex-1 items-center justify-center bg-bg-base px-6">
        <Text className="text-text-primary text-lg text-center mb-6">
          Esta rutina no tiene ejercicios configurados.
        </Text>
        <Pressable
          onPress={() => router.replace(`/routines/${routineId}/edit`)}
          className="rounded-pill bg-accent px-6 py-3"
        >
          <Text className="text-text-on-accent font-semibold">
            Agregar ejercicios
          </Text>
        </Pressable>
      </View>
    );
  }

  const workingForCurrentStep = workingSetsFor(sessionSetLogs, step.id);
  const warmupsForCurrentStep = warmupSetsFor(sessionSetLogs, step.id);
  const dotsData = Array.from({ length: step.targetSets }, (_, i) => {
    const setNum = i + 1;
    return {
      setNum,
      done: workingForCurrentStep.some((l) => l.setNumber === setNum),
      isCurrent: setNum === currentSetNumber,
    };
  });

  return (
    <View className="flex-1 bg-bg-base px-6 pt-16">
      <View className="flex-row items-center justify-between mb-8">
        <Pressable onPress={() => router.back()}>
          <Text className="text-text-secondary text-2xl">✕</Text>
        </Pressable>
        <Pressable onPress={() => setShowExerciseList(true)}>
          <Text className="text-accent">
            Ejercicio {execution.currentIndex + 1} de {execution.totalSteps} ▾
          </Text>
        </Pressable>
        <View style={{ width: 24 }} />
      </View>

      <Text className="text-text-primary text-3xl font-bold">
        {step.exercise.name}
      </Text>
      <Text className="text-text-secondary mt-1">
        grupo: {step.exercise.muscleGroup}
      </Text>

      {warmupsForCurrentStep.length > 0 && (
        <View className="mt-4">
          <Text className="text-text-secondary text-xs">Calentamiento</Text>
          <Text className="text-text-secondary text-sm mt-1">
            {warmupsForCurrentStep
              .map((w) => `${w.weightKg}kg×${w.reps}`)
              .join("  ·  ")}
          </Text>
        </View>
      )}

      <Pressable onPress={handleAddWarmup} className="mt-3">
        <Text className="text-text-secondary text-sm underline">
          + Agregar calentamiento ({weightKg}kg × {reps})
        </Text>
      </Pressable>

      <Text className="text-text-secondary mt-6">
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
        {dotsData.map((d) => (
          <Pressable
            key={d.setNum}
            onPress={() => loadSetValues(step, d.setNum, sessionSetLogs)}
          >
            <View
              className={`w-4 h-4 rounded-full ${d.done ? "bg-success" : "bg-bg-surface-alt"} ${
                d.isCurrent ? "border-2 border-accent" : ""
              }`}
            />
          </Pressable>
        ))}
      </View>
    </View>
  );
}
