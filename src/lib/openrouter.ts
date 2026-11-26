// lib/openrouter.ts
import "server-only";
import OpenAI from "openai";
import { OPENROUTER_API_KEY } from "./contants";

const OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1";

let client: OpenAI | undefined;

export function getOpenRouterClient(): OpenAI {
  if (!OPENROUTER_API_KEY) {
    throw new Error("OPENROUTER_API_KEY is not configured.");
  }

  client ??= new OpenAI({
    apiKey: OPENROUTER_API_KEY,
    baseURL: OPENROUTER_BASE_URL,
    timeout: 20_000,
    maxRetries: 0,
  });

  return client;
}
