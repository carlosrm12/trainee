import { eq } from "drizzle-orm";
import type {
  SettingsRepository,
  UserSettings,
  WeightUnit,
} from "../../domain/entities";
import { userSettings } from "../../drizzle/schema";
import { db } from "../db/client";

const SETTINGS_ID = "default";

export class SQLiteSettingsRepository implements SettingsRepository {
  async get(): Promise<UserSettings> {
    const rows = await db
      .select()
      .from(userSettings)
      .where(eq(userSettings.id, SETTINGS_ID));
    const r = rows[0];
    if (!r) {
      await db
        .insert(userSettings)
        .values({ id: SETTINGS_ID, weightUnit: "kg" });
      return { weightUnit: "kg" };
    }
    return { weightUnit: r.weightUnit as WeightUnit };
  }

  async update(changes: Partial<UserSettings>): Promise<void> {
    await this.get(); // asegura que la fila exista antes de actualizar
    await db
      .update(userSettings)
      .set(changes)
      .where(eq(userSettings.id, SETTINGS_ID));
  }
}
