import { useCallback, useEffect, useState } from "react";
import { SQLiteWorkoutSessionRepository } from "../../data/repositories/SQLiteWorkoutSessionRepository";

const sessionRepo = new SQLiteWorkoutSessionRepository();

function toDateOnly(iso: string): string {
  return iso.slice(0, 10); // YYYY-MM-DD
}

export function useProfileStats() {
  const [loading, setLoading] = useState(true);
  const [totalSessions, setTotalSessions] = useState(0);
  const [streakDays, setStreakDays] = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    const sessions = await sessionRepo.getHistory(1000);
    setTotalSessions(sessions.length);

    const uniqueDays = Array.from(
      new Set(sessions.map((s) => toDateOnly(s.date))),
    )
      .sort()
      .reverse();

    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const todayStr = toDateOnly(today.toISOString());
    const yesterdayStr = toDateOnly(yesterday.toISOString());

    let streak = 0;
    // La racha sigue "viva" si entrenaste hoy o ayer (no se rompe hasta que
    // pase un día entero sin entrenar).
    if (
      uniqueDays.length > 0 &&
      (uniqueDays[0] === todayStr || uniqueDays[0] === yesterdayStr)
    ) {
      const cursor = new Date(uniqueDays[0]);
      for (const day of uniqueDays) {
        const cursorStr = toDateOnly(cursor.toISOString());
        if (day === cursorStr) {
          streak++;
          cursor.setDate(cursor.getDate() - 1);
        } else {
          break;
        }
      }
    }

    setStreakDays(streak);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { loading, totalSessions, streakDays, reload: load };
}
