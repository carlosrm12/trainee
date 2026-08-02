import { sql } from "drizzle-orm";
import { integer, real, sqliteTable, text } from "drizzle-orm/sqlite-core";

// Catálogo de ejercicios (sembrado + custom del usuario)
export const exercises = sqliteTable("exercises", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  muscleGroup: text("muscle_group").notNull(),
  isCustom: integer("is_custom", { mode: "boolean" }).notNull().default(false),
});

// Rutinas (una por día de la semana, ej. "Lunes - Superior A")
export const routines = sqliteTable("routines", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  dayOfWeek: integer("day_of_week"),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(current_timestamp)`),
});

// Ejercicios dentro de una rutina, con su config objetivo
export const routineExercises = sqliteTable("routine_exercises", {
  id: text("id").primaryKey(),
  routineId: text("routine_id")
    .notNull()
    .references(() => routines.id),
  exerciseId: text("exercise_id")
    .notNull()
    .references(() => exercises.id),
  order: integer("order").notNull(),
  restSeconds: integer("rest_seconds").notNull().default(90),
  targetSets: integer("target_sets").notNull(),
  repMin: integer("rep_min").notNull(),
  repMax: integer("rep_max").notNull(),
});

// Sesión de entrenamiento (una ejecución real de una rutina)
export const workoutSessions = sqliteTable("workout_sessions", {
  id: text("id").primaryKey(),
  routineId: text("routine_id")
    .notNull()
    .references(() => routines.id),
  date: text("date").notNull(),
  status: text("status").notNull().default("in_progress"),
  notes: text("notes"),
  startedAt: text("started_at")
    .notNull()
    .default(sql`(current_timestamp)`),
  completedAt: text("completed_at"),
});

// Cada serie registrada dentro de una sesión
export const setLogs = sqliteTable("set_logs", {
  id: text("id").primaryKey(),
  sessionId: text("session_id")
    .notNull()
    .references(() => workoutSessions.id),
  routineExerciseId: text("routine_exercise_id")
    .notNull()
    .references(() => routineExercises.id),
  setNumber: integer("set_number").notNull(),
  weightKg: real("weight_kg").notNull(),
  reps: integer("reps").notNull(),
  completedAt: text("completed_at")
    .notNull()
    .default(sql`(current_timestamp)`),
});
