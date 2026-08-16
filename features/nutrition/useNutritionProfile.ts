import { SQLiteNutritionProfileRepository } from "@/data/repositories/SQLiteNutritionProfileRepository";
import type { NutritionProfile } from "@/domain/entities";
import { useCallback, useEffect, useState } from "react";

const profileRepo = new SQLiteNutritionProfileRepository();

const EMPTY_PROFILE: Omit<NutritionProfile, "updatedAt"> = {
  heightCm: null,
  currentWeightKg: null,
  targetWeightKg: null,
  goal: null,
  weightUnitOverride: null,
  dailyCalorieTarget: null,
  dailyProteinG: null,
  dailyCarbsG: null,
  dailyFatG: null,
  weeklyBudget: null,
  currency: "USD",
  dietaryPreferences: [],
  dietaryRestrictions: [],
};

export function useNutritionProfile() {
  // null = todavía no se guardó nada — es la señal de "no configurado" que
  // usa §9 del doc de Fase 2 ("Condición única") para decidir si hay reporte
  // de IA. No inventar un default acá que la esconda.
  const [profile, setProfile] = useState<NutritionProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const loaded = await profileRepo.get();
    setProfile(loaded);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const update = useCallback(
    async (changes: Partial<Omit<NutritionProfile, "updatedAt">>) => {
      await profileRepo.update(changes);
      setProfile((prev) => ({
        ...EMPTY_PROFILE,
        ...prev,
        ...changes,
        updatedAt: new Date().toISOString(),
      }));
    },
    [],
  );

  return { profile, loading, update, reload: load };
}
