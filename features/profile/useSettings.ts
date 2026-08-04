import { useCallback, useEffect, useState } from "react";
import { SQLiteSettingsRepository } from "../../data/repositories/SQLiteSettingsRepository";
import type { WeightUnit } from "../../domain/entities";

const settingsRepo = new SQLiteSettingsRepository();

export function useSettings() {
  const [weightUnit, setWeightUnitState] = useState<WeightUnit>("kg");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const settings = await settingsRepo.get();
    setWeightUnitState(settings.weightUnit);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function setWeightUnit(unit: WeightUnit) {
    await settingsRepo.update({ weightUnit: unit });
    setWeightUnitState(unit);
  }

  return { loading, weightUnit, setWeightUnit };
}
