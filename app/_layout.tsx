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
import { useEffect, useState } from "react";
import { ActivityIndicator, Text, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { db } from "../data/db/client";
import { SQLiteMealLogRepository } from "../data/repositories/SQLiteMealLogRepository";
import { seedInitialData } from "../data/seedInitialData";
import migrations from "../drizzle/migrations/migrations";
import "../global.css";

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
