import { useRoutineEditor } from "@/features/routines/useRoutineEditor";
import { SetStepper } from "@/shared/components/SetStepper";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
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
  } = useRoutineEditor(routineId);

  const [showPicker, setShowPicker] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

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
          <Text className="text-text-primary font-semibold">
            Elegir ejercicio
          </Text>
          <View style={{ width: 24 }} />
        </View>
        <ScrollView contentContainerStyle={{ paddingBottom: 60 }}>
          {catalog.map((ex) => (
            <Pressable
              key={ex.id}
              onPress={async () => {
                await addExercise(ex.id);
                setShowPicker(false);
              }}
              className="rounded-card border border-border-subtle bg-bg-surface p-4 mb-3"
            >
              <Text className="text-text-primary font-semibold">{ex.name}</Text>
              <Text className="text-text-secondary text-sm mt-1">
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
      <View className="flex-row items-center justify-between mb-6">
        <Pressable onPress={() => router.back()}>
          <Text className="text-text-secondary text-2xl">‹</Text>
        </Pressable>
        <Text className="text-text-primary font-semibold">
          {routine?.name ?? "Rutina"}
        </Text>
        <View style={{ width: 24 }} />
      </View>

      {items.length === 0 && (
        <Text className="text-text-secondary mb-6">
          Todavía no hay ejercicios. Agrega el primero.
        </Text>
      )}

      {items.map((item, index) => (
        <View
          key={item.id}
          className="rounded-card border border-border-subtle bg-bg-surface p-4 mb-3"
        >
          <View className="flex-row items-center justify-between">
            <Text className="text-text-primary font-semibold flex-1">
              {item.exerciseName}
            </Text>
            <View className="flex-row gap-3">
              <Pressable
                onPress={() => moveExercise(item.id, "up")}
                disabled={index === 0}
              >
                <Text
                  className={
                    index === 0 ? "text-border-subtle" : "text-text-secondary"
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
                      : "text-text-secondary"
                  }
                >
                  ▼
                </Text>
              </Pressable>
            </View>
          </View>

          <Text className="text-text-secondary text-sm mt-1">
            {item.targetSets} sets · {item.repMin}-{item.repMax} reps ·{" "}
            {item.restSeconds}s descanso
          </Text>

          <View className="flex-row gap-3 mt-3">
            <Pressable
              onPress={() =>
                setEditingId(editingId === item.id ? null : item.id)
              }
              className="rounded-pill bg-bg-surface-alt border border-border-subtle px-4 py-2"
            >
              <Text className="text-text-primary font-semibold">
                {editingId === item.id ? "Cerrar" : "Editar"}
              </Text>
            </Pressable>
            <Pressable
              onPress={() => removeExercise(item.id)}
              className="rounded-pill bg-bg-surface-alt border border-danger px-4 py-2"
            >
              <Text className="text-danger font-semibold">Quitar</Text>
            </Pressable>
          </View>

          {editingId === item.id && (
            <View className="mt-4 pt-4 border-t border-border-subtle">
              <View className="flex-row gap-3">
                <SetStepper
                  label="Series"
                  value={item.targetSets}
                  step={1}
                  min={1}
                  onChange={(v) => updateExercise(item.id, { targetSets: v })}
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
                  onChange={(v) => updateExercise(item.id, { restSeconds: v })}
                />
              </View>
            </View>
          )}
        </View>
      ))}

      <Pressable
        onPress={() => setShowPicker(true)}
        className="rounded-pill bg-accent py-4 items-center mt-4"
      >
        <Text className="text-text-on-accent font-semibold">
          + Agregar ejercicio
        </Text>
      </Pressable>
    </ScrollView>
  );
}
