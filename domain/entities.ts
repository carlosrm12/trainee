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
}

export interface SettingsRepository {
  get(): Promise<UserSettings>;
  update(changes: Partial<UserSettings>): Promise<void>;
}
