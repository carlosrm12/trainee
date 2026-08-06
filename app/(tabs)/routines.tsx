import { useRoutines } from "@/features/routines/useRoutines";
import { BrutalistButton } from "@/shared/components/BrutalistButton";
import { colors, radius } from "@/shared/theme/tokens";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";

export default function RoutinesScreen() {
  const router = useRouter();
  const { routines, loading, reload } = useRoutines();

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

  return (
    <ScrollView
      className="flex-1 bg-bg-base px-4 pt-16"
      contentContainerStyle={{ paddingBottom: 100 }}
    >
      <View className="flex-row items-center justify-between mb-6">
        <Text
          style={{
            color: colors.textPrimary,
            fontFamily: "Inter_700Bold",
            fontSize: 22,
          }}
        >
          Rutinas
        </Text>
        <Pressable onPress={() => router.push("/routines/new")}>
          <Text
            style={{ color: colors.accent, fontFamily: "Inter_600SemiBold" }}
          >
            + Nueva
          </Text>
        </Pressable>
      </View>

      {routines.length === 0 && (
        <Text className="text-text-secondary">
          Todavía no tienes rutinas. Crea la primera.
        </Text>
      )}

      {routines.map((r) => (
        <View
          key={r.id}
          style={{
            borderRadius: radius.card,
            borderWidth: 1,
            borderColor: colors.borderSubtle,
            backgroundColor: colors.bgSurface,
            padding: 16,
            marginBottom: 12,
          }}
        >
          <Text
            style={{
              color: colors.textPrimary,
              fontFamily: "Inter_600SemiBold",
              fontSize: 16,
            }}
          >
            {r.name}
          </Text>
          <Text
            style={{ color: colors.textSecondary, fontSize: 13, marginTop: 4 }}
          >
            {r.dayLabel} · {r.exerciseCount} ejercicios
          </Text>
          <View
            style={{
              flexDirection: "row",
              gap: 12,
              marginTop: 12,
              alignItems: "center",
            }}
          >
            <Pressable
              onPress={() => router.push(`/routines/${r.id}/edit`)}
              style={{
                height: 40,
                justifyContent: "center",
                paddingHorizontal: 16,
                borderRadius: radius.pill,
                borderWidth: 1,
                borderColor: colors.borderSubtle,
              }}
            >
              <Text
                style={{
                  color: colors.textPrimary,
                  fontFamily: "Inter_600SemiBold",
                  fontSize: 13,
                }}
              >
                Editar
              </Text>
            </Pressable>
            <BrutalistButton
              label="Empezar"
              onPress={() => router.push(`/execute/${r.id}`)}
              fullWidth={false}
            />
          </View>
        </View>
      ))}
    </ScrollView>
  );
}
