import { SQLiteMealLogRepository } from "@/data/repositories/SQLiteMealLogRepository";
import type { MealLog, MealType } from "@/domain/entities";
import { useNutritionProfile } from "@/features/nutrition/useNutritionProfile";
import { useTodayMealLogs } from "@/features/nutrition/useTodayMealLogs";
import { AppHeader } from "@/shared/components/AppHeader";
import { BrutalistButton } from "@/shared/components/BrutalistButton";
import { MacroRing } from "@/shared/components/MacroRing";
import { MealCard } from "@/shared/components/MealCard";
import { StaggerItem } from "@/shared/components/StaggerItem";
import { StatRow } from "@/shared/components/StatRow";
import { SwipeableRow } from "@/shared/components/SwipeableRow";
import { useAppHeaderState } from "@/shared/hooks/useAppHeaderState";
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

const mealLogRepo = new SQLiteMealLogRepository();

const MEAL_TYPE_LABEL: Record<MealType, string> = {
  breakfast: "Desayuno",
  lunch: "Almuerzo",
  dinner: "Cena",
  snack: "Snack",
};

export default function NutritionScreen() {
  const router = useRouter();
  const { avatarUri, hasReminderPending } = useAppHeaderState();
  const {
    profile,
    loading: profileLoading,
    reload: reloadProfile,
  } = useNutritionProfile();
  const {
    meals,
    pendingMeals,
    totals,
    loading: mealsLoading,
    reload: reloadMeals,
  } = useTodayMealLogs();

  useFocusEffect(
    useCallback(() => {
      reloadProfile();
      reloadMeals();
    }, [reloadProfile, reloadMeals]),
  );

  async function handleDeleteMeal(id: string) {
    await mealLogRepo.delete(id);
    reloadMeals();
  }

  async function handleRetryPending(meal: MealLog) {
    if (!meal.photoUri) {
      // Ver log de decisiones del paso 6: una pending de más de 14 días ya
      // perdió su foto por la retención del paso 5d — no hay con qué
      // reintentar el análisis.
      Alert.alert(
        "Foto no disponible",
        "La foto de este registro ya no está disponible. Podés eliminar el registro pendiente.",
        [
          { text: "Cancelar", style: "cancel" },
          {
            text: "Eliminar",
            style: "destructive",
            onPress: () => handleDeleteMeal(meal.id),
          },
        ],
      );
      return;
    }
    router.push({
      pathname: "/meal-capture",
      params: {
        mealLogId: meal.id,
        photoUri: meal.photoUri,
        mealType: meal.mealType,
      },
    });
  }

  if (profileLoading || mealsLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-bg-base">
        <ActivityIndicator color="#F5C518" />
      </View>
    );
  }

  const hasTarget = !!profile?.dailyCalorieTarget;

  return (
    <View className="flex-1 bg-bg-base">
      <ScrollView
        className="flex-1 px-4 pt-16"
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        <AppHeader
          title="Nutrición"
          avatarUri={avatarUri}
          hasReminderPending={hasReminderPending}
          onSettingsPress={() => router.push("/nutrition-settings")}
        />

        <Text className="text-text-secondary text-sm font-sans mb-2">Hoy</Text>
        <View className="rounded-card border border-border-subtle bg-bg-surface p-4 mb-6 items-center">
          {hasTarget ? (
            <>
              <MacroRing
                consumedCalories={totals.calories}
                targetCalories={profile!.dailyCalorieTarget!}
              />
              <View className="w-full mt-4">
                <StatRow
                  items={[
                    {
                      value: `${Math.round(totals.proteinG)}g`,
                      label: "Proteína",
                    },
                    { value: `${Math.round(totals.carbsG)}g`, label: "Carbos" },
                    { value: `${Math.round(totals.fatG)}g`, label: "Grasas" },
                  ]}
                />
              </View>
            </>
          ) : (
            <>
              <StatRow
                items={[
                  { value: `${Math.round(totals.calories)}`, label: "kcal" },
                  {
                    value: `${Math.round(totals.proteinG)}g`,
                    label: "Proteína",
                  },
                  { value: `${Math.round(totals.carbsG)}g`, label: "Carbos" },
                  { value: `${Math.round(totals.fatG)}g`, label: "Grasas" },
                ]}
              />
              <Pressable
                onPress={() => router.push("/nutrition-settings")}
                className="mt-3"
              >
                <Text className="text-accent text-xs font-sans-semibold underline">
                  Configurar tus metas diarias
                </Text>
              </Pressable>
            </>
          )}
        </View>

        {pendingMeals.length > 0 && (
          <>
            <Text className="text-text-secondary text-sm font-sans mb-2">
              Pendientes de analizar
            </Text>
            <View className="rounded-card border border-border-subtle bg-bg-surface overflow-hidden mb-6">
              {pendingMeals.map((meal, index) => (
                <View
                  key={meal.id}
                  className={index > 0 ? "border-t border-border-subtle" : ""}
                >
                  <SwipeableRow onDelete={() => handleDeleteMeal(meal.id)}>
                    <View className="flex-row items-center py-3 px-4">
                      <Text className="text-lg mr-3">📷</Text>
                      <View className="flex-1">
                        <Text className="text-text-primary font-sans-semibold">
                          {MEAL_TYPE_LABEL[meal.mealType]}
                        </Text>
                        <Text className="text-text-secondary text-xs font-sans mt-0.5">
                          Pendiente de analizar
                        </Text>
                      </View>
                      <Pressable
                        onPress={() => handleRetryPending(meal)}
                        className="rounded-pill bg-bg-surface-alt border border-border-subtle px-3 py-1.5"
                      >
                        <Text className="text-text-primary text-xs font-sans-semibold">
                          Reintentar
                        </Text>
                      </Pressable>
                    </View>
                  </SwipeableRow>
                </View>
              ))}
            </View>
          </>
        )}

        <Text className="text-text-secondary text-sm font-sans mb-2">
          Comidas de hoy
        </Text>
        {meals.length === 0 ? (
          <Text className="text-text-secondary font-sans">
            Todavía no registraste comidas hoy.
          </Text>
        ) : (
          <View className="rounded-card border border-border-subtle bg-bg-surface overflow-hidden">
            {meals.map((meal, index) => (
              <StaggerItem key={meal.id} index={index}>
                <View
                  className={index > 0 ? "border-t border-border-subtle" : ""}
                >
                  <SwipeableRow onDelete={() => handleDeleteMeal(meal.id)}>
                    <MealCard
                      mealType={meal.mealType}
                      name={meal.name}
                      calories={meal.calories}
                    />
                  </SwipeableRow>
                </View>
              </StaggerItem>
            ))}
          </View>
        )}
      </ScrollView>

      <View className="absolute bottom-6 right-6">
        <BrutalistButton
          variant="fab"
          label="Nueva comida"
          onPress={() => router.push("/meal-capture")}
        />
      </View>
    </View>
  );
}
