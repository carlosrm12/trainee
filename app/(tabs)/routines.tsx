import { useRoutines } from "@/features/routines/useRoutines";
import { BrutalistButton } from "@/shared/components/BrutalistButton";
import { FilterChipOutline } from "@/shared/components/FilterChipOutline";
import { RoutineCard } from "@/shared/components/RoutineCard";
import { StaggerItem } from "@/shared/components/StaggerItem";
import { MUSCLE_CATEGORY_LABEL } from "@/shared/constants/muscleCategories";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { ActivityIndicator, ScrollView, Text, View } from "react-native";

const FILTER_OPTIONS = ["Todas", "Empuje", "Tirón", "Pierna"];

export default function RoutinesScreen() {
  const router = useRouter();
  const { routines, loading, reload } = useRoutines();
  const [selectedFilter, setSelectedFilter] = useState("Todas");

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

  const todayDow = new Date().getDay();
  const filteredRoutines = routines.filter(
    (r) =>
      selectedFilter === "Todas" ||
      (r.category ? MUSCLE_CATEGORY_LABEL[r.category] : null) ===
        selectedFilter,
  );

  return (
    <View className="flex-1 bg-bg-base">
      <ScrollView
        className="flex-1 px-4 pt-16"
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        <Text className="text-text-primary text-2xl font-sans-bold mb-4">
          Rutinas
        </Text>

        <View className="mb-6">
          <FilterChipOutline
            options={FILTER_OPTIONS}
            selected={selectedFilter}
            onSelect={setSelectedFilter}
          />
        </View>

        {filteredRoutines.length === 0 && (
          <Text className="text-text-secondary font-sans">
            {routines.length === 0
              ? "Todavía no tienes rutinas. Crea la primera."
              : "No hay rutinas para este filtro."}
          </Text>
        )}

        {filteredRoutines.map((r, index) => (
          <StaggerItem key={r.id} index={index}>
            <RoutineCard
              name={r.name}
              meta={`${r.dayLabel} · ${r.exerciseCount} ejercicios`}
              isToday={r.dayOfWeek === todayDow}
              onPress={() => router.push(`/routines/${r.id}/edit`)}
              onStart={() => router.push(`/execute/${r.id}`)}
            />
          </StaggerItem>
        ))}
      </ScrollView>

      <View className="absolute bottom-6 right-6">
        <BrutalistButton
          variant="fab"
          label="Nueva rutina"
          onPress={() => router.push("/routines/new")}
        />
      </View>
    </View>
  );
}
