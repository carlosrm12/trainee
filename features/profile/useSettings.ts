import { useCallback, useEffect, useState } from "react";
import { SQLiteSettingsRepository } from "../../data/repositories/SQLiteSettingsRepository";
import type { UserSettings, WeightUnit } from "../../domain/entities";

const settingsRepo = new SQLiteSettingsRepository();

const DEFAULT_SETTINGS: UserSettings = {
  weightUnit: "kg",
  soundEnabled: true,
  vibrationEnabled: true,
  notificationsEnabled: true,
  avatarUri: null,
  briefingHour: 8,
  briefingMinute: 0,
};

export function useSettings() {
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const loaded = await settingsRepo.get();
    setSettings(loaded);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function setWeightUnit(unit: WeightUnit) {
    await settingsRepo.update({ weightUnit: unit });
    setSettings((s) => ({ ...s, weightUnit: unit }));
  }

  async function setSoundEnabled(enabled: boolean) {
    await settingsRepo.update({ soundEnabled: enabled });
    setSettings((s) => ({ ...s, soundEnabled: enabled }));
  }

  async function setVibrationEnabled(enabled: boolean) {
    await settingsRepo.update({ vibrationEnabled: enabled });
    setSettings((s) => ({ ...s, vibrationEnabled: enabled }));
  }

  async function setNotificationsEnabled(enabled: boolean) {
    await settingsRepo.update({ notificationsEnabled: enabled });
    setSettings((s) => ({ ...s, notificationsEnabled: enabled }));
  }

  async function setAvatarUri(uri: string | null) {
    await settingsRepo.update({ avatarUri: uri });
    setSettings((s) => ({ ...s, avatarUri: uri }));
  }

  // Guarda las dos juntas — no tiene sentido persistir hora sin minuto o
  // viceversa, y así el llamador (profile.tsx) siempre dispara la
  // reprogramación de la notificación con el par completo de una vez.
  async function setBriefingTime(hour: number, minute: number) {
    await settingsRepo.update({ briefingHour: hour, briefingMinute: minute });
    setSettings((s) => ({ ...s, briefingHour: hour, briefingMinute: minute }));
  }

  return {
    loading,
    weightUnit: settings.weightUnit,
    soundEnabled: settings.soundEnabled,
    vibrationEnabled: settings.vibrationEnabled,
    notificationsEnabled: settings.notificationsEnabled,
    avatarUri: settings.avatarUri,
    briefingHour: settings.briefingHour,
    briefingMinute: settings.briefingMinute,
    setWeightUnit,
    setSoundEnabled,
    setVibrationEnabled,
    setNotificationsEnabled,
    setAvatarUri,
    setBriefingTime,
  };
}
