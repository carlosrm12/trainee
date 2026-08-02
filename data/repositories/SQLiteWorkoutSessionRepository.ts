import { desc, eq } from "drizzle-orm";
import { randomUUID } from "expo-crypto";
import type {
  SetLog,
  WorkoutSession,
  WorkoutSessionRepository,
} from "../../domain/entities";
import {
  routineExercises,
  setLogs,
  workoutSessions,
} from "../../drizzle/schema";
import { db } from "../db/client";

export class SQLiteWorkoutSessionRepository implements WorkoutSessionRepository {
  async start(routineId: string): Promise<WorkoutSession> {
    const id = randomUUID();
    const date = new Date().toISOString();
    await db
      .insert(workoutSessions)
      .values({ id, routineId, date, status: "in_progress" });
    return { id, routineId, date, status: "in_progress", notes: null };
  }

  async getActive(): Promise<WorkoutSession | null> {
    const rows = await db
      .select()
      .from(workoutSessions)
      .where(eq(workoutSessions.status, "in_progress"));
    const r = rows[0];
    if (!r) return null;
    return {
      id: r.id,
      routineId: r.routineId,
      date: r.date,
      status: "in_progress",
      notes: r.notes,
    };
  }

  async complete(id: string, notes: string | null): Promise<void> {
    await db
      .update(workoutSessions)
      .set({
        status: "completed",
        notes,
        completedAt: new Date().toISOString(),
      })
      .where(eq(workoutSessions.id, id));
  }

  async discard(id: string): Promise<void> {
    await db
      .update(workoutSessions)
      .set({ status: "discarded" })
      .where(eq(workoutSessions.id, id));
  }

  async logSet(set: Omit<SetLog, "id">): Promise<SetLog> {
    const id = randomUUID();
    await db.insert(setLogs).values({
      id,
      sessionId: set.sessionId,
      routineExerciseId: set.routineExerciseId,
      setNumber: set.setNumber,
      weightKg: set.weightKg,
      reps: set.reps,
    });
    return { id, ...set };
  }

  async getHistory(limit = 20): Promise<WorkoutSession[]> {
    const rows = await db
      .select()
      .from(workoutSessions)
      .where(eq(workoutSessions.status, "completed"))
      .orderBy(desc(workoutSessions.date))
      .limit(limit);

    return rows.map((r) => ({
      id: r.id,
      routineId: r.routineId,
      date: r.date,
      status: "completed" as const,
      notes: r.notes,
    }));
  }

  async getSetHistoryForExercise(exerciseId: string): Promise<SetLog[]> {
    const relatedRoutineExercises = await db
      .select({ id: routineExercises.id })
      .from(routineExercises)
      .where(eq(routineExercises.exerciseId, exerciseId));

    const ids = relatedRoutineExercises.map((r) => r.id);
    if (ids.length === 0) return [];

    const rows = await db.select().from(setLogs);
    return rows
      .filter((r) => ids.includes(r.routineExerciseId))
      .map((r) => ({
        id: r.id,
        sessionId: r.sessionId,
        routineExerciseId: r.routineExerciseId,
        setNumber: r.setNumber,
        weightKg: r.weightKg,
        reps: r.reps,
      }));
  }
}
