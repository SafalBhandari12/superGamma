import { and, count, eq, gt } from "drizzle-orm";
import { config } from "../config.js";
import { db } from "../db/client.js";
import { generationLog } from "../db/schema.js";
import { AppError } from "../errors/AppError.js";

const DAY_MS = 24 * 60 * 60 * 1000;

export class QuotaExceededError extends AppError {
  constructor(message: string) {
    super(429, message);
    this.name = "QuotaExceededError";
  }
}

/**
 * Rolling 24h caps on LLM spend: one per user, one across the whole app (so a
 * wave of fresh sign-ups can't run up the bill either). Records the attempt
 * up front, so a generation that later fails still counts.
 */
export async function claimGeneration(userId: string): Promise<void> {
  const since = new Date(Date.now() - DAY_MS);

  const [[mine], [everyone]] = await Promise.all([
    db
      .select({ n: count() })
      .from(generationLog)
      .where(and(eq(generationLog.userId, userId), gt(generationLog.createdAt, since))),
    db.select({ n: count() }).from(generationLog).where(gt(generationLog.createdAt, since)),
  ]);

  if (mine.n >= config.dailyDeckLimitPerUser) {
    throw new QuotaExceededError(
      `You've hit today's limit of ${config.dailyDeckLimitPerUser} decks. Try again tomorrow.`
    );
  }
  if (everyone.n >= config.dailyDeckLimitGlobal) {
    throw new QuotaExceededError("superGamma has hit its daily generation limit. Try again tomorrow.");
  }

  await db.insert(generationLog).values({ userId });
}
