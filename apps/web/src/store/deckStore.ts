import { DEFAULT_THEME_ID, type Outline, type Slide, type ThemeId } from "@supergamma/schema";
import { create } from "zustand";
import { readSSE } from "../lib/sse";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

type Status = "idle" | "generating" | "done" | "error";

interface DeckState {
  status: Status;
  /** sparse, indexed by outline position — `slides` is this compacted */
  ordered: (Slide | undefined)[];
  deckTitle: string | null;
  expectedSlideCount: number;
  slides: Slide[];
  activeSlide: number;
  error: string | null;
  deckId: string | null;
  themeId: ThemeId;
  setThemeId: (themeId: ThemeId) => void;
  generate: (prompt: string) => Promise<void>;
  setActiveSlide: (index: number) => void;
}

export const useDeckStore = create<DeckState>((set, get) => ({
  status: "idle",
  ordered: [],
  deckTitle: null,
  expectedSlideCount: 0,
  slides: [],
  activeSlide: 0,
  error: null,
  deckId: null,
  themeId: DEFAULT_THEME_ID,

  setActiveSlide: (index) => set({ activeSlide: index }),
  setThemeId: (themeId) => set({ themeId }),

  async generate(prompt: string) {
    set({
      status: "generating",
      ordered: [],
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
        body: JSON.stringify({ prompt, themeId: get().themeId }),
      });
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
          set({ status: "done", deckId });
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
