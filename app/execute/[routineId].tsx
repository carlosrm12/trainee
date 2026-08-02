import { useExecuteRoutine } from "@/features/workout-session/useExecuteRoutine";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ActivityIndicator, Pressable, Text, View } from "react-native";

export default function ExecuteRoutineScreen() {
  const { routineId } = useLocalSearchParams<{ routineId: string }>();
  const router = useRouter();
  const {
    loading,
    currentStep,
    currentIndex,
    totalSteps,
    isLastStep,
    goToNextExercise,
  } = useExecuteRoutine(routineId);

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-bg-base">
        <ActivityIndicator color="#F5C518" />
      </View>
    );
  }

  if (!currentStep) {
    return (
      <View className="flex-1 items-center justify-center bg-bg-base px-6">
        <Text className="text-text-primary text-lg text-center">
          Esta rutina no tiene ejercicios configurados.
        </Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-bg-base px-6 pt-16">
      <View className="flex-row items-center justify-between mb-8">
        <Pressable onPress={() => router.back()}>
          <Text className="text-text-secondary text-2xl">✕</Text>
        </Pressable>
        <Text className="text-text-secondary">
          Ejercicio {currentIndex + 1} de {totalSteps}
        </Text>
        <View style={{ width: 24 }} />
      </View>

      <Text className="text-text-primary text-3xl font-bold">
        {currentStep.exercise.name}
      </Text>
      <Text className="text-text-secondary mt-1">
        grupo: {currentStep.exercise.muscleGroup}
      </Text>

      <View className="mt-10 bg-bg-surface rounded-card p-6 border border-border-subtle">
        <Text className="text-text-secondary">Series objetivo</Text>
        <Text className="text-text-primary text-4xl font-bold mt-1">
          {currentStep.targetSets}
        </Text>
        <Text className="text-text-secondary mt-4">Rango de reps</Text>
        <Text className="text-text-primary text-2xl font-semibold mt-1">
          {currentStep.repMin}-{currentStep.repMax}
        </Text>
        <Text className="text-text-secondary mt-4">Descanso entre series</Text>
        <Text className="text-text-primary text-2xl font-semibold mt-1">
          {currentStep.restSeconds}s
        </Text>
      </View>

      {!isLastStep && (
        <Pressable
          onPress={goToNextExercise}
          className="mt-10 self-center rounded-pill bg-accent px-6 py-3"
        >
          <Text className="text-text-on-accent font-semibold">
            Siguiente ejercicio (temporal, 5b lo reemplaza) →
          </Text>
        </Pressable>
      )}
    </View>
  );
}
