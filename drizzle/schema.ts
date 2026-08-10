import { sql } from "drizzle-orm";
import { integer, real, sqliteTable, text } from "drizzle-orm/sqlite-core";

// Catálogo de ejercicios (sembrado + custom del usuario)
export const exercises = sqliteTable("exercises", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  muscleGroup: text("muscle_group").notNull(), // "chest" | "back" | "legs" | "shoulders" | "arms" | "core"
  isCustom: integer("is_custom", { mode: "boolean" }).notNull().default(false),
  weightInputMode: text("weight_input_mode").notNull().default("total"), // "total" | "per_side"
  inputUnit: text("input_unit").notNull().default("kg"), // "kg" | "lb"
});

// Rutinas (una por día de la semana, ej. "Lunes - Superior A")
export const routines = sqliteTable("routines", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  dayOfWeek: integer("day_of_week"), // 0-6, null si no está asignada a un día fijo
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
  status: text("status").notNull().default("in_progress"), // "in_progress" | "completed" | "discarded"
  notes: text("notes"),
  lastRoutineExerciseId: text("last_routine_exercise_id"),
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
  weightKg: real("weight_kg").notNull(), // siempre en kg, la conversión a lb es solo de UI
  reps: integer("reps").notNull(),
  isWarmup: integer("is_warmup", { mode: "boolean" }).notNull().default(false),
  completedAt: text("completed_at")
    .notNull()
    .default(sql`(current_timestamp)`),
});

// Ajustes del usuario — una sola fila fija (id="default")
export const userSettings = sqliteTable("user_settings", {
  id: text("id").primaryKey(),
  weightUnit: text("weight_unit").notNull().default("kg"), // "kg" | "lb"
  soundEnabled: integer("sound_enabled", { mode: "boolean" })
    .notNull()
    .default(true),
  vibrationEnabled: integer("vibration_enabled", { mode: "boolean" })
    .notNull()
    .default(true),
  notificationsEnabled: integer("notifications_enabled", { mode: "boolean" })
    .notNull()
    .default(true),
  avatarUri: text("avatar_uri"), // ruta local del avatar copiado a documentDirectory, null = sin foto
});
