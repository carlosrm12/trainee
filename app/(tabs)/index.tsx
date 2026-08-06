import { useProfileStats } from "@/features/profile/useProfileStats";
import { useFeaturedRoutine } from "@/features/routines/useFeaturedRoutine";
import { useRoutines } from "@/features/routines/useRoutines";
import { useActiveSession } from "@/features/workout-session/useActiveSession";
import { BrutalistButton } from "@/shared/components/BrutalistButton";
import { FilterChipOutline } from "@/shared/components/FilterChipOutline";
import { RoutineCard } from "@/shared/components/RoutineCard";
import { StatRow } from "@/shared/components/StatRow";
import { StreakBadge } from "@/shared/components/StreakBadge";
import { MUSCLE_CATEGORY_LABEL } from "@/shared/constants/muscleCategories";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { ActivityIndicator, Alert, ScrollView, Text, View } from "react-native";

const FILTER_OPTIONS = ["Todas", "Empuje", "Tirón", "Pierna"];

export default function HomeScreen() {
  const router = useRouter();
  const { routines, loading, reload } = useRoutines();
  const { activeSession, discard, recheck } = useActiveSession();
  const { streakDays, reload: reloadStats } = useProfileStats();
  const featured = useFeaturedRoutine(routines);
  const [selectedFilter, setSelectedFilter] = useState("Todas");

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

  const restRoutines = routines
    .filter((r) => r.id !== featured?.id)
    .filter(
      (r) =>
        selectedFilter === "Todas" ||
        (r.category ? MUSCLE_CATEGORY_LABEL[r.category] : null) ===
          selectedFilter,
    );

  return (
    <ScrollView
      className="flex-1 bg-bg-base px-4 pt-16"
      contentContainerStyle={{ paddingBottom: 100 }}
    >
      <View className="flex-row items-center justify-between mb-1">
        <Text className="text-text-primary text-2xl font-bold">
          Hola, Carlos
        </Text>
        <StreakBadge days={streakDays} />
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
          <View className="rounded-card border border-border-subtle bg-bg-surface p-4">
            <Text className="text-text-primary text-base font-semibold">
              {featured.name}
            </Text>
            <Text className="text-text-secondary text-sm mt-1 mb-3">
              {featured.dayLabel}
            </Text>
            <StatRow
              items={[
                { value: String(featured.exerciseCount), label: "ejercicios" },
                { value: String(featured.totalSets), label: "sets" },
              ]}
            />
            <View className="mt-4">
              <BrutalistButton
                label="Empezar rutina"
                onPress={() => handleStartRoutine(featured.id)}
              />
            </View>
          </View>
        </View>
      )}

      <View className="flex-row items-center justify-between mb-3">
        <Text className="text-text-secondary text-sm">Tus rutinas</Text>
        <Text
          className="text-accent text-sm font-semibold"
          onPress={() => router.push("/routines")}
        >
          Ver todas
        </Text>
      </View>

      <View className="mb-4">
        <FilterChipOutline
          options={FILTER_OPTIONS}
          selected={selectedFilter}
          onSelect={setSelectedFilter}
        />
      </View>

      {restRoutines.length === 0 && (
        <Text className="text-text-secondary">
          No hay rutinas para este filtro.
        </Text>
      )}

      <View className="flex-row flex-wrap justify-between">
        {restRoutines.map((r) => (
          <RoutineCard
            key={r.id}
            variant="grid"
            name={r.name}
            meta={`${r.dayLabel} · ${r.exerciseCount} ejercicios`}
            onPress={() => handleStartRoutine(r.id)}
          />
        ))}
      </View>
    </ScrollView>
  );
}
