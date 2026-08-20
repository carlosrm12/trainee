import { useNutritionDay } from "@/features/nutrition/useNutritionDay";
import { StatRow } from "@/shared/components/StatRow";
import { getLocalDateString } from "@/shared/utils/getLocalDateString";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { useCallback } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";

// Mismo componente para el tap de la notificación del briefing ("ayer") y
// para abrir cualquier día pasado a mano desde el historial nutricional —
// no existe una pantalla "Morning Briefing" separada (§9). La única
// diferencia de copy entre esos dos casos de entrada es si `date` coincide
// con la fecha de ayer o no, y eso se puede determinar solo a partir del
// propio parámetro, sin necesidad de una bandera "vine de la notificación".
export default function NutritionDayScreen() {
  const router = useRouter();
  const { date } = useLocalSearchParams<{ date: string }>();
  const { state, retryGenerate, reload, reloadProfile } = useNutritionDay(date);

  useFocusEffect(
    useCallback(() => {
      reload();
      reloadProfile();
      // Deliberado: no se pasa [reload, reloadProfile] como deps porque
      // ambos cambian de referencia en cada reload y crearían un loop —
      // correr una vez por foco de pantalla alcanza.
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [date]),
  );

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const isYesterday = date === getLocalDateString(yesterday);

  const emptyCopy = isYesterday
    ? "Todavía no registraste comidas ayer."
    : "Todavía no registraste comidas este día.";

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

      {state.status === "loading" && (
        <ActivityIndicator color="#F5C518" style={{ marginTop: 24 }} />
      )}

      {state.status === "empty" && (
        <Text className="text-text-secondary font-sans">{emptyCopy}</Text>
      )}

      {state.status === "no-profile" && (
        <View>
          <View className="rounded-card border border-border-subtle bg-bg-surface p-4 mb-4">
            <StatRow
              items={[
                { value: String(state.totals.calories), label: "kcal" },
                {
                  value: `${Math.round(state.totals.proteinG)}g`,
                  label: "Proteína",
                },
                {
                  value: `${Math.round(state.totals.carbsG)}g`,
                  label: "Carbos",
                },
                {
                  value: `${Math.round(state.totals.fatG)}g`,
                  label: "Grasas",
                },
              ]}
            />
          </View>
          <Text className="text-text-secondary font-sans mb-2">
            Configurá tus metas diarias para que el reporte compare estos
            números contra algo.
          </Text>
          <Pressable onPress={() => router.push("/nutrition-settings")}>
            <Text className="text-accent text-sm font-sans-semibold underline">
              Ir a Ajustes de Nutrición
            </Text>
          </Pressable>
        </View>
      )}

      {state.status === "generating" && (
        <View className="items-center mt-6">
          <ActivityIndicator color="#F5C518" />
          <Text className="text-text-secondary font-sans mt-2">
            Generando tu reporte...
          </Text>
        </View>
      )}

      {state.status === "ready" && (
        <View>
          <View className="rounded-card border border-border-subtle bg-bg-surface p-4 mb-4">
            <StatRow
              items={[
                { value: String(state.totals.calories), label: "kcal" },
                {
                  value: `${Math.round(state.totals.proteinG)}g`,
                  label: "Proteína",
                },
                {
                  value: `${Math.round(state.totals.carbsG)}g`,
                  label: "Carbos",
                },
                {
                  value: `${Math.round(state.totals.fatG)}g`,
                  label: "Grasas",
                },
              ]}
            />
          </View>
          <Text className="text-text-primary font-sans">
            {state.reportText}
          </Text>
        </View>
      )}

      {state.status === "error" && (
        <View>
          <View className="rounded-card border border-border-subtle bg-bg-surface p-4 mb-4">
            <StatRow
              items={[
                { value: String(state.totals.calories), label: "kcal" },
                {
                  value: `${Math.round(state.totals.proteinG)}g`,
                  label: "Proteína",
                },
                {
                  value: `${Math.round(state.totals.carbsG)}g`,
                  label: "Carbos",
                },
                {
                  value: `${Math.round(state.totals.fatG)}g`,
                  label: "Grasas",
                },
              ]}
            />
          </View>
          <Text className="text-text-secondary font-sans mb-3">
            No se pudo generar el reporte de texto, pero estos son tus números
            reales del día.
          </Text>
          <Pressable
            onPress={retryGenerate}
            className="self-start rounded-pill bg-bg-surface-alt border border-border-subtle px-4 py-2"
          >
            <Text className="text-text-primary text-sm font-sans-semibold">
              Generar reporte
            </Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}
