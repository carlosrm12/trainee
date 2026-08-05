import { eq } from "drizzle-orm";
import { randomUUID } from "expo-crypto";
import type {
  Exercise,
  ExerciseRepository,
  MuscleGroup,
  WeightInputMode,
  WeightUnit,
} from "../../domain/entities";
import { exercises } from "../../drizzle/schema";
import { db } from "../db/client";

function mapRow(r: typeof exercises.$inferSelect): Exercise {
  return {
    id: r.id,
    name: r.name,
    muscleGroup: r.muscleGroup as MuscleGroup,
    isCustom: r.isCustom,
    weightInputMode: r.weightInputMode as WeightInputMode,
    inputUnit: r.inputUnit as WeightUnit,
  };
}

export class SQLiteExerciseRepository implements ExerciseRepository {
  async getAll(): Promise<Exercise[]> {
    const rows = await db.select().from(exercises);
    return rows.map(mapRow);
  }

  async getById(id: string): Promise<Exercise | null> {
    const rows = await db.select().from(exercises).where(eq(exercises.id, id));
    const r = rows[0];
    return r ? mapRow(r) : null;
  }

  async create(exercise: Omit<Exercise, "id">): Promise<Exercise> {
    const id = randomUUID();
    await db.insert(exercises).values({
      id,
      name: exercise.name,
      muscleGroup: exercise.muscleGroup,
      isCustom: exercise.isCustom,
      weightInputMode: exercise.weightInputMode,
      inputUnit: exercise.inputUnit,
    });
    return { id, ...exercise };
  }

  async update(
    id: string,
    changes: Partial<Omit<Exercise, "id">>,
  ): Promise<void> {
    await db.update(exercises).set(changes).where(eq(exercises.id, id));
  }

  async delete(id: string): Promise<void> {
    await db.delete(exercises).where(eq(exercises.id, id));
  }
}
