import { DEFAULT_THEME_ID, type Outline, type Slide, type ThemeId } from "@supergamma/schema";
import { create } from "zustand";
import { readSSE } from "../lib/sse";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

type Status = "idle" | "generating" | "done" | "error";

/**
 * A deck kept for the sidebar's "This session" list.
 *
 * Deliberately client-side. The API's deck store is a single in-memory Map
 * shared by every authenticated caller, so `GET /api/decks` would hand this
 * sidebar other people's decks. Until decks are persisted per user, the
 * honest scope for a history list is the tab it was generated in.
 */
export interface HistoryEntry {
  id: string;
  title: string;
  prompt: string;
  themeId: ThemeId;
  slides: Slide[];
  createdAt: string;
}

interface DeckState {
  status: Status;
  /** sparse, indexed by outline position — `slides` is this compacted */
  ordered: (Slide | undefined)[];
  prompt: string;
  deckTitle: string | null;
  expectedSlideCount: number;
  slides: Slide[];
  activeSlide: number;
  error: string | null;
  deckId: string | null;
  themeId: ThemeId;
  history: HistoryEntry[];
  setThemeId: (themeId: ThemeId) => void;
  generate: (prompt: string) => Promise<void>;
  setActiveSlide: (index: number) => void;
  /** clamped by slide count, for arrow keys and the stage's prev/next */
  stepSlide: (delta: number) => void;
  reset: () => void;
  openFromHistory: (id: string) => void;
}

export const useDeckStore = create<DeckState>((set, get) => ({
  status: "idle",
  ordered: [],
  prompt: "",
  deckTitle: null,
  expectedSlideCount: 0,
  slides: [],
  activeSlide: 0,
  error: null,
  deckId: null,
  themeId: DEFAULT_THEME_ID,
  history: [],

  setActiveSlide: (index) => set({ activeSlide: index }),
  // Re-theming the open deck also restyles its history entry, so reopening it
  // from the sidebar doesn't snap back to the theme it was generated with.
  setThemeId: (themeId) =>
    set((state) => ({
      themeId,
      history: state.deckId
        ? state.history.map((deck) => (deck.id === state.deckId ? { ...deck, themeId } : deck))
        : state.history,
    })),

  stepSlide: (delta) => {
    const { activeSlide, slides } = get();
    if (slides.length === 0) return;
    set({ activeSlide: Math.min(Math.max(activeSlide + delta, 0), slides.length - 1) });
  },

  /** Back to the composer. History is kept — that's the point of it. */
  reset: () =>
    set({
      status: "idle",
      ordered: [],
      prompt: "",
      deckTitle: null,
      expectedSlideCount: 0,
      slides: [],
      activeSlide: 0,
      error: null,
      deckId: null,
    }),

  openFromHistory: (id) => {
    const entry = get().history.find((deck) => deck.id === id);
    if (!entry) return;
    set({
      status: "done",
      ordered: entry.slides,
      prompt: entry.prompt,
      deckTitle: entry.title,
      expectedSlideCount: entry.slides.length,
      slides: entry.slides,
      activeSlide: 0,
      error: null,
      deckId: entry.id,
      themeId: entry.themeId,
    });
  },

  async generate(prompt: string) {
    set({
      status: "generating",
      ordered: [],
      prompt,
      deckTitle: null,
      expectedSlideCount: 0,
      slides: [],
      activeSlide: 0,
      error: null,
      deckId: null,
    });

    try {
      const res = await fetch(`${API_URL}/api/decks/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ prompt, themeId: get().themeId }),
      });
      if (res.status === 401) throw new Error("Sign in to generate a deck");
      if (!res.ok) throw new Error(`request failed: ${res.status}`);

      for await (const { event, data } of readSSE(res)) {
        if (event === "outline") {
          const outline = data as Outline;
          set({ deckTitle: outline.deckTitle, expectedSlideCount: outline.slides.length });
        } else if (event === "slide") {
          // Slides are generated in parallel, so events can land out of order.
          // Place each at its outline index and drop the gaps for display.
          const { index, slide } = data as { index: number; slide: Slide };
          const next = [...get().ordered];
          next[index] = slide;
          set({ ordered: next, slides: next.filter(Boolean) as Slide[] });
        } else if (event === "done") {
          const { deckId } = data as { deckId: string };
          const { slides, deckTitle, themeId, history } = get();
          set({
            status: "done",
            deckId,
            history: [
              {
                id: deckId,
                title: deckTitle ?? "Untitled deck",
                prompt,
                themeId,
                slides,
                createdAt: new Date().toISOString(),
              },
              ...history,
            ],
          });
        } else if (event === "error") {
          const { message } = data as { message: string };
          set({ status: "error", error: message });
        }
      }
    } catch (err) {
      set({ status: "error", error: err instanceof Error ? err.message : "generation failed" });
    }
  },
}));
