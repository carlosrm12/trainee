import { AppHeader } from "@/shared/components/AppHeader";
import { BrutalistButton } from "@/shared/components/BrutalistButton";
import { useAppHeaderState } from "@/shared/hooks/useAppHeaderState";
import { useRouter } from "expo-router";
import { Pressable, ScrollView, Text, View } from "react-native";

export default function NutritionScreen() {
  const router = useRouter();
  const { avatarUri, hasReminderPending } = useAppHeaderState();

  return (
    <ScrollView
      className="flex-1 bg-bg-base px-4 pt-16"
      contentContainerStyle={{ paddingBottom: 100 }}
    >
      <AppHeader
        title="Nutrición"
        avatarUri={avatarUri}
        hasReminderPending={hasReminderPending}
        onSettingsPress={() => router.push("/nutrition-settings")}
      />

      <View className="items-center justify-center mt-20 px-6">
        <Text className="text-4xl mb-3">🥗</Text>
        <Text className="text-text-primary font-sans-semibold text-center mb-1">
          Nutrición llega pronto
        </Text>
        <Text className="text-text-secondary font-sans text-center mb-6">
          El dashboard de comidas y macros se arma en el paso 6 de la Fase 2.
        </Text>
        {/* Entrada temporal para poder probar la captura (paso 5c) antes de
            que exista el dashboard real — el FAB definitivo del paso 6
            apunta a la misma ruta, esto no se descarta, solo se reubica. */}
        <Pressable onPress={() => router.push("/meal-capture")}>
          <BrutalistButton
            label="Probar registrar una comida"
            onPress={() => router.push("/meal-capture")}
          />
        </Pressable>
      </View>
    </ScrollView>
  );
}
