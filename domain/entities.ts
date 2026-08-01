// Entidades puras del dominio — sin dependencias de RN, SQLite ni Drizzle.
// La UI y los repositorios se apoyan en estos tipos, nunca al revés.

export type MuscleGroup = "chest" | "back" | "legs" | "shoulders" | "arms" | "core";

export interface Exercise {
  id: string;
  name: string;
  muscleGroup: MuscleGroup;
  isCustom: boolean;
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
}

export interface SetLog {
  id: string;
  sessionId: string;
  routineExerciseId: string;
  setNumber: number;
  weightKg: number;
  reps: number;
}

// Contrato que cualquier repositorio (SQLite hoy, API mañana) debe cumplir.
export interface RoutineRepository {
  getAll(): Promise<Routine[]>;
  getById(id: string): Promise<Routine | null>;
  getExercises(routineId: string): Promise<RoutineExercise[]>;
  create(routine: Omit<Routine, "id">): Promise<Routine>;
  update(id: string, changes: Partial<Omit<Routine, "id">>): Promise<void>;
  delete(id: string): Promise<void>;
}

export interface WorkoutSessionRepository {
  start(routineId: string): Promise<WorkoutSession>;
  getActive(): Promise<WorkoutSession | null>;
  complete(id: string, notes: string | null): Promise<void>;
  discard(id: string): Promise<void>;
  logSet(set: Omit<SetLog, "id">): Promise<SetLog>;
  getHistory(limit?: number): Promise<WorkoutSession[]>;
  getSetHistoryForExercise(exerciseId: string): Promise<SetLog[]>;
}
