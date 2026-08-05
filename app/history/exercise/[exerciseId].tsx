import { useExerciseProgress } from "@/features/history/useExerciseProgress";
import { useSettings } from "@/features/profile/useSettings";
import { formatSessionDate } from "@/shared/utils/formatDate";
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

      <Text className="text-text-primary text-2xl font-bold mb-1">
        {exerciseName}
      </Text>
      <Text className="text-text-secondary mb-8">
        {sessionGroups.length} sesión{sessionGroups.length === 1 ? "" : "es"}{" "}
        registrada
        {sessionGroups.length === 1 ? "" : "s"}
      </Text>

      {sessionGroups.length === 0 && (
        <Text className="text-text-secondary">
          Todavía no hay sesiones completadas con este ejercicio.
        </Text>
      )}

      {sessionGroups.map((g) => (
        <View
          key={g.sessionId}
          className="rounded-card border border-border-subtle bg-bg-surface p-4 mb-3"
        >
          <View className="flex-row items-center justify-between mb-2">
            <Text className="text-text-primary font-semibold">
              {formatSessionDate(g.dateIso)}
            </Text>
            <Text className="text-accent font-semibold">
              {formatWeight(g.maxWeightKg, weightUnit)} máx
            </Text>
          </View>
          {g.sets.map((s) => (
            <Text key={s.id} className="text-text-secondary">
              Set {s.setNumber}: {formatWeight(s.weightKg, weightUnit)} ×{" "}
              {s.reps} reps
            </Text>
          ))}
        </View>
      ))}
    </ScrollView>
  );
}
