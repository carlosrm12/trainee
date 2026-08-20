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
  // Hora del morning briefing (§8/§9 Fase 2) — ajuste general de rutina
  // diaria, no un dato nutricional, por eso vive acá y no en
  // nutrition_profile. Default 8:00 — guardarlo dispara
  // useMorningBriefingNotification (cancelar + reprogramar), ver paso 7.
  briefingHour: integer("briefing_hour").notNull().default(8),
  briefingMinute: integer("briefing_minute").notNull().default(0),
});

// --- Fase 2: Nutrición ---

// Perfil físico y metas de nutrición — una sola fila fija (id="default"),
// mismo patrón que user_settings. Fuente de verdad del "system prompt"
// (ver §4 del doc de Fase 2) — nunca se versiona como archivo.
export const nutritionProfile = sqliteTable("nutrition_profile", {
  id: text("id").primaryKey(),
  heightCm: real("height_cm"),
  currentWeightKg: real("current_weight_kg"),
  targetWeightKg: real("target_weight_kg"),
  goal: text("goal"), // "deficit" | "bulk" | "maintenance"
  weightUnitOverride: text("weight_unit_override"), // "kg" | "lb" | null → hereda settings.weightUnit
  dailyCalorieTarget: integer("daily_calorie_target"), // integer: kcal ya se muestran redondeadas en toda la app
  dailyProteinG: real("daily_protein_g"), // real: magnitud continua, mismo criterio que weightKg
  dailyCarbsG: real("daily_carbs_g"),
  dailyFatG: real("daily_fat_g"),
  weeklyBudget: real("weekly_budget"),
  currency: text("currency").notNull().default("USD"), // código ISO, nunca símbolo hardcodeado
  dietaryPreferences: text("dietary_preferences"), // JSON stringified string[]
  dietaryRestrictions: text("dietary_restrictions"), // JSON stringified string[]
  updatedAt: text("updated_at")
    .notNull()
    .default(sql`(current_timestamp)`),
});

// Registro de comidas — una sola tabla para todos los días, se filtra por
// `date`, mismo criterio que ya se aplicó con set_logs.
export const mealLogs = sqliteTable("meal_logs", {
  id: text("id").primaryKey(),
  date: text("date").notNull(), // YYYY-MM-DD, vía getLocalDateString
  mealType: text("meal_type").notNull(), // "breakfast" | "lunch" | "dinner" | "snack"
  photoUri: text("photo_uri"), // null tras retención de 14 días o si es manual sin foto
  name: text("name").notNull(),
  calories: integer("calories").notNull(),
  proteinG: real("protein_g").notNull(),
  carbsG: real("carbs_g").notNull(),
  fatG: real("fat_g").notNull(),
  confidence: real("confidence"), // 0-1, null si source === "manual"
  source: text("source").notNull().default("manual"), // "ai" | "manual"
  // "pending": falló el análisis de Gemini, macros en 0, recuperable desde
  // el dashboard (§5). "complete": la fila tiene valores reales, sea por IA
  // confirmada o carga manual. Default "complete" para que filas ya
  // existentes (creadas antes de esta columna) se interpreten correctamente
  // sin migración de datos manual.
  analysisStatus: text("analysis_status").notNull().default("complete"), // "pending" | "complete"
  notes: text("notes"),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(current_timestamp)`),
});

// Cache de la lista de compras semanal — una fila por semana, se conserva
// histórico para comparar; invalidación explícita (§11), nunca soft-delete.
export const shoppingLists = sqliteTable("shopping_lists", {
  id: text("id").primaryKey(),
  weekStartDate: text("week_start_date").notNull(), // YYYY-MM-DD
  itemsJson: text("items_json").notNull().default("[]"),
  estimatedTotal: real("estimated_total").notNull().default(0),
  currency: text("currency").notNull().default("USD"),
  generatedAt: text("generated_at")
    .notNull()
    .default(sql`(current_timestamp)`),
});

// Cache del texto de IA del morning briefing — una fila por fecha. Se BORRA
// (no se marca) al invalidar, así "no hay fila" es la señal de regenerar (§3/§9).
export const nutritionDayReports = sqliteTable("nutrition_day_reports", {
  date: text("date").primaryKey(), // YYYY-MM-DD
  reportText: text("report_text").notNull(),
  generatedAt: text("generated_at")
    .notNull()
    .default(sql`(current_timestamp)`),
});
