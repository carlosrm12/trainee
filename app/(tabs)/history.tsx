import { useSessionHistory } from "@/features/history/useSessionHistory";
import { FilterChipOutline } from "@/shared/components/FilterChipOutline";
import { SessionListItem } from "@/shared/components/SessionListItem";
import { StatRow } from "@/shared/components/StatRow";
import { formatSessionDate } from "@/shared/utils/formatDate";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";

const FILTER_OPTIONS = ["Todas", "Semana", "Mes", "Año"];
const RANGE_DAYS: Record<string, number | null> = {
  Todas: null,
  Semana: 7,
  Mes: 30,
  Año: 365,
};

function isToday(iso: string): boolean {
  const d = new Date(iso);
  const now = new Date();
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
}

export default function HistoryScreen() {
  const router = useRouter();
  const { sessions, loading, reload } = useSessionHistory();
  const [selectedFilter, setSelectedFilter] = useState("Todas");

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

  const rangeDays = RANGE_DAYS[selectedFilter];
  const filteredSessions =
    rangeDays === null
      ? sessions
      : sessions.filter((s) => {
          const ageMs = Date.now() - new Date(s.date).getTime();
          return ageMs <= rangeDays * 24 * 60 * 60 * 1000;
        });

  const [mostRecent, ...olderSessions] = filteredSessions;

  return (
    <ScrollView
      className="flex-1 bg-bg-base px-4 pt-16"
      contentContainerStyle={{ paddingBottom: 60 }}
    >
      <Text className="text-text-primary text-2xl font-sans-bold mb-4">
        Historial
      </Text>

      <View className="mb-6">
        <FilterChipOutline
          options={FILTER_OPTIONS}
          selected={selectedFilter}
          onSelect={setSelectedFilter}
        />
      </View>

      {filteredSessions.length === 0 && (
        <Text className="text-text-secondary font-sans">
          {sessions.length === 0
            ? "Todavía no registraste ninguna sesión."
            : "No hay sesiones en este rango."}
        </Text>
      )}

      {mostRecent && (
        <View className="mb-6">
          <Text className="text-text-secondary text-sm font-sans mb-2">
            Sesión más reciente
          </Text>
          <Pressable
            onPress={() => router.push(`/history/${mostRecent.id}`)}
            className="rounded-card border border-border-subtle bg-bg-surface p-4"
          >
            <View className="flex-row items-center justify-between mb-3">
              <Text className="text-text-primary text-base font-sans-semibold">
                {mostRecent.routineName}
              </Text>
              {isToday(mostRecent.date) && (
                <View className="rounded-pill bg-accent px-3 py-1">
                  <Text className="text-text-on-accent text-[10px] font-sans-semibold uppercase">
                    Hoy
                  </Text>
                </View>
              )}
            </View>
            <StatRow
              items={[
                ...(mostRecent.durationMinutes !== null
                  ? [{ value: `${mostRecent.durationMinutes}`, label: "min" }]
                  : []),
                { value: String(mostRecent.totalSets), label: "sets" },
                {
                  value: `${Math.round(mostRecent.totalVolumeKg)}`,
                  label: "kg totales",
                },
              ]}
            />
          </Pressable>
        </View>
      )}

      {olderSessions.length > 0 && (
        <>
          <Text className="text-text-secondary text-sm font-sans mb-2">
            Sesiones anteriores
          </Text>
          <View className="rounded-card border border-border-subtle bg-bg-surface px-4">
            {olderSessions.map((s, index) => (
              <View
                key={s.id}
                className={index > 0 ? "border-t border-border-subtle" : ""}
              >
                <SessionListItem
                  routineName={s.routineName}
                  dateLabel={formatSessionDate(s.date)}
                  durationMinutes={s.durationMinutes}
                  totalSets={s.totalSets}
                  onPress={() => router.push(`/history/${s.id}`)}
                />
              </View>
            ))}
          </View>
        </>
      )}
    </ScrollView>
  );
}
