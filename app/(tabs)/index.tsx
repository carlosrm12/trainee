import { useRoutines } from "@/features/routines/useRoutines";
import { RoutineCard } from "@/shared/components/RoutineCard";
import { ActivityIndicator, ScrollView, Text, View } from "react-native";

export default function HomeScreen() {
  const { routines, loading } = useRoutines();

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
      <Text className="text-text-primary text-2xl font-bold mb-1">
        Hola, Carlos
      </Text>
      <Text className="text-text-secondary mb-6">Tus rutinas de la semana</Text>

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
          onPress={() => {
            // El Paso 5 conecta esto a la pantalla de ejecución con timer
            console.log("Empezar rutina:", r.id);
          }}
        />
      ))}
    </ScrollView>
  );
}
