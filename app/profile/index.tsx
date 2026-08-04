import { useProfileStats } from "@/features/profile/useProfileStats";
import { useSettings } from "@/features/profile/useSettings";
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
      <Text className="text-text-primary text-2xl font-bold mb-1">Carlos</Text>
      <Text className="text-text-secondary mb-8">Tu progreso</Text>

      <View className="flex-row gap-10 mb-10">
        <View>
          <Text className="text-text-secondary text-sm">Racha</Text>
          <Text className="text-text-primary text-3xl font-bold">
            🔥 {streakDays}
          </Text>
        </View>
        <View>
          <Text className="text-text-secondary text-sm">Sesiones totales</Text>
          <Text className="text-text-primary text-3xl font-bold">
            {totalSessions}
          </Text>
        </View>
      </View>

      <Text className="text-text-primary font-semibold mb-3">Ajustes</Text>
      <Text className="text-text-secondary text-sm mb-2">Unidad de peso</Text>
      <View className="flex-row gap-2">
        <Pressable
          onPress={() => setWeightUnit("kg")}
          style={toggleStyle(weightUnit === "kg")}
        >
          <Text
            className={
              weightUnit === "kg"
                ? "text-text-on-accent font-semibold"
                : "text-text-secondary"
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
                ? "text-text-on-accent font-semibold"
                : "text-text-secondary"
            }
          >
            Libras (lb)
          </Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}
