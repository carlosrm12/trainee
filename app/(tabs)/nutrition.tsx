import { AppHeader } from "@/shared/components/AppHeader";
import { useAppHeaderState } from "@/shared/hooks/useAppHeaderState";
import { useRouter } from "expo-router";
import { ScrollView, Text, View } from "react-native";

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
        <Text className="text-text-secondary font-sans text-center">
          El dashboard de comidas y macros se arma en el paso 6 de la Fase 2.
        </Text>
      </View>
    </ScrollView>
  );
}
