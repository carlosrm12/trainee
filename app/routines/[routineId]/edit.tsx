import { useLocalSearchParams, useRouter } from "expo-router";
import { Pressable, Text, View } from "react-native";

export default function EditRoutineScreen() {
  const { routineId } = useLocalSearchParams<{ routineId: string }>();
  const router = useRouter();

  return (
    <View className="flex-1 bg-bg-base px-6 pt-16">
      <Pressable onPress={() => router.back()} className="mb-6">
        <Text className="text-text-secondary text-2xl">‹</Text>
      </Pressable>
      <Text className="text-text-primary text-lg text-center">
        Agregar/editar ejercicios de esta rutina — lo construimos en el 7b.
      </Text>
      <Text className="text-text-secondary text-sm mt-2 text-center">
        {routineId}
      </Text>
    </View>
  );
}
