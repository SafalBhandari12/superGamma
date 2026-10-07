import "dotenv/config";

function required(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback;
  if (value === undefined) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value;
}

/**
 * Same env-var shape as greptileClone's src/config.ts: OPENAI_BASE_URL
 * pointed at an Azure OpenAI-compatible v1 endpoint, key sent both as
 * Bearer and as `api-key` (Azure wants the latter), OPENAI_MODEL set to
 * your Azure deployment name (not the underlying model id).
 */
export const config = {
  port: Number(process.env.PORT ?? 4000),
  openaiApiKey: required("OPENAI_API_KEY"),
  openaiBaseUrl: process.env.OPENAI_BASE_URL || undefined,
  openaiModel: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
  webOrigin: process.env.WEB_ORIGIN ?? "http://localhost:3000",

  /** Where this API itself is reachable — Better Auth needs it to build OAuth callback/redirect URLs. */
  apiBaseUrl: process.env.API_BASE_URL ?? `http://localhost:${Number(process.env.PORT ?? 4000)}`,

  databaseUrl: required("DATABASE_URL"),
  authSecret: required("BETTER_AUTH_SECRET"),
  googleClientId: required("GOOGLE_CLIENT_ID"),
  googleClientSecret: required("GOOGLE_CLIENT_SECRET"),

  mailerooApiKey: required("MAILEROO_API_KEY"),
  mailFromEmail: required("MAIL_FROM_EMAIL"),
  mailFromName: process.env.MAIL_FROM_NAME ?? "superGamma",

  /** Rolling-24h generation caps — see services/quotaService.ts. */
  dailyDeckLimitPerUser: Number(process.env.DAILY_DECK_LIMIT_PER_USER ?? 10),
  dailyDeckLimitGlobal: Number(process.env.DAILY_DECK_LIMIT_GLOBAL ?? 150),
};
