// Entidades puras del dominio — sin dependencias de RN, SQLite ni Drizzle.
// La UI y los repositorios se apoyan en estos tipos, nunca al revés.

export type MuscleGroup =
  | "chest"
  | "back"
  | "shoulders"
  | "biceps"
  | "triceps"
  | "forearms"
  | "quads"
  | "hamstrings"
  | "glutes"
  | "calves"
  | "abs"
  | "traps"
  | "cardio";

export type WeightInputMode = "total" | "per_side";

export interface Exercise {
  id: string;
  name: string;
  muscleGroup: MuscleGroup;
  isCustom: boolean;
  weightInputMode: WeightInputMode;
  inputUnit: WeightUnit;
}

export interface Routine {
  id: string;
  name: string;
  dayOfWeek: number | null;
}

export interface RoutineExercise {
  id: string;
  routineId: string;
  exerciseId: string;
  order: number;
  restSeconds: number;
  targetSets: number;
  repMin: number;
  repMax: number;
}

export type SessionStatus = "in_progress" | "completed" | "discarded";

export interface WorkoutSession {
  id: string;
  routineId: string;
  date: string;
  completedAt: string | null;
  status: SessionStatus;
  notes: string | null;
  lastRoutineExerciseId: string | null;
}

export interface SetLog {
  id: string;
  sessionId: string;
  routineExerciseId: string;
  setNumber: number;
  weightKg: number;
  reps: number;
  isWarmup: boolean;
}

// Contrato que cualquier repositorio (SQLite hoy, API mañana) debe cumplir.
export interface RoutineRepository {
  getAll(): Promise<Routine[]>;
  getById(id: string): Promise<Routine | null>;
  getExercises(routineId: string): Promise<RoutineExercise[]>;
  create(routine: Omit<Routine, "id">): Promise<Routine>;
  update(id: string, changes: Partial<Omit<Routine, "id">>): Promise<void>;
  delete(id: string): Promise<void>;
  addExercise(input: Omit<RoutineExercise, "id">): Promise<RoutineExercise>;
  updateExercise(
    id: string,
    changes: Partial<Omit<RoutineExercise, "id" | "routineId">>,
  ): Promise<void>;
  removeExercise(id: string): Promise<void>;
}

export interface WorkoutSessionRepository {
  start(routineId: string): Promise<WorkoutSession>;
  getActive(): Promise<WorkoutSession | null>;
  getById(id: string): Promise<WorkoutSession | null>;
  complete(id: string, notes: string | null): Promise<void>;
  discard(id: string): Promise<void>;
  deleteSession(id: string): Promise<void>;
  updateLastPosition(id: string, routineExerciseId: string): Promise<void>;
  logSet(set: Omit<SetLog, "id">): Promise<SetLog>;
  getHistory(limit?: number): Promise<WorkoutSession[]>;
  getSetLogsForSession(sessionId: string): Promise<SetLog[]>;
  getSetHistoryForExercise(exerciseId: string): Promise<SetLog[]>;
}

export interface ExerciseRepository {
  getAll(): Promise<Exercise[]>;
  getById(id: string): Promise<Exercise | null>;
  create(exercise: Omit<Exercise, "id">): Promise<Exercise>;
  update(id: string, changes: Partial<Omit<Exercise, "id">>): Promise<void>;
  delete(id: string): Promise<void>;
}

export type WeightUnit = "kg" | "lb";

export interface UserSettings {
  weightUnit: WeightUnit;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  notificationsEnabled: boolean;
  avatarUri: string | null;
}

export interface SettingsRepository {
  get(): Promise<UserSettings>;
  update(changes: Partial<UserSettings>): Promise<void>;
}

export type NutritionGoal = "deficit" | "bulk" | "maintenance";

export interface NutritionProfile {
  heightCm: number | null;
  currentWeightKg: number | null;
  targetWeightKg: number | null;
  goal: NutritionGoal | null;
  weightUnitOverride: WeightUnit | null;
  dailyCalorieTarget: number | null;
  dailyProteinG: number | null;
  dailyCarbsG: number | null;
  dailyFatG: number | null;
  weeklyBudget: number | null;
  currency: string; // código ISO, ej. "USD" — nunca un símbolo hardcodeado
  dietaryPreferences: string[];
  dietaryRestrictions: string[];
  updatedAt: string;
}

export type MealType = "breakfast" | "lunch" | "dinner" | "snack";
export type MealSource = "ai" | "manual";
export type MealAnalysisStatus = "pending" | "complete";

export interface MealLog {
  id: string;
  date: string; // YYYY-MM-DD, siempre vía getLocalDateString — nunca toISOString()
  mealType: MealType;
  photoUri: string | null; // null tras el borrado por retención (14 días) o si nunca hubo foto
  name: string;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  confidence: number | null; // 0-1, null si source === "manual"
  source: MealSource;
  // "pending": falló el análisis de Gemini — la fila existe (foto + macros
  // en 0) para no perder el registro, reintentable después (§5). Nunca se
  // crea directo en "complete" antes de que el usuario confirme.
  analysisStatus: MealAnalysisStatus;
  notes: string | null;
  createdAt: string;
}

export interface ShoppingListItem {
  name: string;
  qty: number;
  unit: string;
  estCost: number;
  checked: boolean;
}

export interface ShoppingList {
  id: string;
  weekStartDate: string; // YYYY-MM-DD, lunes de la semana
  items: ShoppingListItem[];
  estimatedTotal: number;
  currency: string;
  generatedAt: string;
}

export interface NutritionDayReport {
  date: string; // YYYY-MM-DD, PK
  reportText: string;
  generatedAt: string;
}

export interface NutritionProfileRepository {
  // null = todavía no se pasó por Ajustes de Nutrición — ver §9 "Condición única"
  get(): Promise<NutritionProfile | null>;
  update(changes: Partial<Omit<NutritionProfile, "updatedAt">>): Promise<void>;
}

export interface MealLogRepository {
  getByDate(date: string): Promise<MealLog[]>;
  getByDateRange(startDate: string, endDate: string): Promise<MealLog[]>;
  // Para el dashboard (paso 6): mostrar/reintentar comidas que quedaron sin
  // analizar por una falla previa.
  getPending(): Promise<MealLog[]>;
  create(meal: Omit<MealLog, "id" | "createdAt">): Promise<MealLog>;
  update(id: string, changes: Partial<Omit<MealLog, "id">>): Promise<void>;
  delete(id: string): Promise<void>;
  // Ver §5 "Retención de fotos" — borra archivo físico + limpia photoUri,
  // nunca toca los números.
  clearExpiredPhotos(olderThanDays: number): Promise<void>;
}

export interface ShoppingListRepository {
  getByWeek(weekStartDate: string): Promise<ShoppingList | null>;
  upsert(
    list: Omit<ShoppingList, "id"> & { id?: string },
  ): Promise<ShoppingList>;
  invalidateWeek(weekStartDate: string): Promise<void>; // borra la fila cacheada
}

export interface NutritionDayReportRepository {
  get(date: string): Promise<NutritionDayReport | null>;
  save(report: Omit<NutritionDayReport, "generatedAt">): Promise<void>;
  invalidate(date: string): Promise<void>; // borra la fila, no la marca (§3)
}
