import { useReminders } from "@/features/notifications/useReminders";
import { useProfileStats } from "@/features/profile/useProfileStats";
import { useSettings } from "@/features/profile/useSettings";
import { useRoutines } from "@/features/routines/useRoutines";
import { useFocusEffect } from "expo-router";
import { useCallback } from "react";

// Nota: hace su propio fetch de routines/stats, independiente del que ya
// hace cada pantalla para su propio contenido. Es una duplicación de query
// menor (SQLite local, un solo usuario) a cambio de que AppHeader sea
// autocontenido en cualquier pantalla — no estaba en el .md, se anota en
// PROGRESS.md como decisión de implementación.
export function useAppHeaderState() {
  const { routines, reload: reloadRoutines } = useRoutines();
  const { streakDays, trainedToday, reload: reloadStats } = useProfileStats();
  const { avatarUri } = useSettings();
  const reminders = useReminders({ routines, streakDays, trainedToday });

  useFocusEffect(
    useCallback(() => {
      reloadRoutines();
      reloadStats();
    }, [reloadRoutines, reloadStats]),
  );

  return {
    avatarUri,
    hasReminderPending: reminders.length > 0,
  };
}
