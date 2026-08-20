import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from "@expo-google-fonts/inter";
import { useMigrations } from "drizzle-orm/expo-sqlite/migrator";
import * as ImagePicker from "expo-image-picker";
import { Stack, useRouter } from "expo-router";
import * as SystemUI from "expo-system-ui";
import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Text, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { db } from "../data/db/client";
import { SQLiteMealLogRepository } from "../data/repositories/SQLiteMealLogRepository";
import { seedInitialData } from "../data/seedInitialData";
import migrations from "../drizzle/migrations/migrations";
import {
  checkPendingBriefingTap,
  subscribeToBriefingTap,
  useMorningBriefingNotification,
} from "../features/nutrition/useMorningBriefingNotification";
import { useSettings } from "../features/profile/useSettings";
import "../global.css";
import { getLocalDateString } from "../shared/utils/getLocalDateString";

// Ver §5 "Retención de fotos": 14 días desde createdAt, borrado físico +
// photoUri = null. Corre una vez por apertura de app, no es un background
// job (no hace falta: no es sensible al segundo).
const MEAL_PHOTO_RETENTION_DAYS = 14;

SystemUI.setBackgroundColorAsync("#0E0E12");

export default function RootLayout() {
  const router = useRouter();
  const { success, error } = useMigrations(db, migrations);
  const [seeded, setSeeded] = useState(false);
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });
  const {
    loading: settingsLoading,
    briefingHour,
    briefingMinute,
  } = useSettings();
  const { schedule: scheduleBriefingNotification } =
    useMorningBriefingNotification();
  const briefingScheduledRef = useRef(false);

  useEffect(() => {
    if (!success) return;
    seedInitialData().then(() => setSeeded(true));
  }, [success]);

  useEffect(() => {
    if (!success) return;
    // Fire-and-forget: no debe bloquear el arranque ni gatear seeded/fonts.
    new SQLiteMealLogRepository()
      .clearExpiredPhotos(MEAL_PHOTO_RETENTION_DAYS)
      .catch((err) => {
        console.warn("clearExpiredPhotos falló al abrir la app:", err);
      });
  }, [success]);
  useEffect(() => {
    if (!success || !seeded || !fontsLoaded) return;
    (async () => {
      try {
        const pending = await ImagePicker.getPendingResultAsync();
        if (pending && !("canceled" in pending && pending.canceled)) {
          const uri = (pending as ImagePicker.ImagePickerResult).assets?.[0]
            ?.uri;
          if (uri) {
            router.push({
              pathname: "/meal-capture",
              params: { photoUri: uri },
            });
          }
        }
      } catch {
        // no había resultado pendiente que recuperar
      }
    })();
  }, [success, seeded, fontsLoaded, router]);

  // (b) del paso 7: la hora del briefing no es un valor pasivo (§8) — se
  // reprograma también al guardar desde Perfil (ver profile.tsx), pero acá
  // se asegura que el trigger DAILY quede activo aunque el usuario nunca
  // haya abierto Perfil (usa el default de la fila, 8:00). Cancelar-y-
  // reprogramar es barato, así que correrlo una vez por apertura de app
  // (no en cada render) es suficiente — no hace falta compararlo contra
  // un valor previo.
  useEffect(() => {
    if (!success || !seeded || !fontsLoaded || settingsLoading) return;
    if (briefingScheduledRef.current) return;
    briefingScheduledRef.current = true;
    scheduleBriefingNotification(briefingHour, briefingMinute).catch(() => {
      // Expo Go: no-op esperado. Fuera de Expo Go, no bloquea el arranque.
    });
  }, [
    success,
    seeded,
    fontsLoaded,
    settingsLoading,
    briefingHour,
    briefingMinute,
    scheduleBriefingNotification,
  ]);

  // (c) del paso 7: capturar el tap de la notificación del briefing y
  // navegar a "ayer" en el historial nutricional. Dos mecanismos porque no
  // podemos usar el hook useLastNotificationResponse() (ver el comentario
  // grande en useMorningBriefingNotification.ts) — uno cubre que la app
  // arranque por el tap (cold start), el otro que ya estuviera corriendo.
  useEffect(() => {
    if (!success || !seeded || !fontsLoaded) return;

    function goToYesterday() {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      router.push(`/nutrition-day/${getLocalDateString(yesterday)}`);
    }

    checkPendingBriefingTap().then((wasTapped) => {
      if (wasTapped) goToYesterday();
    });

    let subscription: { remove: () => void } | null = null;
    subscribeToBriefingTap(goToYesterday).then((sub) => {
      subscription = sub;
    });

    return () => {
      subscription?.remove();
    };
  }, [success, seeded, fontsLoaded, router]);

  if (error) {
    return (
      <GestureHandlerRootView style={{ flex: 1 }}>
        <View className="flex-1 items-center justify-center bg-bg-base">
          <Text className="text-danger">
            Error de migración: {error.message}
          </Text>
        </View>
      </GestureHandlerRootView>
    );
  }

  if (!success || !seeded || !fontsLoaded) {
    return (
      <GestureHandlerRootView style={{ flex: 1 }}>
        <View className="flex-1 items-center justify-center bg-bg-base">
          <ActivityIndicator color="#F5C518" />
        </View>
      </GestureHandlerRootView>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: "#0E0E12" },
        }}
      />
    </GestureHandlerRootView>
  );
}
