import { eq } from "drizzle-orm";
import type {
  NutritionDayReport,
  NutritionDayReportRepository,
} from "../../domain/entities";
import { nutritionDayReports } from "../../drizzle/schema";
import { db } from "../db/client";

export class SQLiteNutritionDayReportRepository implements NutritionDayReportRepository {
  async get(date: string): Promise<NutritionDayReport | null> {
    const rows = await db
      .select()
      .from(nutritionDayReports)
      .where(eq(nutritionDayReports.date, date));
    const r = rows[0];
    return r
      ? { date: r.date, reportText: r.reportText, generatedAt: r.generatedAt }
      : null;
  }

  async save(report: Omit<NutritionDayReport, "generatedAt">): Promise<void> {
    const generatedAt = new Date().toISOString();
    const existing = await this.get(report.date);
    if (existing) {
      await db
        .update(nutritionDayReports)
        .set({ reportText: report.reportText, generatedAt })
        .where(eq(nutritionDayReports.date, report.date));
      return;
    }
    await db.insert(nutritionDayReports).values({
      date: report.date,
      reportText: report.reportText,
      generatedAt,
    });
  }

  // Se BORRA la fila, no se marca como inválida — "no hay fila" es
  // directamente la señal de "hay que regenerar" (§3).
  async invalidate(date: string): Promise<void> {
    await db
      .delete(nutritionDayReports)
      .where(eq(nutritionDayReports.date, date));
  }
}
