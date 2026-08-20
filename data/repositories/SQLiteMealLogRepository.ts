import { and, eq, gte, lte } from "drizzle-orm";
import { randomUUID } from "expo-crypto";
import { File } from "expo-file-system";
import type {
  MealAnalysisStatus,
  MealLog,
  MealLogRepository,
  MealSource,
  MealType,
} from "../../domain/entities";
import { mealLogs } from "../../drizzle/schema";
import { db } from "../db/client";
import { SQLiteNutritionDayReportRepository } from "./SQLiteNutritionDayReportRepository";

// Regla de invalidación del morning briefing (§9, "sin excepciones"): si se
// edita, borra o agrega un mealLog de una fecha cuyo reporte de IA ya
// estaba cacheado, ese reporte se invalida — centralizado acá (no en cada
// call site) para que sea imposible de olvidar, mismo criterio que ya se
// usó con el borrado de fotos huérfanas.
const dayReportRepo = new SQLiteNutritionDayReportRepository();

function toDomain(r: typeof mealLogs.$inferSelect): MealLog {
  return {
    id: r.id,
    date: r.date,
    mealType: r.mealType as MealType,
    photoUri: r.photoUri,
    name: r.name,
    calories: r.calories,
    proteinG: r.proteinG,
    carbsG: r.carbsG,
    fatG: r.fatG,
    confidence: r.confidence,
    source: r.source as MealSource,
    analysisStatus: r.analysisStatus as MealAnalysisStatus,
    notes: r.notes,
    createdAt: r.createdAt,
  };
}

export class SQLiteMealLogRepository implements MealLogRepository {
  async getByDate(date: string): Promise<MealLog[]> {
    const rows = await db
      .select()
      .from(mealLogs)
      .where(eq(mealLogs.date, date));
    return rows.map(toDomain);
  }

  async getPending(): Promise<MealLog[]> {
    const rows = await db
      .select()
      .from(mealLogs)
      .where(eq(mealLogs.analysisStatus, "pending"));
    return rows.map(toDomain);
  }

  async getByDateRange(startDate: string, endDate: string): Promise<MealLog[]> {
    const rows = await db
      .select()
      .from(mealLogs)
      .where(and(gte(mealLogs.date, startDate), lte(mealLogs.date, endDate)));
    return rows.map(toDomain);
  }

  async create(meal: Omit<MealLog, "id" | "createdAt">): Promise<MealLog> {
    const id = randomUUID();
    const createdAt = new Date().toISOString();
    await db.insert(mealLogs).values({
      id,
      date: meal.date,
      mealType: meal.mealType,
      photoUri: meal.photoUri,
      name: meal.name,
      calories: meal.calories,
      proteinG: meal.proteinG,
      carbsG: meal.carbsG,
      fatG: meal.fatG,
      confidence: meal.confidence,
      source: meal.source,
      analysisStatus: meal.analysisStatus,
      notes: meal.notes,
      createdAt,
    });
    await dayReportRepo.invalidate(meal.date);
    return { id, createdAt, ...meal };
  }

  async update(
    id: string,
    changes: Partial<Omit<MealLog, "id">>,
  ): Promise<void> {
    const rows = await db.select().from(mealLogs).where(eq(mealLogs.id, id));
    const currentDate = rows[0]?.date;
    await db.update(mealLogs).set(changes).where(eq(mealLogs.id, id));
    // Invalida tanto la fecha vieja como la nueva por si `date` cambió
    // (no debería pasar en el flujo normal, pero es más seguro que asumir).
    if (currentDate) await dayReportRepo.invalidate(currentDate);
    if (changes.date && changes.date !== currentDate) {
      await dayReportRepo.invalidate(changes.date);
    }
  }

  // Fix del paso 6: swipe-to-delete en el dashboard borraba la fila pero
  // dejaba la foto huérfana en disco para siempre — clearExpiredPhotos
  // (paso 5d) solo barre fotos de filas que TODAVÍA existen en la tabla,
  // así que una fila ya borrada nunca iba a pasar por esa limpieza. Se
  // borra el archivo físico acá también, mismo patrón que ya usa
  // clearExpiredPhotos.
  async delete(id: string): Promise<void> {
    const rows = await db.select().from(mealLogs).where(eq(mealLogs.id, id));
    const photoUri = rows[0]?.photoUri;
    const date = rows[0]?.date;
    if (photoUri) {
      try {
        const file = new File(photoUri);
        if (file.exists) {
          file.delete();
        }
      } catch {
        // el archivo puede ya no existir; igual borramos la fila
      }
    }
    await db.delete(mealLogs).where(eq(mealLogs.id, id));
    if (date) await dayReportRepo.invalidate(date);
  }

  // Ver §5 "Retención de fotos": borra el archivo físico y limpia photoUri
  // en mealLogs con más de `olderThanDays` días. Los números
  // (calories/proteinG/carbsG/fatG/name) nunca se tocan, solo la foto.
  async clearExpiredPhotos(olderThanDays: number): Promise<void> {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - olderThanDays);
    const cutoffIso = cutoff.toISOString();

    const rows = await db.select().from(mealLogs);
    const expired = rows.filter(
      (r) => r.photoUri !== null && r.createdAt < cutoffIso,
    );

    for (const row of expired) {
      if (row.photoUri) {
        try {
          const file = new File(row.photoUri);
          if (file.exists) {
            file.delete();
          }
        } catch {
          // el archivo puede ya no existir; igual limpiamos la referencia
        }
      }
      await db
        .update(mealLogs)
        .set({ photoUri: null })
        .where(eq(mealLogs.id, row.id));
    }
  }
}
