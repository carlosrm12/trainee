import { useRoutines } from "@/features/routines/useRoutines";
import { BrutalistButton } from "@/shared/components/BrutalistButton";
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

  const todayDow = new Date().getDay();

  return (
    <View className="flex-1 bg-bg-base">
      <ScrollView
        className="flex-1 px-4 pt-16"
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        <Text className="text-text-primary text-2xl font-bold mb-6">
          Rutinas
        </Text>

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
            <View className="flex-row items-center justify-between">
              <Text className="text-text-primary text-base font-semibold">
                {r.name}
              </Text>
              {r.dayOfWeek === todayDow && (
                <View className="rounded-pill bg-accent px-3 py-1">
                  <Text className="text-text-on-accent text-[10px] font-semibold uppercase">
                    Hoy
                  </Text>
                </View>
              )}
            </View>
            <Text className="text-text-secondary text-sm mt-1">
              {r.dayLabel} · {r.exerciseCount} ejercicios
            </Text>
            <View className="flex-row items-center gap-3 mt-3">
              <Pressable
                onPress={() => router.push(`/routines/${r.id}/edit`)}
                className="rounded-pill bg-bg-surface-alt border border-border-subtle px-4 py-2"
              >
                <Text className="text-text-primary font-semibold">Ver</Text>
              </Pressable>
              <View className="flex-1">
                <BrutalistButton
                  label="Empezar"
                  onPress={() => router.push(`/execute/${r.id}`)}
                />
              </View>
            </View>
          </View>
        ))}
      </ScrollView>

      <View className="absolute bottom-6 right-6">
        <BrutalistButton
          variant="fab"
          label="Nueva rutina"
          onPress={() => router.push("/routines/new")}
        />
      </View>
    </View>
  );
}
