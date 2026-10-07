import { OpenAI } from "openai";
import { config } from "../config.js";

export const openai = new OpenAI({
  apiKey: config.openaiApiKey,
  baseURL: config.openaiBaseUrl,
  // Azure's OpenAI-compatible v1 endpoint requires the key on `api-key`
  // as well as (or instead of) the SDK's default `Authorization: Bearer`.
  defaultHeaders: config.openaiBaseUrl ? { "api-key": config.openaiApiKey } : undefined,
});
