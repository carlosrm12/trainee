import { SQLiteRoutineRepository } from "@/data/repositories/SQLiteRoutineRepository";
import type { SetLog } from "@/domain/entities";
import { useSettings } from "@/features/profile/useSettings";
import type { ExecutionStep } from "@/features/workout-session/useExecuteRoutine";
import { useExecuteRoutine } from "@/features/workout-session/useExecuteRoutine";
import { useLastWeightLookup } from "@/features/workout-session/useLastWeightLookup";
import { useWorkoutSession } from "@/features/workout-session/useWorkoutSession";
import { BrutalistButton } from "@/shared/components/BrutalistButton";
import { RestTimerRing } from "@/shared/components/RestTimerRing";
import { SetStepper } from "@/shared/components/SetStepper";
import { StatRow } from "@/shared/components/StatRow";
import { useRestTimer } from "@/shared/hooks/useRestTimer";
import {
  perSideToTotal,
  totalToPerSide,
} from "@/shared/utils/weightConversion";
import {
  getDefaultBarWeight,
  getWeightStep,
  kgToLb,
  lbToKg,
} from "@/shared/utils/weightUnit";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";

const routineRepo = new SQLiteRoutineRepository();

function formatKg(n: number): string {
  const rounded = Math.round(n);
  return rounded.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

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

// Convierte un kg guardado a la unidad de entrada del ejercicio, para mostrarlo.
function kgToDisplayUnit(kg: number, step: ExecutionStep): number {
  return step.exercise.inputUnit === "lb" ? kgToLb(kg) : kg;
}

// Convierte lo que el usuario tecleó (en la unidad del ejercicio) de vuelta a kg para guardar.
function displayUnitToKg(value: number, step: ExecutionStep): number {
  return step.exercise.inputUnit === "lb" ? lbToKg(value) : value;
}

export default function ExecuteRoutineScreen() {
  const { routineId } = useLocalSearchParams<{ routineId: string }>();
  const router = useRouter();

  const execution = useExecuteRoutine(routineId);
  const { session, logSet, getLoggedSets, updatePosition, completeSession } =
    useWorkoutSession(routineId);
  const { getLastWeight } = useLastWeightLookup();
  const { soundEnabled, vibrationEnabled, notificationsEnabled } =
    useSettings();
  const rest = useRestTimer({
    soundEnabled,
    vibrationEnabled,
    notificationsEnabled,
  });

  const [currentSetNumber, setCurrentSetNumber] = useState(1);
  const [weightKg, setWeightKg] = useState(0);
  const [reps, setReps] = useState(0);
  const [showSummary, setShowSummary] = useState(false);
  const [routineName, setRoutineName] = useState("");
  const [sessionNotes, setSessionNotes] = useState("");
  const [initialized, setInitialized] = useState(false);
  const [sessionSetLogs, setSessionSetLogs] = useState<SetLog[]>([]);
  const [showExerciseList, setShowExerciseList] = useState(false);
  const [justMarked, setJustMarked] = useState(false);

  useEffect(() => {
    routineRepo.getById(routineId).then((r) => {
      if (r) setRoutineName(r.name);
    });
  }, [routineId]);

  async function refreshSessionLogs(): Promise<SetLog[]> {
    const logs = await getLoggedSets();
    setSessionSetLogs(logs);
    return logs;
  }

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
    if (lastWeight !== null) {
      setWeightKg(lastWeight);
      return;
    }
    // Sin historial: si es "por lado", arranca en la barra sola (en la unidad
    // del ejercicio, convertida a kg para guardar); si es "total", en 0.
    if (step.exercise.weightInputMode === "per_side") {
      const barInUnit = getDefaultBarWeight(step.exercise.inputUnit);
      setWeightKg(displayUnitToKg(barInUnit, step));
    } else {
      setWeightKg(0);
    }
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
      setInitialized(true);
      return;
    }

    (async () => {
      const logs = await refreshSessionLogs();

      const allDone = execution.steps.every(
        (s) => workingSetsFor(logs, s.id).length >= s.targetSets,
      );

      if (allDone) {
        setShowSummary(true);
      } else {
        const lastIndex = session.lastRoutineExerciseId
          ? execution.steps.findIndex(
              (s) => s.id === session.lastRoutineExerciseId,
            )
          : -1;
        const lastStillIncomplete =
          lastIndex !== -1 &&
          workingSetsFor(logs, execution.steps[lastIndex].id).length;
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

    setJustMarked(true);
    await new Promise((resolve) => setTimeout(resolve, 300));
    setJustMarked(false);

    const allDone = execution.steps.every(
      (s) => workingSetsFor(updatedLogs, s.id).length >= s.targetSets,
    );

    if (allDone) {
      setShowSummary(true);
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

  async function handleSaveSummary() {
    await completeSession(sessionNotes.trim() || null);
    router.replace("/");
  }

  if (execution.loading || !session || !initialized) {
    return (
      <View className="flex-1 items-center justify-center bg-bg-base">
        <ActivityIndicator color="#F5C518" />
      </View>
    );
  }

  if (showSummary) {
    const workingLogs = sessionSetLogs.filter((l) => !l.isWarmup);
    const totalSets = workingLogs.length;
    const totalVolumeKg = workingLogs.reduce(
      (sum, l) => sum + l.weightKg * l.reps,
      0,
    );
    const durationMinutes = Math.max(
      1,
      Math.round((Date.now() - new Date(session.date).getTime()) / 60000),
    );

    return (
      <ScrollView
        className="flex-1 bg-bg-base px-6 pt-20"
        contentContainerStyle={{ paddingBottom: 60 }}
      >
        <Text className="text-text-primary text-2xl font-sans-bold text-center">
          ¡Sesión completada! 🎉
        </Text>
        <Text className="text-text-secondary font-sans text-center mt-1 mb-6">
          {routineName}
        </Text>

        <View className="rounded-card border border-border-subtle bg-bg-surface p-4 mb-6">
          <Text className="text-text-secondary text-sm font-sans mb-3 text-center">
            {durationMinutes} min · {execution.steps.length} ejercicios
          </Text>
          <StatRow
            items={[
              { value: String(totalSets), label: "sets" },
              {
                value: `${formatKg(totalVolumeKg)} kg`,
                label: "volumen total",
              },
            ]}
          />
        </View>

        <Text className="text-text-secondary text-sm font-sans mb-2">
          Nota (opcional)
        </Text>
        <TextInput
          value={sessionNotes}
          onChangeText={setSessionNotes}
          placeholder="¿Cómo te sentiste? Algo a mejorar la próxima..."
          placeholderTextColor="#9B9BA5"
          multiline
          numberOfLines={3}
          className="bg-bg-surface border border-border-subtle rounded-chip px-4 py-3 text-text-primary mb-8"
          style={{ minHeight: 80, textAlignVertical: "top" }}
        />

        <BrutalistButton label="Guardar" onPress={handleSaveSummary} />
      </ScrollView>
    );
  }

  if (rest.active) {
    return (
      <View className="flex-1 items-center justify-center bg-bg-base px-6">
        <Text className="text-text-primary text-xl font-sans-bold mb-8">
          Descanso
        </Text>
        <RestTimerRing
          remaining={rest.remaining}
          total={rest.total}
          onSkip={rest.skip}
        />
        <View className="flex-row gap-4 mt-10">
          <Pressable
            onPress={() => rest.adjust(-15)}
            className="rounded-pill bg-bg-surface-alt px-5 py-3"
          >
            <Text className="text-text-primary font-sans-semibold">-15s</Text>
          </Pressable>
          <Pressable
            onPress={() => rest.adjust(15)}
            className="rounded-pill bg-bg-surface-alt px-5 py-3"
          >
            <Text className="text-text-primary font-sans-semibold">+15s</Text>
          </Pressable>
        </View>
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
          <Text className="text-text-primary font-sans-semibold">
            Ejercicios
          </Text>
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
                <Text className="text-text-primary font-sans-semibold">
                  {s.exercise.name}
                </Text>
                <Text
                  className={`text-sm font-sans mt-1 ${done ? "text-success" : "text-text-secondary"}`}
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
        <Text className="text-text-primary text-lg font-sans text-center mb-6">
          Esta rutina no tiene ejercicios configurados.
        </Text>
        <Pressable
          onPress={() => router.replace(`/routines/${routineId}/edit`)}
          className="rounded-pill bg-accent px-6 py-3"
        >
          <Text className="text-text-on-accent font-sans-semibold">
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

  const unit = step.exercise.inputUnit;
  const barWeightInUnit = getDefaultBarWeight(unit);
  const weightStep = getWeightStep(unit, step.exercise.weightInputMode);
  const totalInUnit = kgToDisplayUnit(weightKg, step);
  const perSideInUnit = totalToPerSide(totalInUnit, barWeightInUnit);

  function handleWeightChange(newValueInUnit: number) {
    const newTotalInUnit =
      step!.exercise.weightInputMode === "per_side"
        ? perSideToTotal(newValueInUnit, barWeightInUnit)
        : newValueInUnit;
    setWeightKg(displayUnitToKg(newTotalInUnit, step!));
  }

  return (
    <View className="flex-1 bg-bg-base px-6 pt-16">
      <View className="flex-row items-center justify-between mb-8">
        <Pressable onPress={() => router.back()}>
          <Text className="text-text-secondary text-2xl">✕</Text>
        </Pressable>
        <Pressable onPress={() => setShowExerciseList(true)}>
          <Text className="text-accent font-sans">
            Ejercicio {execution.currentIndex + 1} de {execution.totalSteps} ▾
          </Text>
        </Pressable>
        <View style={{ width: 24 }} />
      </View>

      <Text className="text-text-primary text-3xl font-sans-bold">
        {step.exercise.name}
      </Text>
      <Text className="text-text-secondary font-sans mt-1">
        grupo: {step.exercise.muscleGroup}
      </Text>

      {warmupsForCurrentStep.length > 0 && (
        <View className="mt-4">
          <Text className="text-text-secondary text-xs font-sans">
            Calentamiento
          </Text>
          <Text className="text-text-secondary text-sm font-sans mt-1">
            {warmupsForCurrentStep
              .map(
                (w) => `${kgToDisplayUnit(w.weightKg, step)}${unit}×${w.reps}`,
              )
              .join("  ·  ")}
          </Text>
        </View>
      )}

      <Pressable onPress={handleAddWarmup} className="mt-3">
        <Text className="text-text-secondary text-sm font-sans underline">
          + Agregar calentamiento ({totalInUnit}
          {unit} × {reps})
        </Text>
      </Pressable>

      <Text className="text-text-secondary font-sans mt-6">
        Set {currentSetNumber} de {step.targetSets} · objetivo {step.repMin}-
        {step.repMax} reps
      </Text>

      <View className="flex-row gap-4 mt-4">
        {step.exercise.weightInputMode === "per_side" ? (
          <SetStepper
            label="Peso por lado"
            value={perSideInUnit}
            unit={unit}
            step={weightStep}
            helperText={`Total: ${totalInUnit}${unit}`}
            onChange={handleWeightChange}
          />
        ) : (
          <SetStepper
            label="Peso"
            value={totalInUnit}
            unit={unit}
            step={weightStep}
            onChange={handleWeightChange}
          />
        )}
        <SetStepper label="Reps" value={reps} step={1} onChange={setReps} />
      </View>

      <View className="mt-8 self-center">
        <BrutalistButton
          label={justMarked ? "✓ Listo" : "Marcar set"}
          state={justMarked ? "success" : "default"}
          disabled={justMarked}
          onPress={handleMarkSet}
        />
      </View>

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
