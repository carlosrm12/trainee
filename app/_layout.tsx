import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from "@expo-google-fonts/inter";
import { useMigrations } from "drizzle-orm/expo-sqlite/migrator";
import { Stack } from "expo-router";
import * as SystemUI from "expo-system-ui";
import { useEffect, useState } from "react";
import { ActivityIndicator, Text, View } from "react-native";
import { db } from "../data/db/client";
import { seedInitialData } from "../data/seedInitialData";
import migrations from "../drizzle/migrations/migrations";
import "../global.css";

SystemUI.setBackgroundColorAsync("#0E0E12");

export default function RootLayout() {
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

  if (error) {
    return (
      <View className="flex-1 items-center justify-center bg-bg-base">
        <Text className="text-danger">Error de migración: {error.message}</Text>
      </View>
    );
  }

  if (!success || !seeded || !fontsLoaded) {
    return (
      <View className="flex-1 items-center justify-center bg-bg-base">
        <ActivityIndicator color="#F5C518" />
      </View>
    );
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: "#0E0E12" },
      }}
    />
  );
}
