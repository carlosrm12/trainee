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
  const [sessionSetLogs, setSessionSetLogs] = useState<SetLog[]>([]);
  const [showExerciseList, setShowExerciseList] = useState(false);

  async function refreshSessionLogs(): Promise<SetLog[]> {
    const logs = await getLoggedSets();
    setSessionSetLogs(logs);
    return logs;
  }

  // Carga (o crea por defecto) los valores de peso/reps para un set puntual de
  // un ejercicio dado — reusa el dato ya guardado si existe, o calcula un
  // default razonable si no. Es el único lugar que decide "qué mostrar".
  async function loadSetValues(
    step: ExecutionStep,
    setNumber: number,
    logs: SetLog[],
  ) {
    const existing = logs.find(
      (l) => l.routineExerciseId === step.id && l.setNumber === setNumber,
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
    const loggedForStep = logs.filter(
      (l) => l.routineExerciseId === targetStep.id,
    );
    const setNumber =
      loggedForStep.length < targetStep.targetSets
        ? loggedForStep.length + 1
        : 1;
    loadSetValues(targetStep, setNumber, logs);
  }

  // Posicionamiento inicial: sesión nueva da "ejercicio 0, set 1" naturalmente
  // (no hay logs); sesión reanudada retoma justo donde quedó.
  useEffect(() => {
    if (initialized) return;
    if (execution.loading || !session || execution.steps.length === 0) return;

    (async () => {
      const logs = await refreshSessionLogs();

      const allDone = execution.steps.every(
        (s) =>
          logs.filter((l) => l.routineExerciseId === s.id).length >=
          s.targetSets,
      );

      if (allDone) {
        await completeSession(null);
        setRoutineFinished(true);
      } else {
        const firstIncompleteIndex = execution.steps.findIndex(
          (s) =>
            logs.filter((l) => l.routineExerciseId === s.id).length <
            s.targetSets,
        );
        jumpToExercise(
          firstIncompleteIndex === -1 ? 0 : firstIncompleteIndex,
          logs,
        );
      }
      setInitialized(true);
    })();
  }, [execution.loading, session, execution.steps.length, initialized]);

  async function handleMarkSet() {
    const step = execution.currentStep;
    if (!step) return;

    const wasAlreadyLogged = sessionSetLogs.some(
      (s) =>
        s.routineExerciseId === step.id && s.setNumber === currentSetNumber,
    );

    await logSet({
      routineExerciseId: step.id,
      setNumber: currentSetNumber,
      weightKg,
      reps,
    });
    const updatedLogs = await refreshSessionLogs();

    if (wasAlreadyLogged) {
      // Edición de un set ya existente: guarda y se queda aquí, sin timer ni
      // avance automático — el usuario está corrigiendo, no progresando.
      Alert.alert(
        "Set actualizado",
        `Guardé el cambio en el Set ${currentSetNumber}.`,
      );
      return;
    }

    const allDone = execution.steps.every(
      (s) =>
        updatedLogs.filter((l) => l.routineExerciseId === s.id).length >=
        s.targetSets,
    );

    if (allDone) {
      await completeSession(null);
      setRoutineFinished(true);
      return;
    }

    const isLastSetOfExercise = currentSetNumber >= step.targetSets;

    rest.start(step.restSeconds, () => {
      if (!isLastSetOfExercise) {
        setCurrentSetNumber((n) => n + 1);
        loadSetValues(step, currentSetNumber + 1, updatedLogs);
        return;
      }
      const nextIncompleteIndex = execution.steps.findIndex(
        (s) =>
          updatedLogs.filter((l) => l.routineExerciseId === s.id).length <
          s.targetSets,
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
            const logged = sessionSetLogs.filter(
              (l) => l.routineExerciseId === s.id,
            ).length;
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
        <Text className="text-text-primary text-lg text-center">
          Esta rutina no tiene ejercicios configurados.
        </Text>
      </View>
    );
  }

  const loggedForCurrentStep = sessionSetLogs.filter(
    (s) => s.routineExerciseId === step.id,
  );
  const dotsData = Array.from({ length: step.targetSets }, (_, i) => {
    const setNum = i + 1;
    return {
      setNum,
      done: loggedForCurrentStep.some((l) => l.setNumber === setNum),
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
