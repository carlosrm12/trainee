import { asc, eq } from "drizzle-orm";
import { randomUUID } from "expo-crypto";
import type {
  Routine,
  RoutineExercise,
  RoutineRepository,
} from "../../domain/entities";
import { routineExercises, routines } from "../../drizzle/schema";
import { db } from "../db/client";

export class SQLiteRoutineRepository implements RoutineRepository {
  async getAll(): Promise<Routine[]> {
    const rows = await db.select().from(routines);
    return rows.map((r) => ({
      id: r.id,
      name: r.name,
      dayOfWeek: r.dayOfWeek,
    }));
  }

  async getById(id: string): Promise<Routine | null> {
    const rows = await db.select().from(routines).where(eq(routines.id, id));
    const r = rows[0];
    return r ? { id: r.id, name: r.name, dayOfWeek: r.dayOfWeek } : null;
  }

  async getExercises(routineId: string): Promise<RoutineExercise[]> {
    const rows = await db
      .select()
      .from(routineExercises)
      .where(eq(routineExercises.routineId, routineId))
      .orderBy(asc(routineExercises.order));

    return rows.map((r) => ({
      id: r.id,
      routineId: r.routineId,
      exerciseId: r.exerciseId,
      order: r.order,
      restSeconds: r.restSeconds,
      targetSets: r.targetSets,
      repMin: r.repMin,
      repMax: r.repMax,
    }));
  }

  async create(routine: Omit<Routine, "id">): Promise<Routine> {
    const id = randomUUID();
    await db
      .insert(routines)
      .values({ id, name: routine.name, dayOfWeek: routine.dayOfWeek });
    return { id, ...routine };
  }

  async update(
    id: string,
    changes: Partial<Omit<Routine, "id">>,
  ): Promise<void> {
    await db.update(routines).set(changes).where(eq(routines.id, id));
  }

  async delete(id: string): Promise<void> {
    await db.delete(routineExercises).where(eq(routineExercises.routineId, id));
    await db.delete(routines).where(eq(routines.id, id));
  }

  async addExercise(
    input: Omit<RoutineExercise, "id">,
  ): Promise<RoutineExercise> {
    const id = randomUUID();
    await db.insert(routineExercises).values({
      id,
      routineId: input.routineId,
      exerciseId: input.exerciseId,
      order: input.order,
      restSeconds: input.restSeconds,
      targetSets: input.targetSets,
      repMin: input.repMin,
      repMax: input.repMax,
    });
    return { id, ...input };
  }

  async updateExercise(
    id: string,
    changes: Partial<Omit<RoutineExercise, "id" | "routineId">>,
  ): Promise<void> {
    await db
      .update(routineExercises)
      .set(changes)
      .where(eq(routineExercises.id, id));
  }

  async removeExercise(id: string): Promise<void> {
    await db.delete(routineExercises).where(eq(routineExercises.id, id));
  }
}
