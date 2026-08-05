import { useSessionDetail } from "@/features/history/useSessionDetail";
import { useSettings } from "@/features/profile/useSettings";
import { formatSessionDate } from "@/shared/utils/formatDate";
import { formatWeight } from "@/shared/utils/weightUnit";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";

export default function SessionDetailScreen() {
  const { sessionId } = useLocalSearchParams<{ sessionId: string }>();
  const router = useRouter();
  const {
    loading,
    routineName,
    dateIso,
    groups,
    totalVolumeKg,
    totalSets,
    deleteSession,
  } = useSessionDetail(sessionId);
  const { weightUnit } = useSettings();
  const [deleting, setDeleting] = useState(false);

  function confirmDelete() {
    Alert.alert(
      "Borrar sesión",
      "Esto elimina permanentemente esta sesión y todas sus series registradas. ¿Continuar?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Borrar",
          style: "destructive",
          onPress: async () => {
            setDeleting(true);
            await deleteSession();
            router.back();
          },
        },
      ],
    );
  }

  if (loading || deleting) {
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
      <View className="flex-row items-center justify-between mb-6">
        <Pressable onPress={() => router.back()}>
          <Text className="text-text-secondary text-2xl">‹</Text>
        </Pressable>
        <Pressable onPress={confirmDelete}>
          <Text className="text-danger">Borrar</Text>
        </Pressable>
      </View>

      <Text className="text-text-primary text-2xl font-bold">
        {routineName}
      </Text>
      <Text className="text-text-secondary mt-1">
        {formatSessionDate(dateIso)}
      </Text>

      <View className="flex-row gap-8 mt-6 mb-8">
        <View>
          <Text className="text-text-secondary text-sm">Sets totales</Text>
          <Text className="text-text-primary text-xl font-bold">
            {totalSets}
          </Text>
        </View>
        <View>
          <Text className="text-text-secondary text-sm">Volumen total</Text>
          <Text className="text-text-primary text-xl font-bold">
            {formatWeight(totalVolumeKg, weightUnit)}
          </Text>
        </View>
      </View>

      {groups.map((g) => (
        <View key={g.routineExerciseId} className="mb-5">
          <Pressable
            onPress={() => router.push(`/history/exercise/${g.exerciseId}`)}
          >
            <Text className="text-accent font-semibold mb-2">
              {g.exerciseName} →
            </Text>
          </Pressable>
          {g.sets.map((s) => (
            <Text key={s.id} className="text-text-secondary">
              {s.isWarmup ? "Calentamiento" : `Set ${s.setNumber}`}:{" "}
              {formatWeight(s.weightKg, weightUnit)} × {s.reps} reps
            </Text>
          ))}
        </View>
      ))}
    </ScrollView>
  );
}
