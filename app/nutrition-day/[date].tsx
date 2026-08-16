import { useLocalSearchParams, useRouter } from "expo-router";
import { Pressable, Text, View } from "react-native";

export default function NutritionDayScreen() {
  const router = useRouter();
  const { date } = useLocalSearchParams<{ date: string }>();

  return (
    <View className="flex-1 bg-bg-base px-4 pt-16">
      <View className="flex-row items-center justify-between mb-6">
        <Text className="text-text-primary text-2xl font-sans-bold">
          {date}
        </Text>
        <Pressable onPress={() => router.back()}>
          <Text className="text-accent font-sans-semibold">Cerrar</Text>
        </Pressable>
      </View>
      <Text className="text-text-secondary font-sans">
        Detalle de comidas del día y morning briefing — se arma en el paso 7 de
        la Fase 2.
      </Text>
    </View>
  );
}
