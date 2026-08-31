import { DEFAULT_THEME_ID, THEMES, THEME_IDS, ThemeIdSchema } from "@supergamma/schema";
import type { Request, Response } from "express";
import { z } from "zod";
import { generateDeck, getDeckById, retheme } from "../services/deckService.js";
import { deckStore } from "../store.js";

const GenerateRequestSchema = z.object({
  prompt: z.string().min(3).max(2000),
  themeId: ThemeIdSchema.default(DEFAULT_THEME_ID),
});

/**
 * `.parse()` (not `.safeParse()`) so a bad body throws a ZodError that
 * asyncHandler forwards to the global error handler — that's the only
 * validation step here that can still become an HTTP status, since it runs
 * before the SSE headers go out. Once streaming starts, a failure can only
 * be reported as an "error" event on the stream itself.
 */
export async function generateDeckHandler(req: Request, res: Response) {
  const { prompt, themeId } = GenerateRequestSchema.parse(req.body);

  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
  });
  const send = (event: string, data: unknown) => {
    res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
  };

  try {
    await generateDeck(prompt, themeId, ({ type, data }) => send(type, data));
  } catch (err) {
    send("error", { message: err instanceof Error ? err.message : "generation failed" });
  } finally {
    res.end();
  }
}

export async function getDeckHandler(req: Request, res: Response) {
  res.json(getDeckById(req.params.id));
}

export async function listDecksHandler(_req: Request, res: Response) {
  res.json(
    deckStore.list().map(({ id, title, prompt, createdAt, theme, slides }) => ({
      id,
      title,
      prompt,
      createdAt,
      themeId: theme.id,
      slideCount: slides.length,
    }))
  );
}

const RethemeRequestSchema = z.object({ themeId: ThemeIdSchema });

/** Swapping themes never touches content, so it's a plain mutation — no LLM call. */
export async function rethemeDeckHandler(req: Request, res: Response) {
  const { themeId } = RethemeRequestSchema.parse(req.body);
  res.json(retheme(req.params.id, themeId));
}

export async function listThemesHandler(_req: Request, res: Response) {
  res.json(
    THEME_IDS.map((id) => ({
      id,
      name: THEMES[id].name,
      mode: THEMES[id].mode,
      canvas: THEMES[id].colors.canvas,
      tones: THEMES[id].colors.tones,
    }))
  );
}
