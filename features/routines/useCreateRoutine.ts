import { useState } from "react";
import { SQLiteRoutineRepository } from "../../data/repositories/SQLiteRoutineRepository";

const routineRepo = new SQLiteRoutineRepository();

export function useCreateRoutine() {
  const [creating, setCreating] = useState(false);

  async function createRoutine(name: string, dayOfWeek: number | null) {
    setCreating(true);
    try {
      return await routineRepo.create({ name, dayOfWeek });
    } finally {
      setCreating(false);
    }
  }

  return { createRoutine, creating };
}
