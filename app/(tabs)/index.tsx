import { useRoutines } from "@/features/routines/useRoutines";
import { useActiveSession } from "@/features/workout-session/useActiveSession";
import { RoutineCard } from "@/shared/components/RoutineCard";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";

export default function HomeScreen() {
  const router = useRouter();
  const { routines, loading, reload } = useRoutines();
  const { activeSession, discard, recheck } = useActiveSession();

  useFocusEffect(
    useCallback(() => {
      recheck();
      reload();
    }, [recheck, reload]),
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

  return (
    <ScrollView
      className="flex-1 bg-bg-base px-4 pt-16"
      contentContainerStyle={{ paddingBottom: 60 }}
    >
      <View className="flex-row items-center justify-between mb-1">
        <Text className="text-text-primary text-2xl font-bold">
          Hola, Carlos
        </Text>
        <View className="flex-row gap-4">
          <Text
            className="text-accent"
            onPress={() => router.push("/routines")}
          >
            Rutinas
          </Text>
          <Text
            className="text-accent"
            onPress={() => router.push("/exercises")}
          >
            Ejercicios
          </Text>
          <Text className="text-accent" onPress={() => router.push("/history")}>
            Historial →
          </Text>
        </View>
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
            <Pressable
              onPress={() => router.push(`/execute/${activeSession.routineId}`)}
              className="rounded-pill bg-accent px-4 py-2"
            >
              <Text className="text-text-on-accent font-semibold">
                Continuar
              </Text>
            </Pressable>
            <Pressable
              onPress={discard}
              className="rounded-pill bg-bg-surface border border-border-subtle px-4 py-2"
            >
              <Text className="text-text-secondary font-semibold">
                Descartar
              </Text>
            </Pressable>
          </View>
        </View>
      )}

      {routines.length === 0 && (
        <Text className="text-text-secondary">
          Todavía no tienes rutinas cargadas.
        </Text>
      )}

      {routines.map((r) => (
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
