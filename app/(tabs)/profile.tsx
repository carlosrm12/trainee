import { useProfileStats } from "@/features/profile/useProfileStats";
import { useSettings } from "@/features/profile/useSettings";
import { StatRow } from "@/shared/components/StatRow";
import { useFocusEffect } from "expo-router";
import { useCallback } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";

function toggleStyle(active: boolean) {
  return {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 24,
    borderWidth: 1,
    backgroundColor: active ? "#F5C518" : "#1A1A20",
    borderColor: active ? "#F5C518" : "#2A2A32",
  };
}

export default function ProfileScreen() {
  const {
    loading: statsLoading,
    totalSessions,
    streakDays,
    reload,
  } = useProfileStats();
  const { loading: settingsLoading, weightUnit, setWeightUnit } = useSettings();

  useFocusEffect(
    useCallback(() => {
      reload();
    }, [reload]),
  );

  if (statsLoading || settingsLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-bg-base">
        <ActivityIndicator color="#F5C518" />
      </View>
    );
  }

  return (
    <ScrollView
      className="flex-1 bg-bg-base px-6 pt-16"
      contentContainerStyle={{ paddingBottom: 100 }}
    >
      <Text className="text-text-primary text-2xl font-sans-bold mb-1">
        Carlos
      </Text>
      <Text className="text-text-secondary font-sans mb-8">Tu progreso</Text>

      <View className="rounded-card border border-border-subtle bg-bg-surface p-4 mb-10">
        <StatRow
          items={[
            { icon: "🔥", value: String(streakDays), label: "racha (días)" },
            { value: String(totalSessions), label: "sesiones totales" },
          ]}
        />
      </View>

      <Text className="text-text-primary font-sans-semibold mb-3">Ajustes</Text>
      <Text className="text-text-secondary text-sm font-sans mb-2">
        Unidad de peso
      </Text>
      <View className="flex-row gap-2">
        <Pressable
          onPress={() => setWeightUnit("kg")}
          style={toggleStyle(weightUnit === "kg")}
        >
          <Text
            className={
              weightUnit === "kg"
                ? "text-text-on-accent font-sans-semibold"
                : "text-text-secondary font-sans"
            }
          >
            Kilogramos (kg)
          </Text>
        </Pressable>
        <Pressable
          onPress={() => setWeightUnit("lb")}
          style={toggleStyle(weightUnit === "lb")}
        >
          <Text
            className={
              weightUnit === "lb"
                ? "text-text-on-accent font-sans-semibold"
                : "text-text-secondary font-sans"
            }
          >
            Libras (lb)
          </Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}
