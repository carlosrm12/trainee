import { useRoutineEditor } from "@/features/routines/useRoutineEditor";
import { useActiveSession } from "@/features/workout-session/useActiveSession";
import { BrutalistButton } from "@/shared/components/BrutalistButton";
import { ExerciseRow } from "@/shared/components/ExerciseRow";
import { SetStepper } from "@/shared/components/SetStepper";
import { DAYS, getDayLabel } from "@/shared/constants/days";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";

export default function EditRoutineScreen() {
  const { routineId } = useLocalSearchParams<{ routineId: string }>();
  const router = useRouter();
  const {
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
  } = useRoutineEditor(routineId);
  const { activeSession } = useActiveSession();

  const [showPicker, setShowPicker] = useState(false);
  const [pickerSearch, setPickerSearch] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingInfo, setEditingInfo] = useState(false);
  const [nameDraft, setNameDraft] = useState("");
  const [dayDraft, setDayDraft] = useState<number | null>(null);

  function openInfoEditor() {
    setNameDraft(routine?.name ?? "");
    setDayDraft(routine?.dayOfWeek ?? null);
    setEditingInfo(true);
  }

  async function saveInfo() {
    if (!nameDraft.trim()) return;
    await updateRoutineInfo({ name: nameDraft.trim(), dayOfWeek: dayDraft });
    setEditingInfo(false);
  }

  function confirmDeleteRoutine() {
    Alert.alert(
      "Borrar rutina",
      `Esto elimina "${routine?.name}" y todos sus ejercicios configurados. Tu historial de entrenamientos pasados NO se borra. ¿Continuar?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Borrar",
          style: "destructive",
          onPress: async () => {
            await deleteRoutine();
            router.replace("/routines");
          },
        },
      ],
    );
  }

  function openOptionsMenu() {
    Alert.alert(routine?.name ?? "Rutina", undefined, [
      { text: "Editar info", onPress: openInfoEditor },
      {
        text: "Borrar rutina",
        style: "destructive",
        onPress: confirmDeleteRoutine,
      },
      { text: "Cancelar", style: "cancel" },
    ]);
  }

  function handleStartRoutine() {
    if (activeSession && activeSession.routineId !== routineId) {
      Alert.alert(
        "Tienes un entrenamiento sin terminar",
        `Termina o descarta "${activeSession.routineName}" antes de empezar otra rutina.`,
      );
      return;
    }
    router.push(`/execute/${routineId}`);
  }

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-bg-base">
        <ActivityIndicator color="#F5C518" />
      </View>
    );
  }

  if (showPicker) {
    return (
      <View className="flex-1 bg-bg-base px-6 pt-16">
        <View className="flex-row items-center justify-between mb-6">
          <Pressable onPress={() => setShowPicker(false)}>
            <Text className="text-text-secondary text-2xl">✕</Text>
          </Pressable>
          <Text className="text-text-primary font-sans-semibold">
            Elegir ejercicio
          </Text>
          <View style={{ width: 24 }} />
        </View>
        <ScrollView contentContainerStyle={{ paddingBottom: 60 }}>
          <TextInput
            value={pickerSearch}
            onChangeText={setPickerSearch}
            placeholder="Buscar ejercicio..."
            placeholderTextColor="#9B9BA5"
            className="bg-bg-surface border border-border-subtle rounded-chip px-4 py-3 text-text-primary mb-4"
          />
          {catalog
            .filter((ex) =>
              ex.name.toLowerCase().includes(pickerSearch.toLowerCase()),
            )
            .map((ex) => (
              <Pressable
                key={ex.id}
                onPress={async () => {
                  await addExercise(ex.id);
                  setShowPicker(false);
                  setPickerSearch("");
                }}
                className="rounded-card border border-border-subtle bg-bg-surface p-4 mb-3"
              >
                <Text className="text-text-primary font-sans-semibold">
                  {ex.name}
                </Text>
                <Text className="text-text-secondary text-sm font-sans mt-1">
                  {ex.muscleGroup}
                </Text>
              </Pressable>
            ))}
        </ScrollView>
      </View>
    );
  }

  return (
    <ScrollView
      className="flex-1 bg-bg-base px-6 pt-16"
      contentContainerStyle={{ paddingBottom: 100 }}
    >
      <View className="flex-row items-center justify-between mb-1">
        <Pressable onPress={() => router.back()}>
          <Text className="text-text-secondary text-2xl">‹</Text>
        </Pressable>
        <Pressable onPress={openOptionsMenu}>
          <Text className="text-text-secondary text-2xl">⋮</Text>
        </Pressable>
      </View>

      {editingInfo ? (
        <View className="mb-8 mt-4">
          <Text className="text-text-secondary font-sans mb-2">Nombre</Text>
          <TextInput
            value={nameDraft}
            onChangeText={setNameDraft}
            placeholderTextColor="#9B9BA5"
            className="bg-bg-surface border border-border-subtle rounded-chip px-4 py-3 text-text-primary mb-4"
          />
          <Text className="text-text-secondary font-sans mb-2">
            Día de la semana
          </Text>
          <View className="flex-row flex-wrap gap-2 mb-4">
            {DAYS.map((d) => (
              <Pressable
                key={d.value}
                onPress={() =>
                  setDayDraft(dayDraft === d.value ? null : d.value)
                }
                className={`rounded-pill px-4 py-2 border ${
                  dayDraft === d.value
                    ? "bg-accent border-accent"
                    : "bg-bg-surface border-border-subtle"
                }`}
              >
                <Text
                  className={
                    dayDraft === d.value
                      ? "text-text-on-accent font-sans-semibold"
                      : "text-text-secondary font-sans"
                  }
                >
                  {d.label}
                </Text>
              </Pressable>
            ))}
          </View>
          <View className="flex-row gap-3">
            <Pressable
              onPress={saveInfo}
              disabled={!nameDraft.trim()}
              className={`rounded-pill px-5 py-3 ${nameDraft.trim() ? "bg-accent" : "bg-bg-surface-alt"}`}
            >
              <Text
                className={
                  nameDraft.trim()
                    ? "text-text-on-accent font-sans-semibold"
                    : "text-text-secondary font-sans"
                }
              >
                Guardar
              </Text>
            </Pressable>
            <Pressable
              onPress={() => setEditingInfo(false)}
              className="rounded-pill bg-bg-surface border border-border-subtle px-5 py-3"
            >
              <Text className="text-text-secondary font-sans-semibold">
                Cancelar
              </Text>
            </Pressable>
          </View>
        </View>
      ) : (
        <View className="mt-4 mb-8">
          <Text className="text-text-primary text-2xl font-sans-bold">
            {routine?.name ?? "Rutina"}
          </Text>
          <Text className="text-text-secondary text-sm font-sans mt-1">
            {routine ? getDayLabel(routine.dayOfWeek) : ""}
          </Text>
        </View>
      )}

      <Text className="text-text-secondary text-sm font-sans mb-2">
        Ejercicios ({items.length})
      </Text>

      {items.length === 0 && (
        <Text className="text-text-secondary font-sans mb-6">
          Todavía no hay ejercicios. Agrega el primero.
        </Text>
      )}

      {items.length > 0 && (
        <View className="rounded-card border border-border-subtle bg-bg-surface px-4 mb-6">
          {items.map((item, index) => (
            <View
              key={item.id}
              className={index > 0 ? "border-t border-border-subtle" : ""}
            >
              <Pressable
                onPress={() =>
                  setEditingId(editingId === item.id ? null : item.id)
                }
                className="flex-row items-center"
              >
                <ExerciseRow
                  order={index + 1}
                  name={item.exerciseName}
                  meta={`${item.targetSets} sets · ${item.repMin}-${item.repMax} reps · ${item.restSeconds}s descanso`}
                />
                <View className="flex-row gap-3 pl-2">
                  <Pressable
                    onPress={() => moveExercise(item.id, "up")}
                    disabled={index === 0}
                  >
                    <Text
                      className={
                        index === 0
                          ? "text-border-subtle"
                          : "text-text-secondary font-sans"
                      }
                    >
                      ▲
                    </Text>
                  </Pressable>
                  <Pressable
                    onPress={() => moveExercise(item.id, "down")}
                    disabled={index === items.length - 1}
                  >
                    <Text
                      className={
                        index === items.length - 1
                          ? "text-border-subtle"
                          : "text-text-secondary font-sans"
                      }
                    >
                      ▼
                    </Text>
                  </Pressable>
                </View>
              </Pressable>

              {editingId === item.id && (
                <View className="pb-4 -mt-1">
                  <Pressable
                    onPress={() => removeExercise(item.id)}
                    className="self-start rounded-pill bg-bg-surface-alt border border-danger px-4 py-2 mb-3"
                  >
                    <Text className="text-danger font-sans-semibold">
                      Quitar ejercicio
                    </Text>
                  </Pressable>
                  <View className="flex-row gap-3">
                    <SetStepper
                      label="Series"
                      value={item.targetSets}
                      step={1}
                      min={1}
                      onChange={(v) =>
                        updateExercise(item.id, { targetSets: v })
                      }
                    />
                    <SetStepper
                      label="Reps mín"
                      value={item.repMin}
                      step={1}
                      min={1}
                      onChange={(v) => updateExercise(item.id, { repMin: v })}
                    />
                    <SetStepper
                      label="Reps máx"
                      value={item.repMax}
                      step={1}
                      min={1}
                      onChange={(v) => updateExercise(item.id, { repMax: v })}
                    />
                  </View>
                  <View className="mt-4">
                    <SetStepper
                      label="Descanso (segundos)"
                      value={item.restSeconds}
                      step={15}
                      min={0}
                      onChange={(v) =>
                        updateExercise(item.id, { restSeconds: v })
                      }
                    />
                  </View>
                </View>
              )}
            </View>
          ))}
        </View>
      )}

      <Pressable
        onPress={() => setShowPicker(true)}
        className="rounded-pill bg-bg-surface border border-border-subtle py-4 items-center mb-8"
      >
        <Text className="text-text-primary font-sans-semibold">
          + Agregar ejercicio
        </Text>
      </Pressable>

      {items.length > 0 && (
        <BrutalistButton label="Empezar rutina" onPress={handleStartRoutine} />
      )}
    </ScrollView>
  );
}
