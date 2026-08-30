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
};
