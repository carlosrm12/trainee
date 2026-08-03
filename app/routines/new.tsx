import { useCreateRoutine } from "@/features/routines/useCreateRoutine";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";

const DAYS = [
  { label: "Lunes", value: 1 },
  { label: "Martes", value: 2 },
  { label: "Miércoles", value: 3 },
  { label: "Jueves", value: 4 },
  { label: "Viernes", value: 5 },
  { label: "Sábado", value: 6 },
  { label: "Domingo", value: 0 },
];

export default function NewRoutineScreen() {
  const router = useRouter();
  const { createRoutine, creating } = useCreateRoutine();
  const [name, setName] = useState("");
  const [dayOfWeek, setDayOfWeek] = useState<number | null>(null);

  async function handleCreate() {
    if (!name.trim()) return;
    const routine = await createRoutine(name.trim(), dayOfWeek);
    router.replace(`/routines/${routine.id}/edit`);
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
        Nueva rutina
      </Text>

      <Text className="text-text-secondary mb-2">Nombre</Text>
      <TextInput
        value={name}
        onChangeText={setName}
        placeholder="ej. Lunes - Superior A"
        placeholderTextColor="#9B9BA5"
        className="bg-bg-surface border border-border-subtle rounded-chip px-4 py-3 text-text-primary mb-6"
      />

      <Text className="text-text-secondary mb-2">
        Día de la semana (opcional)
      </Text>
      <View className="flex-row flex-wrap gap-2 mb-8">
        {DAYS.map((d) => (
          <Pressable
            key={d.value}
            onPress={() => setDayOfWeek(dayOfWeek === d.value ? null : d.value)}
            className={`rounded-pill px-4 py-2 border ${
              dayOfWeek === d.value
                ? "bg-accent border-accent"
                : "bg-bg-surface border-border-subtle"
            }`}
          >
            <Text
              className={
                dayOfWeek === d.value
                  ? "text-text-on-accent font-semibold"
                  : "text-text-secondary"
              }
            >
              {d.label}
            </Text>
          </Pressable>
        ))}
      </View>

      <Pressable
        onPress={handleCreate}
        disabled={!name.trim() || creating}
        className={`rounded-pill py-4 items-center ${name.trim() ? "bg-accent" : "bg-bg-surface-alt"}`}
      >
        <Text
          className={
            name.trim()
              ? "text-text-on-accent font-semibold"
              : "text-text-secondary"
          }
        >
          {creating ? "Creando..." : "Crear rutina"}
        </Text>
      </Pressable>
    </ScrollView>
  );
}
