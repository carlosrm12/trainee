import type { MealType } from "@/domain/entities";
import { Pressable, Text, View } from "react-native";

const MEAL_TYPE_ICON: Record<MealType, string> = {
  breakfast: "🍳",
  lunch: "🍗",
  dinner: "🍽",
  snack: "🍎",
};

const MEAL_TYPE_LABEL: Record<MealType, string> = {
  breakfast: "Desayuno",
  lunch: "Almuerzo",
  dinner: "Cena",
  snack: "Snack",
};

type MealCardProps = {
  mealType: MealType;
  name: string;
  calories: number;
  onPress?: () => void;
};

// Mismo patrón flat que SessionListItem (§13 del doc de Fase 2).
export function MealCard({ mealType, name, calories, onPress }: MealCardProps) {
  return (
    <Pressable onPress={onPress} className="flex-row items-center py-3 px-4">
      <Text className="text-lg mr-3">{MEAL_TYPE_ICON[mealType]}</Text>
      <View className="flex-1">
        <Text className="text-text-primary font-sans-semibold">{name}</Text>
        <Text className="text-text-secondary text-xs font-sans mt-0.5">
          {MEAL_TYPE_LABEL[mealType]}
        </Text>
      </View>
      <Text className="text-text-primary font-sans-semibold">
        {calories} kcal
      </Text>
    </Pressable>
  );
}
