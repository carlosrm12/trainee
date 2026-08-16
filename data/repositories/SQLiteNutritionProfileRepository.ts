import { eq } from "drizzle-orm";
import type {
  NutritionGoal,
  NutritionProfile,
  NutritionProfileRepository,
  WeightUnit,
} from "../../domain/entities";
import { nutritionProfile } from "../../drizzle/schema";
import { db } from "../db/client";

const PROFILE_ID = "default";

function parseJsonArray(value: string | null): string[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export class SQLiteNutritionProfileRepository implements NutritionProfileRepository {
  async get(): Promise<NutritionProfile | null> {
    const rows = await db
      .select()
      .from(nutritionProfile)
      .where(eq(nutritionProfile.id, PROFILE_ID));
    const r = rows[0];
    if (!r) return null; // sin configurar todavía — ver §9 "Condición única"

    return {
      heightCm: r.heightCm,
      currentWeightKg: r.currentWeightKg,
      targetWeightKg: r.targetWeightKg,
      goal: r.goal as NutritionGoal | null,
      weightUnitOverride: r.weightUnitOverride as WeightUnit | null,
      dailyCalorieTarget: r.dailyCalorieTarget,
      dailyProteinG: r.dailyProteinG,
      dailyCarbsG: r.dailyCarbsG,
      dailyFatG: r.dailyFatG,
      weeklyBudget: r.weeklyBudget,
      currency: r.currency,
      dietaryPreferences: parseJsonArray(r.dietaryPreferences),
      dietaryRestrictions: parseJsonArray(r.dietaryRestrictions),
      updatedAt: r.updatedAt,
    };
  }

  async update(
    changes: Partial<Omit<NutritionProfile, "updatedAt">>,
  ): Promise<void> {
    const existing = await db
      .select({ id: nutritionProfile.id })
      .from(nutritionProfile)
      .where(eq(nutritionProfile.id, PROFILE_ID));

    const dbChanges = {
      ...(changes.heightCm !== undefined && { heightCm: changes.heightCm }),
      ...(changes.currentWeightKg !== undefined && {
        currentWeightKg: changes.currentWeightKg,
      }),
      ...(changes.targetWeightKg !== undefined && {
        targetWeightKg: changes.targetWeightKg,
      }),
      ...(changes.goal !== undefined && { goal: changes.goal }),
      ...(changes.weightUnitOverride !== undefined && {
        weightUnitOverride: changes.weightUnitOverride,
      }),
      ...(changes.dailyCalorieTarget !== undefined && {
        dailyCalorieTarget: changes.dailyCalorieTarget,
      }),
      ...(changes.dailyProteinG !== undefined && {
        dailyProteinG: changes.dailyProteinG,
      }),
      ...(changes.dailyCarbsG !== undefined && {
        dailyCarbsG: changes.dailyCarbsG,
      }),
      ...(changes.dailyFatG !== undefined && {
        dailyFatG: changes.dailyFatG,
      }),
      ...(changes.weeklyBudget !== undefined && {
        weeklyBudget: changes.weeklyBudget,
      }),
      ...(changes.currency !== undefined && { currency: changes.currency }),
      ...(changes.dietaryPreferences !== undefined && {
        dietaryPreferences: JSON.stringify(changes.dietaryPreferences),
      }),
      ...(changes.dietaryRestrictions !== undefined && {
        dietaryRestrictions: JSON.stringify(changes.dietaryRestrictions),
      }),
      updatedAt: new Date().toISOString(),
    };

    if (existing.length === 0) {
      await db.insert(nutritionProfile).values({
        id: PROFILE_ID,
        currency: "USD",
        ...dbChanges,
      });
      return;
    }

    await db
      .update(nutritionProfile)
      .set(dbChanges)
      .where(eq(nutritionProfile.id, PROFILE_ID));
  }
}
