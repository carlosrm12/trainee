import { drizzle } from "drizzle-orm/expo-sqlite";
import { useMigrations } from "drizzle-orm/expo-sqlite/migrator";
import { Stack } from "expo-router";
import { SQLiteProvider, openDatabaseSync } from "expo-sqlite";
import { Suspense, useEffect, useState } from "react";
import { ActivityIndicator, Text, View } from "react-native";
import { seedInitialData } from "../data/seedInitialData";
import migrations from "../drizzle/migrations/migrations";
import * as schema from "../drizzle/schema";
import "../global.css";

const DATABASE_NAME = "trainlog.db";

function AppReady() {
  const expo = openDatabaseSync(DATABASE_NAME, { enableChangeListener: true });
  const db = drizzle(expo, { schema });
  const { success, error } = useMigrations(db, migrations);
  const [seeded, setSeeded] = useState(false);

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

  if (!success || !seeded) {
    return (
      <View className="flex-1 items-center justify-center bg-bg-base">
        <ActivityIndicator color="#F5C518" />
      </View>
    );
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}

export default function RootLayout() {
  return (
    <Suspense
      fallback={
        <View className="flex-1 items-center justify-center bg-bg-base">
          <ActivityIndicator color="#F5C518" />
        </View>
      }
    >
      <SQLiteProvider databaseName={DATABASE_NAME} useSuspense>
        <AppReady />
      </SQLiteProvider>
    </Suspense>
  );
}
