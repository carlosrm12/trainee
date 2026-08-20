import { useNutritionHistory } from "@/features/nutrition/useNutritionHistory";
import { StaggerItem } from "@/shared/components/StaggerItem";
import { getLocalDateString } from "@/shared/utils/getLocalDateString";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";

export default function NutritionHistoryScreen() {
  const router = useRouter();
  const { days, loading, reload } = useNutritionHistory();

  useFocusEffect(
    useCallback(() => {
      reload();
    }, [reload]),
  );

  const todayStr = getLocalDateString();
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = getLocalDateString(yesterday);

  function labelFor(date: string) {
    if (date === todayStr) return "Hoy";
    if (date === yesterdayStr) return "Ayer";
    return date;
  }

  return (
    <View className="flex-1 bg-bg-base px-4 pt-16">
      <View className="flex-row items-center justify-between mb-6">
        <Text className="text-text-primary text-2xl font-sans-bold">
          Historial nutricional
        </Text>
        <Pressable onPress={() => router.back()}>
          <Text className="text-accent font-sans-semibold">Cerrar</Text>
        </Pressable>
      </View>

      {loading && (
        <ActivityIndicator color="#F5C518" style={{ marginTop: 24 }} />
      )}

      {!loading && days.length === 0 && (
        <Text className="text-text-secondary font-sans">
          Todavía no hay días con comidas registradas.
        </Text>
      )}

      {!loading && days.length > 0 && (
        <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
          <View className="rounded-card border border-border-subtle bg-bg-surface overflow-hidden">
            {days.map((day, index) => (
              <StaggerItem key={day.date} index={index}>
                <View
                  className={index > 0 ? "border-t border-border-subtle" : ""}
                >
                  <Pressable
                    onPress={() => router.push(`/nutrition-day/${day.date}`)}
                    className="flex-row items-center py-3 px-4"
                  >
                    <View className="flex-1">
                      <Text className="text-text-primary font-sans-semibold">
                        {labelFor(day.date)}
                      </Text>
                      <Text className="text-text-secondary text-xs font-sans mt-0.5">
                        {day.mealCount}{" "}
                        {day.mealCount === 1 ? "comida" : "comidas"}
                      </Text>
                    </View>
                    <Text className="text-text-primary font-sans-semibold">
                      {Math.round(day.totals.calories)} kcal
                    </Text>
                  </Pressable>
                </View>
              </StaggerItem>
            ))}
          </View>
        </ScrollView>
      )}
    </View>
  );
}
