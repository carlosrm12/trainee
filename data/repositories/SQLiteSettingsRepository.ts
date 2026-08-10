import { eq } from "drizzle-orm";
import type {
  SettingsRepository,
  UserSettings,
  WeightUnit,
} from "../../domain/entities";
import { userSettings } from "../../drizzle/schema";
import { db } from "../db/client";

const SETTINGS_ID = "default";

const DEFAULTS: UserSettings = {
  weightUnit: "kg",
  soundEnabled: true,
  vibrationEnabled: true,
  notificationsEnabled: true,
  avatarUri: null,
};

export class SQLiteSettingsRepository implements SettingsRepository {
  async get(): Promise<UserSettings> {
    const rows = await db
      .select()
      .from(userSettings)
      .where(eq(userSettings.id, SETTINGS_ID));
    const r = rows[0];
    if (!r) {
      await db.insert(userSettings).values({
        id: SETTINGS_ID,
        weightUnit: DEFAULTS.weightUnit,
        soundEnabled: DEFAULTS.soundEnabled,
        vibrationEnabled: DEFAULTS.vibrationEnabled,
        notificationsEnabled: DEFAULTS.notificationsEnabled,
      });
      return DEFAULTS;
    }
    return {
      weightUnit: r.weightUnit as WeightUnit,
      soundEnabled: r.soundEnabled,
      vibrationEnabled: r.vibrationEnabled,
      notificationsEnabled: r.notificationsEnabled,
      avatarUri: r.avatarUri,
    };
  }

  async update(changes: Partial<UserSettings>): Promise<void> {
    await this.get(); // asegura que la fila exista antes de actualizar
    await db
      .update(userSettings)
      .set(changes)
      .where(eq(userSettings.id, SETTINGS_ID));
  }
}
