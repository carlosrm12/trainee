import { useExerciseProgress } from "@/features/history/useExerciseProgress";
import { useSettings } from "@/features/profile/useSettings";
import { formatShortDate } from "@/shared/utils/formatDate";
import { formatWeight } from "@/shared/utils/weightUnit";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";

export default function ExerciseProgressScreen() {
  const { exerciseId } = useLocalSearchParams<{ exerciseId: string }>();
  const router = useRouter();
  const { loading, exerciseName, sessionGroups } =
    useExerciseProgress(exerciseId);
  const { weightUnit } = useSettings();

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-bg-base">
        <ActivityIndicator color="#F5C518" />
      </View>
    );
  }

  return (
    <ScrollView
      className="flex-1 bg-bg-base px-6 pt-16"
      contentContainerStyle={{ paddingBottom: 60 }}
    >
      <Pressable onPress={() => router.back()} className="mb-6">
        <Text className="text-text-secondary text-2xl">‹</Text>
      </Pressable>

      <Text className="text-text-primary text-2xl font-sans-bold mb-8">
        {exerciseName}
      </Text>

      {/* Gráfica de volumen — Fase 2 (victory-native), fuera de este roadmap */}

      <Text className="text-text-secondary text-sm font-sans mb-2">
        Historial de sets
      </Text>

      {sessionGroups.length === 0 && (
        <Text className="text-text-secondary font-sans">
          Todavía no hay sesiones completadas con este ejercicio.
        </Text>
      )}

      {sessionGroups.length > 0 && (
        <View className="rounded-card border border-border-subtle bg-bg-surface px-4">
          {sessionGroups.map((g, index) => (
            <View
              key={g.sessionId}
              className={`py-3 flex-row items-center justify-between ${
                index > 0 ? "border-t border-border-subtle" : ""
              }`}
            >
              <Text className="text-text-secondary text-sm font-sans">
                {formatShortDate(g.dateIso)}
              </Text>
              <Text className="text-text-primary text-sm font-sans flex-1 text-right ml-3">
                {g.sets
                  .map(
                    (s) => `${formatWeight(s.weightKg, weightUnit)}×${s.reps}`,
                  )
                  .join("  ")}
              </Text>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}
