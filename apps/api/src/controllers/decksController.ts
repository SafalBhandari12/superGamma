import type { Request, Response } from "express";
import { z } from "zod";
import { generateDeck, getDeckById } from "../services/deckService.js";

const GenerateRequestSchema = z.object({
  prompt: z.string().min(3).max(500),
});

/**
 * `.parse()` (not `.safeParse()`) so a bad body throws a ZodError that
 * asyncHandler forwards to the global error handler — that's the only
 * validation step here that can still become an HTTP status, since it
 * runs before the SSE headers go out. Once streaming starts, a failure
 * can only be reported as an "error" event on the stream itself.
 */
export async function generateDeckHandler(req: Request, res: Response) {
  const { prompt } = GenerateRequestSchema.parse(req.body);

  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
  });
  const send = (event: string, data: unknown) => {
    res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
  };

  try {
    await generateDeck(prompt, ({ type, data }) => send(type, data));
  } catch (err) {
    send("error", { message: err instanceof Error ? err.message : "generation failed" });
  } finally {
    res.end();
  }
}

export async function getDeckHandler(req: Request, res: Response) {
  const deck = getDeckById(req.params.id);
  res.json(deck);
}
