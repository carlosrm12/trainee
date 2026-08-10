import * as Haptics from "expo-haptics";
import * as Notifications from "expo-notifications";
import { useCallback, useEffect, useRef, useState } from "react";
import { Platform } from "react-native";

const CHANNEL_ID = "rest-timer";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

async function ensureNotificationSetup() {
  const current = await Notifications.getPermissionsAsync();
  if (current.status !== "granted") {
    await Notifications.requestPermissionsAsync();
  }
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
      name: "Temporizador de descanso",
      importance: Notifications.AndroidImportance.MAX,
    });
  }
}

export interface UseRestTimerOptions {
  // Si es false, no se programa la notificación de sistema al terminar el
  // descanso (ni sonido ni vibración de sistema).
  notificationsEnabled?: boolean;
  // Si notificationsEnabled es true, controla si esa notificación suena.
  soundEnabled?: boolean;
  // Controla el feedback háptico en primer plano (cuando el timer termina
  // con la app abierta). Independiente de la vibración de la notificación
  // en background, que depende del canal del sistema operativo.
  vibrationEnabled?: boolean;
}

export function useRestTimer(options: UseRestTimerOptions = {}) {
  const {
    notificationsEnabled = true,
    soundEnabled = true,
    vibrationEnabled = true,
  } = options;

  const [active, setActive] = useState(false);
  const [remaining, setRemaining] = useState(0);
  const [total, setTotal] = useState(0);

  const endAtRef = useRef<number | null>(null);
  const notificationIdRef = useRef<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const onFinishRef = useRef<(() => void) | null>(null);

  // Refs para leer el valor más reciente de los ajustes dentro de callbacks
  // memoizados sin tener que reconstruirlos en cada cambio.
  const notificationsEnabledRef = useRef(notificationsEnabled);
  const soundEnabledRef = useRef(soundEnabled);
  const vibrationEnabledRef = useRef(vibrationEnabled);
  useEffect(() => {
    notificationsEnabledRef.current = notificationsEnabled;
    soundEnabledRef.current = soundEnabled;
    vibrationEnabledRef.current = vibrationEnabled;
  }, [notificationsEnabled, soundEnabled, vibrationEnabled]);

  useEffect(() => {
    if (notificationsEnabled) ensureNotificationSetup();
  }, [notificationsEnabled]);

  const clearTick = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const cancelNotification = useCallback(async () => {
    if (notificationIdRef.current) {
      await Notifications.cancelScheduledNotificationAsync(
        notificationIdRef.current,
      );
      notificationIdRef.current = null;
    }
  }, []);

  const scheduleNotification = useCallback(async (secondsFromNow: number) => {
    if (!notificationsEnabledRef.current) return;
    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: "Descanso terminado 💪",
        body: "Ya puedes empezar tu siguiente serie.",
        sound: soundEnabledRef.current,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: Math.max(1, secondsFromNow),
        channelId: CHANNEL_ID,
      },
    });
    notificationIdRef.current = id;
  }, []);

  const finish = useCallback(async () => {
    clearTick();
    await cancelNotification();
    if (vibrationEnabledRef.current) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    setActive(false);
    setRemaining(0);
    onFinishRef.current?.();
  }, [clearTick, cancelNotification]);

  const tick = useCallback(() => {
    if (!endAtRef.current) return;
    const secondsLeft = Math.max(
      0,
      Math.round((endAtRef.current - Date.now()) / 1000),
    );
    setRemaining(secondsLeft);
    if (secondsLeft <= 0) {
      clearTick();
      setTimeout(finish, 400);
    }
  }, [finish, clearTick]);

  const start = useCallback(
    async (seconds: number, onFinish: () => void) => {
      if (notificationsEnabledRef.current) await ensureNotificationSetup();
      await cancelNotification();

      onFinishRef.current = onFinish;
      endAtRef.current = Date.now() + seconds * 1000;
      setTotal(seconds);
      setRemaining(seconds);
      setActive(true);

      await scheduleNotification(seconds);

      clearTick();
      intervalRef.current = setInterval(tick, 250);
    },
    [cancelNotification, clearTick, scheduleNotification, tick],
  );

  const adjust = useCallback(
    (deltaSeconds: number) => {
      if (!endAtRef.current) return;
      endAtRef.current += deltaSeconds * 1000;
      setTotal((t) => Math.max(1, t + deltaSeconds));
      tick();
      const secondsLeft = Math.max(
        1,
        Math.round((endAtRef.current - Date.now()) / 1000),
      );
      cancelNotification().then(() => scheduleNotification(secondsLeft));
    },
    [tick, cancelNotification, scheduleNotification],
  );

  const skip = useCallback(() => {
    finish();
  }, [finish]);

  useEffect(() => clearTick, [clearTick]);

  return { active, remaining, total, start, adjust, skip };
}
