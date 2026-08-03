import { eq } from "drizzle-orm";
import type {
  Exercise,
  ExerciseRepository,
  MuscleGroup,
  WeightInputMode,
} from "../../domain/entities";
import { exercises } from "../../drizzle/schema";
import { db } from "../db/client";

export class SQLiteExerciseRepository implements ExerciseRepository {
  async getAll(): Promise<Exercise[]> {
    const rows = await db.select().from(exercises);
    return rows.map((r) => ({
      id: r.id,
      name: r.name,
      muscleGroup: r.muscleGroup as MuscleGroup,
      isCustom: r.isCustom,
      weightInputMode: r.weightInputMode as WeightInputMode,
    }));
  }

  async getById(id: string): Promise<Exercise | null> {
    const rows = await db.select().from(exercises).where(eq(exercises.id, id));
    const r = rows[0];
    if (!r) return null;
    return {
      id: r.id,
      name: r.name,
      muscleGroup: r.muscleGroup as MuscleGroup,
      isCustom: r.isCustom,
      weightInputMode: r.weightInputMode as WeightInputMode,
    };
  }

  async update(
    id: string,
    changes: Partial<Omit<Exercise, "id">>,
  ): Promise<void> {
    await db.update(exercises).set(changes).where(eq(exercises.id, id));
  }
}
