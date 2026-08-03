import { drizzle } from "drizzle-orm/expo-sqlite";
import { openDatabaseSync } from "expo-sqlite";
import * as schema from "../../drizzle/schema";

const sqlite = openDatabaseSync("trainlog-v3.db", {
  enableChangeListener: true,
});

export const db = drizzle(sqlite, { schema });
