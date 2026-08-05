import { useSessionHistory } from "@/features/history/useSessionHistory";
import { SessionCard } from "@/shared/components/SessionCard";
import { formatSessionDate } from "@/shared/utils/formatDate";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback } from "react";
import { ActivityIndicator, ScrollView, Text, View } from "react-native";

export default function HistoryScreen() {
  const router = useRouter();
  const { sessions, loading, reload } = useSessionHistory();

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
      contentContainerStyle={{ paddingBottom: 60 }}
    >
      <Text className="text-text-primary text-2xl font-bold mb-6">
        Historial
      </Text>

      {sessions.length === 0 && (
        <Text className="text-text-secondary">
          Todavía no registraste ninguna sesión.
        </Text>
      )}

      {sessions.map((s) => (
        <SessionCard
          key={s.id}
          routineName={s.routineName}
          dateLabel={formatSessionDate(s.date)}
          onPress={() => router.push(`/history/${s.id}`)}
        />
      ))}
    </ScrollView>
  );
}
