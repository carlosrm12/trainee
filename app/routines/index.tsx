import { useRoutines } from "@/features/routines/useRoutines";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";

export default function RoutinesScreen() {
  const router = useRouter();
  const { routines, loading, reload } = useRoutines();

  useFocusEffect(
    useCallback(() => {
      reload();
    }, [reload]),
  );

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-bg-base">
        <ActivityIndicator color="#F5C518" />
      </View>
    );
  }

  return (
    <ScrollView
      className="flex-1 bg-bg-base px-4 pt-16"
      contentContainerStyle={{ paddingBottom: 100 }}
    >
      <View className="flex-row items-center justify-between mb-6">
        <Text className="text-text-primary text-2xl font-bold">Rutinas</Text>
        <Pressable onPress={() => router.push("/routines/new")}>
          <Text className="text-accent font-semibold">+ Nueva</Text>
        </Pressable>
      </View>

      {routines.length === 0 && (
        <Text className="text-text-secondary">
          Todavía no tienes rutinas. Crea la primera.
        </Text>
      )}

      {routines.map((r) => (
        <View
          key={r.id}
          className="rounded-card border border-border-subtle bg-bg-surface p-4 mb-3"
        >
          <Text className="text-text-primary text-lg font-semibold">
            {r.name}
          </Text>
          <Text className="text-text-secondary text-sm mt-1">
            {r.dayLabel} · {r.exerciseCount} ejercicios
          </Text>
          <View className="flex-row gap-3 mt-3">
            <Pressable
              onPress={() => router.push(`/routines/${r.id}/edit`)}
              className="rounded-pill bg-bg-surface-alt border border-border-subtle px-4 py-2"
            >
              <Text className="text-text-primary font-semibold">Editar</Text>
            </Pressable>
            <Pressable
              onPress={() => router.push(`/execute/${r.id}`)}
              className="rounded-pill bg-accent px-4 py-2"
            >
              <Text className="text-text-on-accent font-semibold">Empezar</Text>
            </Pressable>
          </View>
        </View>
      ))}
    </ScrollView>
  );
}
