import { useEffect, useMemo, useState } from "react";
import { SQLiteExerciseRepository } from "../../data/repositories/SQLiteExerciseRepository";
import { SQLiteRoutineRepository } from "../../data/repositories/SQLiteRoutineRepository";
import { SQLiteWorkoutSessionRepository } from "../../data/repositories/SQLiteWorkoutSessionRepository";
import type { Exercise, Routine, WorkoutSession } from "../../domain/entities";
import { getDayLabel } from "../../shared/constants/days";
import { getMuscleGroupLabel } from "../../shared/constants/muscleGroups";
import { formatShortDate } from "../../shared/utils/formatDate";

const exerciseRepo = new SQLiteExerciseRepository();
const routineRepo = new SQLiteRoutineRepository();
const sessionRepo = new SQLiteWorkoutSessionRepository();

export type SearchResultKind = "exercise" | "routine" | "session";

export interface SearchResult {
  kind: SearchResultKind;
  id: string;
  title: string;
  subtitle: string;
}

const MAX_RESULTS_PER_GROUP = 8;
const MIN_QUERY_LENGTH = 2;

export function useGlobalSearch() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [sessions, setSessions] = useState<WorkoutSession[]>([]);
  const [routineNameById, setRoutineNameById] = useState<Map<string, string>>(
    new Map(),
  );

  // Carga todo una sola vez al montar. El dataset de un usuario local (un
  // puñado de rutinas/ejercicios, cientos de sesiones como mucho) cabe
  // cómodo en memoria, así el filtrado por texto es instantáneo mientras
  // escribe, sin ir a SQLite en cada tecla.
  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    Promise.all([
      exerciseRepo.getAll(),
      routineRepo.getAll(),
      sessionRepo.getHistory(200),
    ]).then(([exerciseRows, routineRows, sessionRows]) => {
      if (cancelled) return;
      setExercises(exerciseRows);
      setRoutines(routineRows);
      setSessions(sessionRows.filter((s) => s.status === "completed"));
      setRoutineNameById(new Map(routineRows.map((r) => [r.id, r.name])));
      setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  const results = useMemo<SearchResult[]>(() => {
    const normalized = query.trim().toLowerCase();
    if (normalized.length < MIN_QUERY_LENGTH) return [];

    const exerciseResults: SearchResult[] = exercises
      .filter((e) => e.name.toLowerCase().includes(normalized))
      .slice(0, MAX_RESULTS_PER_GROUP)
      .map((e) => ({
        kind: "exercise" as const,
        id: e.id,
        title: e.name,
        subtitle: getMuscleGroupLabel(e.muscleGroup),
      }));

    const routineResults: SearchResult[] = routines
      .filter((r) => r.name.toLowerCase().includes(normalized))
      .slice(0, MAX_RESULTS_PER_GROUP)
      .map((r) => ({
        kind: "routine" as const,
        id: r.id,
        title: r.name,
        subtitle: getDayLabel(r.dayOfWeek),
      }));

    const sessionResults: SearchResult[] = sessions
      .filter((s) =>
        (routineNameById.get(s.routineId) ?? "")
          .toLowerCase()
          .includes(normalized),
      )
      .slice(0, MAX_RESULTS_PER_GROUP)
      .map((s) => ({
        kind: "session" as const,
        id: s.id,
        title: routineNameById.get(s.routineId) ?? "Rutina eliminada",
        subtitle: formatShortDate(s.date),
      }));

    return [...exerciseResults, ...routineResults, ...sessionResults];
  }, [query, exercises, routines, sessions, routineNameById]);

  return {
    query,
    setQuery,
    results,
    loading,
    hasMinLength: query.trim().length >= MIN_QUERY_LENGTH,
  };
}
