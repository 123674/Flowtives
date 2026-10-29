// lib/gemini.ts
import "server-only";
import { GoogleGenAI } from "@google/genai";

export const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

// Check AI Studio for the current free Flash model name before relying on this
export const GEMINI_MODEL = "gemini-2.5-flash";