import { NextResponse } from "next/server";
import type { ChatCompletionMessageParam } from "openai/resources/chat/completions";
import { OPENROUTER_API_KEY, OPENROUTER_VISION_MODEL } from "@/lib/contants";
import { ai as gemini, GEMINI_MODEL } from "@/lib/gemini";
import { getOpenRouterClient } from "@/lib/openrouter";
import {
  parseTimetableResponse,
  TIMETABLE_EXTRACTION_PROMPT,
  type TimetableSlot,
} from "@/lib/timetable";

const ALLOWED_TYPES = new Set(["application/pdf", "image/png", "image/jpeg", "image/webp", "image/gif"]);
const MAX_BYTES = 10 * 1024 * 1024;
const EXTRACT_PROMPT = "Extract the weekly class timetable from this file. Return JSON only.";

async function runOpenRouter(base64: string, mimeType: string, filename: string): Promise<TimetableSlot[]> {
  if (!OPENROUTER_API_KEY || !OPENROUTER_VISION_MODEL) {
    throw new Error("OpenRouter vision model is not configured.");
  }

  const dataUrl = `data:${mimeType};base64,${base64}`;
  // OpenRouter adds the `file` content part for PDFs; cast it into the
  // OpenAI-compatible shape used by the client.
  const filePart = mimeType === "application/pdf"
    ? { type: "file", file: { filename, file_data: dataUrl } }
    : { type: "image_url", image_url: { url: dataUrl } };

  const messages = [
    { role: "system", content: TIMETABLE_EXTRACTION_PROMPT },
    {
      role: "user",
      content: [
        { type: "text", text: EXTRACT_PROMPT },
        filePart,
      ],
    },
  ] as unknown as ChatCompletionMessageParam[];

  const completion = await getOpenRouterClient().chat.completions.create({
    model: OPENROUTER_VISION_MODEL,
    messages,
    ...(mimeType === "application/pdf" ? { plugins: [{ id: "file-parser", pdf: { engine: "cloudflare-ai" } }] } : {}),
    response_format: { type: "json_object" },
    max_tokens: 2500,
    temperature: 0,
  });

  const text = completion.choices[0]?.message?.content;
  if (!text) throw new Error("OpenRouter returned no timetable.");
  return parseTimetableResponse(text);
}

async function runGemini(base64: string, mimeType: string): Promise<TimetableSlot[]> {
  const response = await gemini.models.generateContent({
    model: GEMINI_MODEL,
    contents: [{ inlineData: { mimeType, data: base64 } }, { text: TIMETABLE_EXTRACTION_PROMPT }],
    config: {
      responseMimeType: "application/json",
      maxOutputTokens: 4096,
      temperature: 0,
    },
  });

  if (!response.text) throw new Error("Gemini returned no timetable.");
  return parseTimetableResponse(response.text);
}

export async function POST(request: Request) {
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ error: "Upload a PDF or image file." }, { status: 400 });
  }

  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No timetable file was uploaded." }, { status: 400 });
  }
  if (!ALLOWED_TYPES.has(file.type)) {
    return NextResponse.json(
      { error: "Use a PDF, PNG, JPEG, WEBP or GIF timetable." },
      { status: 415 },
    );
  }
  if (file.size > MAX_BYTES) {
    const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
    console.warn("Timetable upload rejected for size", { name: file.name, bytes: file.size, type: file.type });
    return NextResponse.json(
      { error: `This timetable is ${sizeMb} MB. Upload a file under 10 MB.` },
      { status: 413 },
    );
  }

  try {
    const base64 = Buffer.from(await file.arrayBuffer()).toString("base64");
    const providers: Array<{ name: string; run: () => Promise<TimetableSlot[]> }> = [];

    // OpenRouter is tried first for both images and PDFs when a vision model is
    // configured; Gemini remains the fallback if OpenRouter fails.
    if (OPENROUTER_API_KEY && OPENROUTER_VISION_MODEL) {
      providers.push({ name: "OpenRouter", run: () => runOpenRouter(base64, file.type, file.name) });
    }
    providers.push({ name: "Gemini", run: () => runGemini(base64, file.type) });

    for (const provider of providers) {
      try {
        return NextResponse.json({ slots: await provider.run() });
      } catch (error) {
        console.error(`${provider.name} timetable extraction failed`, error);
      }
    }

    return NextResponse.json(
      { error: "I couldn't read a timetable from that file. Try a clearer PDF or image." },
      { status: 502 },
    );
  } catch (error) {
    console.error("Timetable request failed", error);
    return NextResponse.json({ error: "The timetable could not be processed. Please try again." }, { status: 500 });
  }
}
