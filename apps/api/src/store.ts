import type { BentoDeck, Deck } from "@supergamma/schema";

/**
 * In-memory only. The MVP's job is to prove the generation pipeline,
 * not persistence — swap this for Postgres/Drizzle once decks need to
 * survive a server restart or be shared across requests.
 */
const decks = new Map<string, Deck>();

export const deckStore = {
  save(deck: Deck) {
    decks.set(deck.id, deck);
  },
  get(id: string): Deck | undefined {
    return decks.get(id);
  },
};

const bentoDecks = new Map<string, BentoDeck>();

export const bentoDeckStore = {
  save(deck: BentoDeck) {
    bentoDecks.set(deck.id, deck);
  },
  get(id: string): BentoDeck | undefined {
    return bentoDecks.get(id);
  },
  list(): BentoDeck[] {
    return [...bentoDecks.values()].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },
};
