import Constants, { ExecutionEnvironment } from "expo-constants";
import type * as NotificationsType from "expo-notifications";
import { useCallback } from "react";
import { Platform } from "react-native";

const CHANNEL_ID = "morning-briefing";
// Identifier fijo en vez de guardar el id que devuelve
// scheduleNotificationAsync — así se puede cancelar/reprogramar sin tener
// que persistir nada aparte (ver §8 del doc de Fase 2: cancelar-y-
// reprogramar, mismo patrón que useRestTimer.ts pero con trigger DAILY).
const NOTIFICATION_ID = "morning-briefing-daily";

// Mismo problema y misma solución que useRestTimer.ts: Expo Go (SDK 53+)
// bloquea expo-notifications en Android apenas se importa de forma
// estática — nada de import estático acá, todo perezoso vía import()
// dinámico y solo fuera de Expo Go. Dentro de Expo Go, schedule()/cancel()
// no hacen nada (no hay forma de probar un trigger DAILY sin una build
// standalone — confirmado con el crash de cámara del paso 6, ver
// docs/PROGRESS.md).
const isExpoGo =
  Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

let notificationsModulePromise: Promise<typeof NotificationsType> | null = null;

function getNotifications(): Promise<typeof NotificationsType> | null {
  if (isExpoGo) return null;
  if (!notificationsModulePromise) {
    notificationsModulePromise = import("expo-notifications").then((mod) => {
      mod.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowBanner: true,
          shouldShowList: true,
          shouldPlaySound: true,
          shouldSetBadge: false,
        }),
      });
      return mod;
    });
  }
  return notificationsModulePromise;
}

async function ensureNotificationSetup(
  Notifications: typeof NotificationsType,
) {
  const current = await Notifications.getPermissionsAsync();
  if (current.status !== "granted") {
    await Notifications.requestPermissionsAsync();
  }
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
      name: "Reporte matutino de nutrición",
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }
}

export function useMorningBriefingNotification() {
  // Cancela lo que hubiera programado y reprograma con la hora/minuto
  // nuevos — el sistema operativo repite el trigger DAILY solo, no hace
  // falta reprogramar cada noche (§8).
  const schedule = useCallback(async (hour: number, minute: number) => {
    const Notifications = await getNotifications();
    if (!Notifications) return; // Expo Go: no-op, no hay como probarlo acá

    await ensureNotificationSetup(Notifications);
    await Notifications.cancelScheduledNotificationAsync(NOTIFICATION_ID).catch(
      () => {
        // no había nada programado todavía, está bien
      },
    );
    await Notifications.scheduleNotificationAsync({
      identifier: NOTIFICATION_ID,
      content: {
        title: "Tu reporte de ayer está listo 🥗",
        body: "Mirá cómo te fue con tus macros.",
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour,
        minute,
        channelId: CHANNEL_ID,
      },
    });
  }, []);

  const cancel = useCallback(async () => {
    const Notifications = await getNotifications();
    if (!Notifications) return;
    await Notifications.cancelScheduledNotificationAsync(NOTIFICATION_ID).catch(
      () => {},
    );
  }, []);

  return { schedule, cancel };
}

// A diferencia de programar/cancelar, capturar el TAP de la notificación
// normalmente se hace con el hook Notifications.useLastNotificationResponse()
// (así lo plantea §9 del doc) — pero acá no podemos usarlo: es un hook de
// React, y solo tenemos el módulo disponible después de un import()
// dinámico (nunca estático, por Expo Go). Un hook no se puede llamar
// condicionalmente ni desde un módulo resuelto async sin romper las reglas
// de hooks. Se reemplaza por el equivalente sin hook: un listener +un
// chequeo puntual de "¿la app se abrió por un tap?", combinados dan la
// misma cobertura (cold start y app ya corriendo) que el hook envuelve.
//
// (1) Cubre el caso de que la app estuviera cerrada y se abra por el tap.
export async function checkPendingBriefingTap(): Promise<boolean> {
  const Notifications = await getNotifications();
  if (!Notifications) return false;
  const response = await Notifications.getLastNotificationResponseAsync();
  return response?.notification.request.identifier === NOTIFICATION_ID;
}

// (2) Cubre el caso de que la app ya estuviera corriendo (foreground o
// background con proceso vivo) cuando se toca la notificación.
export async function subscribeToBriefingTap(
  onTap: () => void,
): Promise<{ remove: () => void } | null> {
  const Notifications = await getNotifications();
  if (!Notifications) return null;
  return Notifications.addNotificationResponseReceivedListener((response) => {
    if (response.notification.request.identifier === NOTIFICATION_ID) {
      onTap();
    }
  });
}
