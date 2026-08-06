import { useProfileStats } from "@/features/profile/useProfileStats";
import { useFeaturedRoutine } from "@/features/routines/useFeaturedRoutine";
import { useRoutines } from "@/features/routines/useRoutines";
import { useActiveSession } from "@/features/workout-session/useActiveSession";
import { RoutineCard } from "@/shared/components/RoutineCard";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback } from "react";
import { ActivityIndicator, Alert, ScrollView, Text, View } from "react-native";

export default function HomeScreen() {
  const router = useRouter();
  const { routines, loading, reload } = useRoutines();
  const { activeSession, discard, recheck } = useActiveSession();
  const { streakDays, reload: reloadStats } = useProfileStats();
  const featured = useFeaturedRoutine(routines);

  useFocusEffect(
    useCallback(() => {
      recheck();
      reload();
      reloadStats();
    }, [recheck, reload, reloadStats]),
  );

  function handleStartRoutine(routineId: string) {
    if (activeSession && activeSession.routineId !== routineId) {
      Alert.alert(
        "Tienes un entrenamiento sin terminar",
        `Termina o descarta "${activeSession.routineName}" antes de empezar otra rutina.`,
      );
      return;
    }
    router.push(`/execute/${routineId}`);
  }

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-bg-base">
        <ActivityIndicator color="#F5C518" />
      </View>
    );
  }

  const restRoutines = routines.filter((r) => r.id !== featured?.id);

  return (
    <ScrollView
      className="flex-1 bg-bg-base px-4 pt-16"
      contentContainerStyle={{ paddingBottom: 100 }}
    >
      <View className="flex-row items-center justify-between mb-1">
        <Text
          style={{
            color: "#FFFFFF",
            fontFamily: "Inter_700Bold",
            fontSize: 22,
          }}
        >
          Hola, Carlos
        </Text>
        {streakDays > 0 && (
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              paddingHorizontal: 10,
              paddingVertical: 4,
              borderRadius: 16,
              borderWidth: 1,
              borderColor: "#F5C518",
            }}
          >
            <Text
              style={{
                color: "#F5C518",
                fontFamily: "Inter_600SemiBold",
                fontSize: 13,
              }}
            >
              🔥 {streakDays}
            </Text>
          </View>
        )}
      </View>
      <Text className="text-text-secondary mb-6">Tus rutinas de la semana</Text>

      {activeSession && (
        <View className="rounded-card border border-accent bg-bg-surface-alt p-4 mb-6">
          <Text className="text-text-primary font-semibold">
            Entrenamiento sin terminar
          </Text>
          <Text className="text-text-secondary text-sm mt-1">
            {activeSession.routineName}
          </Text>
          <View className="flex-row gap-3 mt-3">
            <Text
              className="rounded-pill bg-accent text-text-on-accent font-semibold px-4 py-2"
              onPress={() => router.push(`/execute/${activeSession.routineId}`)}
            >
              Continuar
            </Text>
            <Text
              className="rounded-pill bg-bg-surface border border-border-subtle text-text-secondary font-semibold px-4 py-2"
              onPress={discard}
            >
              Descartar
            </Text>
          </View>
        </View>
      )}

      {routines.length === 0 && (
        <Text className="text-text-secondary">
          Todavía no tienes rutinas cargadas.
        </Text>
      )}

      {featured && (
        <View className="mb-6">
          <Text className="text-text-secondary text-sm mb-2">
            Rutina destacada
          </Text>
          <RoutineCard
            name={featured.name}
            meta={`${featured.dayLabel} · ${featured.exerciseCount} ejercicios`}
            onPress={() => handleStartRoutine(featured.id)}
            featured
          />
        </View>
      )}

      {restRoutines.length > 0 && (
        <Text className="text-text-secondary text-sm mb-2">Tus rutinas</Text>
      )}
      {restRoutines.map((r) => (
        <RoutineCard
          key={r.id}
          name={r.name}
          meta={`${r.dayLabel} · ${r.exerciseCount} ejercicios`}
          onPress={() => handleStartRoutine(r.id)}
        />
      ))}
    </ScrollView>
  );
}
