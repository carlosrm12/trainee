import { useMemo } from "react";
import type { RoutineWithMeta } from "../routines/useRoutines";

export interface Reminder {
  id: string;
  icon: string;
  title: string;
  subtitle: string;
}

interface UseRemindersParams {
  routines: RoutineWithMeta[];
  streakDays: number;
  trainedToday: boolean;
}

// Recordatorios "sin estado": no se guardan en DB ni se marcan como leídos,
// se recalculan cada vez a partir de datos que ya existen (racha, rutinas).
// Alcance a propósito acotado — nada de tabla de notificaciones todavía.
export function useReminders({
  routines,
  streakDays,
  trainedToday,
}: UseRemindersParams): Reminder[] {
  return useMemo(() => {
    if (trainedToday) return [];

    const reminders: Reminder[] = [];
    const todayDow = new Date().getDay();
    const todaysRoutine = routines.find((r) => r.dayOfWeek === todayDow);

    if (todaysRoutine) {
      reminders.push({
        id: "todays-routine",
        icon: "📋",
        title: "Tienes pendiente tu rutina de hoy",
        subtitle: todaysRoutine.name,
      });
    }

    if (streakDays > 0) {
      reminders.push({
        id: "streak-risk",
        icon: "🔥",
        title: `Tu racha de ${streakDays} ${
          streakDays === 1 ? "día" : "días"
        } está en riesgo`,
        subtitle: "Entrena hoy para mantenerla.",
      });
    }

    return reminders;
  }, [routines, streakDays, trainedToday]);
}
