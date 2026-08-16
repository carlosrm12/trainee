import { eq } from "drizzle-orm";
import { randomUUID } from "expo-crypto";
import type {
  ShoppingList,
  ShoppingListItem,
  ShoppingListRepository,
} from "../../domain/entities";
import { shoppingLists } from "../../drizzle/schema";
import { db } from "../db/client";

function toDomain(r: typeof shoppingLists.$inferSelect): ShoppingList {
  let items: ShoppingListItem[] = [];
  try {
    const parsed = JSON.parse(r.itemsJson);
    items = Array.isArray(parsed) ? parsed : [];
  } catch {
    items = [];
  }
  return {
    id: r.id,
    weekStartDate: r.weekStartDate,
    items,
    estimatedTotal: r.estimatedTotal,
    currency: r.currency,
    generatedAt: r.generatedAt,
  };
}

export class SQLiteShoppingListRepository implements ShoppingListRepository {
  async getByWeek(weekStartDate: string): Promise<ShoppingList | null> {
    const rows = await db
      .select()
      .from(shoppingLists)
      .where(eq(shoppingLists.weekStartDate, weekStartDate));
    const r = rows[0];
    return r ? toDomain(r) : null;
  }

  // Cache por semana (§3/§11): si ya existe fila para weekStartDate la
  // reemplaza entera; no hay "update parcial" acá, cada generación reescribe
  // la lista completa.
  async upsert(
    list: Omit<ShoppingList, "id"> & { id?: string },
  ): Promise<ShoppingList> {
    const existing = await this.getByWeek(list.weekStartDate);
    const id = existing?.id ?? list.id ?? randomUUID();
    const itemsJson = JSON.stringify(list.items);

    if (existing) {
      await db
        .update(shoppingLists)
        .set({
          itemsJson,
          estimatedTotal: list.estimatedTotal,
          currency: list.currency,
          generatedAt: list.generatedAt,
        })
        .where(eq(shoppingLists.id, id));
    } else {
      await db.insert(shoppingLists).values({
        id,
        weekStartDate: list.weekStartDate,
        itemsJson,
        estimatedTotal: list.estimatedTotal,
        currency: list.currency,
        generatedAt: list.generatedAt,
      });
    }

    return { id, ...list };
  }

  async invalidateWeek(weekStartDate: string): Promise<void> {
    await db
      .delete(shoppingLists)
      .where(eq(shoppingLists.weekStartDate, weekStartDate));
  }
}
