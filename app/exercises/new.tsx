import type { MuscleGroup, WeightInputMode } from "@/domain/entities";
import { useExerciseCatalog } from "@/features/exercises/useExerciseCatalog";
import { MUSCLE_GROUPS } from "@/shared/constants/muscleGroups";
import { WEIGHT_INPUT_MODES } from "@/shared/constants/weightInputModes";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";

export default function NewExerciseScreen() {
  const router = useRouter();
  const { createExercise } = useExerciseCatalog();

  const [name, setName] = useState("");
  const [muscleGroup, setMuscleGroup] = useState<MuscleGroup>("chest");
  const [weightInputMode, setWeightInputMode] =
    useState<WeightInputMode>("total");
  const [saving, setSaving] = useState(false);

  async function handleCreate() {
    if (!name.trim()) return;
    setSaving(true);
    await createExercise({
      name: name.trim(),
      muscleGroup,
      isCustom: true,
      weightInputMode,
    });
    setSaving(false);
    router.back();
  }

  return (
    <ScrollView
      className="flex-1 bg-bg-base px-6 pt-16"
      contentContainerStyle={{ paddingBottom: 60 }}
    >
      <Pressable onPress={() => router.back()} className="mb-6">
        <Text className="text-text-secondary text-2xl">‹</Text>
      </Pressable>

      <Text className="text-text-primary text-2xl font-bold mb-6">
        Nuevo ejercicio
      </Text>

      <Text className="text-text-secondary mb-2">Nombre</Text>
      <TextInput
        value={name}
        onChangeText={setName}
        placeholder="ej. Face Pull"
        placeholderTextColor="#9B9BA5"
        className="bg-bg-surface border border-border-subtle rounded-chip px-4 py-3 text-text-primary mb-6"
      />

      <Text className="text-text-secondary mb-2">Grupo muscular</Text>
      <View className="flex-row flex-wrap gap-2 mb-6">
        {MUSCLE_GROUPS.map((g) => (
          <Pressable
            key={g.value}
            onPress={() => setMuscleGroup(g.value)}
            className={`rounded-pill px-4 py-2 border ${
              muscleGroup === g.value
                ? "bg-accent border-accent"
                : "bg-bg-surface border-border-subtle"
            }`}
          >
            <Text
              className={
                muscleGroup === g.value
                  ? "text-text-on-accent font-semibold"
                  : "text-text-secondary"
              }
            >
              {g.label}
            </Text>
          </Pressable>
        ))}
      </View>

      <Text className="text-text-secondary mb-2">Modo de peso</Text>
      <View className="flex-row flex-wrap gap-2 mb-8">
        {WEIGHT_INPUT_MODES.map((m) => (
          <Pressable
            key={m.value}
            onPress={() => setWeightInputMode(m.value)}
            className={`rounded-pill px-4 py-2 border ${
              weightInputMode === m.value
                ? "bg-accent border-accent"
                : "bg-bg-surface border-border-subtle"
            }`}
          >
            <Text
              className={
                weightInputMode === m.value
                  ? "text-text-on-accent font-semibold"
                  : "text-text-secondary"
              }
            >
              {m.label}
            </Text>
          </Pressable>
        ))}
      </View>

      <Pressable
        onPress={handleCreate}
        disabled={!name.trim() || saving}
        className={`rounded-pill py-4 items-center ${name.trim() ? "bg-accent" : "bg-bg-surface-alt"}`}
      >
        <Text
          className={
            name.trim()
              ? "text-text-on-accent font-semibold"
              : "text-text-secondary"
          }
        >
          {saving ? "Creando..." : "Crear ejercicio"}
        </Text>
      </Pressable>
    </ScrollView>
  );
}
