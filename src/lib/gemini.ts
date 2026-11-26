// lib/gemini.ts
import "server-only";
import { GoogleGenAI } from "@google/genai";
import { GEMINI_API_KEY } from "./contants";

export const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

// Check AI Studio for the current free Flash model name before relying on this
export const GEMINI_MODEL = "gemini-3.8-flash";