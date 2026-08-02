import { randomUUID } from "expo-crypto";
import { exercises, routineExercises, routines } from "../drizzle/schema";
import { db } from "./db/client";
import seedData from "./seed/rutina-seed-lunes-viernes.json";

export async function seedInitialData(): Promise<void> {
  const existing = await db.select().from(routines).limit(1);
  if (existing.length > 0) return;

  for (const ex of seedData.exercises) {
    await db.insert(exercises).values({
      id: ex.id,
      name: ex.name,
      muscleGroup: ex.muscleGroup,
      isCustom: false,
    });
  }

  for (const routine of seedData.routines) {
    const routineId = routine.id;
    await db.insert(routines).values({
      id: routineId,
      name: routine.name,
      dayOfWeek: routine.dayOfWeek,
    });

    for (const re of routine.exercises) {
      await db.insert(routineExercises).values({
        id: randomUUID(),
        routineId,
        exerciseId: re.exerciseId,
        order: re.order,
        restSeconds: re.restSeconds,
        targetSets: re.targetSets,
        repMin: re.repMin,
        repMax: re.repMax,
      });
    }
  }
}
