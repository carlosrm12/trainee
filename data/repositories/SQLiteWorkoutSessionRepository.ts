import { desc, eq } from "drizzle-orm";
import { randomUUID } from "expo-crypto";
import type {
  SessionStatus,
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
    return {
      id,
      routineId,
      date,
      completedAt: null,
      status: "in_progress",
      notes: null,
      lastRoutineExerciseId: null,
    };
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
      completedAt: r.completedAt,
      status: "in_progress",
      notes: r.notes,
      lastRoutineExerciseId: r.lastRoutineExerciseId,
    };
  }

  async getById(id: string): Promise<WorkoutSession | null> {
    const rows = await db
      .select()
      .from(workoutSessions)
      .where(eq(workoutSessions.id, id));
    const r = rows[0];
    if (!r) return null;
    return {
      id: r.id,
      routineId: r.routineId,
      date: r.date,
      completedAt: r.completedAt,
      status: r.status as SessionStatus,
      notes: r.notes,
      lastRoutineExerciseId: r.lastRoutineExerciseId,
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

  async deleteSession(id: string): Promise<void> {
    await db.delete(setLogs).where(eq(setLogs.sessionId, id));
    await db.delete(workoutSessions).where(eq(workoutSessions.id, id));
  }

  async updateLastPosition(
    id: string,
    routineExerciseId: string,
  ): Promise<void> {
    await db
      .update(workoutSessions)
      .set({ lastRoutineExerciseId: routineExerciseId })
      .where(eq(workoutSessions.id, id));
  }

  async logSet(set: Omit<SetLog, "id">): Promise<SetLog> {
    const existing = await db
      .select()
      .from(setLogs)
      .where(eq(setLogs.sessionId, set.sessionId));
    const duplicate = existing.find(
      (r) =>
        r.routineExerciseId === set.routineExerciseId &&
        r.setNumber === set.setNumber &&
        r.isWarmup === set.isWarmup,
    );
    if (duplicate) {
      await db.delete(setLogs).where(eq(setLogs.id, duplicate.id));
    }

    const id = randomUUID();
    await db.insert(setLogs).values({
      id,
      sessionId: set.sessionId,
      routineExerciseId: set.routineExerciseId,
      setNumber: set.setNumber,
      weightKg: set.weightKg,
      reps: set.reps,
      isWarmup: set.isWarmup,
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
      completedAt: r.completedAt,
      status: "completed" as const,
      notes: r.notes,
      lastRoutineExerciseId: r.lastRoutineExerciseId,
    }));
  }

  async getSetLogsForSession(sessionId: string): Promise<SetLog[]> {
    const rows = await db
      .select()
      .from(setLogs)
      .where(eq(setLogs.sessionId, sessionId));
    return rows.map((r) => ({
      id: r.id,
      sessionId: r.sessionId,
      routineExerciseId: r.routineExerciseId,
      setNumber: r.setNumber,
      weightKg: r.weightKg,
      reps: r.reps,
      isWarmup: r.isWarmup,
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
        isWarmup: r.isWarmup,
      }));
  }
}
