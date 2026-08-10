import { useReminders } from "@/features/notifications/useReminders";
import { useProfileStats } from "@/features/profile/useProfileStats";
import { useRoutines } from "@/features/routines/useRoutines";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";

export default function RemindersScreen() {
  const router = useRouter();
  const {
    routines,
    loading: routinesLoading,
    reload: reloadRoutines,
  } = useRoutines();
  const {
    streakDays,
    trainedToday,
    loading: statsLoading,
    reload: reloadStats,
  } = useProfileStats();

  useFocusEffect(
    useCallback(() => {
      reloadRoutines();
      reloadStats();
    }, [reloadRoutines, reloadStats]),
  );

  const reminders = useReminders({ routines, streakDays, trainedToday });
  const loading = routinesLoading || statsLoading;

  return (
    <View className="flex-1 bg-bg-base px-4 pt-16">
      <View className="flex-row items-center justify-between mb-6">
        <Text className="text-text-primary text-2xl font-sans-bold">
          Recordatorios
        </Text>
        <Pressable onPress={() => router.back()}>
          <Text className="text-accent font-sans-semibold">Cerrar</Text>
        </Pressable>
      </View>

      {loading && (
        <View className="items-center mt-10">
          <ActivityIndicator color="#F5C518" />
        </View>
      )}

      {!loading && reminders.length === 0 && (
        <View className="items-center mt-10">
          <Text className="text-text-primary text-lg font-sans-semibold mb-1">
            Vas al día 🎉
          </Text>
          <Text className="text-text-secondary font-sans text-center">
            No tienes recordatorios pendientes por ahora.
          </Text>
        </View>
      )}

      {!loading &&
        reminders.map((reminder) => (
          <View
            key={reminder.id}
            className="flex-row items-center rounded-card border border-border-subtle bg-bg-surface px-4 py-3 mb-3"
          >
            <Text className="text-lg mr-3">{reminder.icon}</Text>
            <View className="flex-1">
              <Text className="text-text-primary font-sans-semibold">
                {reminder.title}
              </Text>
              <Text className="text-text-secondary text-xs font-sans mt-0.5">
                {reminder.subtitle}
              </Text>
            </View>
          </View>
        ))}
    </View>
  );
}
