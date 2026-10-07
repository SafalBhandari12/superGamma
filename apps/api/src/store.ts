import type { Deck } from "@supergamma/schema";
import { and, desc, eq } from "drizzle-orm";
import { db } from "./db/client.js";
import { deck } from "./db/schema.js";

/** Every read and write is scoped to the owning user, so one account can never see another's decks. */
export const deckStore = {
  async save(userId: string, value: Deck) {
    await db
      .insert(deck)
      .values({
        id: value.id,
        userId,
        title: value.title,
        prompt: value.prompt,
        data: value,
        createdAt: new Date(value.createdAt),
      })
      .onConflictDoUpdate({
        target: deck.id,
        set: { title: value.title, data: value },
        setWhere: eq(deck.userId, userId),
      });
  },
  async get(userId: string, id: string): Promise<Deck | undefined> {
    const [row] = await db
      .select({ data: deck.data })
      .from(deck)
      .where(and(eq(deck.id, id), eq(deck.userId, userId)));
    return row?.data;
  },
  async list(userId: string): Promise<Deck[]> {
    const rows = await db
      .select({ data: deck.data })
      .from(deck)
      .where(eq(deck.userId, userId))
      .orderBy(desc(deck.createdAt))
      .limit(100);
    return rows.map((row) => row.data);
  },
};
