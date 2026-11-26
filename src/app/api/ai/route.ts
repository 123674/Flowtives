import { NextResponse } from "next/server";
import type { Content } from "@google/genai";
import type { ChatCompletionMessageParam } from "openai/resources/chat/completions";
import { z } from "zod";
import type { Draft } from "@/app/calendar/lib";
import { functionDeclarations, openAiTools, runTool } from "@/lib/ai-tools";
import { ai as gemini, GEMINI_MODEL } from "@/lib/gemini";
import { getOpenRouterClient } from "@/lib/openrouter";
import { OPENROUTER_API_KEY, OPENROUTER_MODEL } from "@/lib/contants";

const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const eventSchema = z.object({
  id: z.string().min(1).max(100),
  title: z.string().max(120),
  date: dateSchema,
  start: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
  end: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
  description: z.string().max(1000),
  color: z.enum(["lavender", "mint", "blue", "peach"]),
});

const requestSchema = z.object({
  message: z.string().trim().min(1).max(4000),
  history: z
    .array(z.object({ role: z.enum(["user", "model"]), text: z.string().max(4000) }))
    .max(12)
    .default([]),
  events: z.array(eventSchema).max(500).default([]),
  today: dateSchema,
  timeZone: z.string().max(100),
});

type RequestData = z.infer<typeof requestSchema>;
type ProviderResult = { text: string; proposedEvents: Draft[] };

const MAX_TOOL_ROUNDS = 4;
const FALLBACK_TEXT = "I couldn't come up with a response. Please try again.";

const SYSTEM_INSTRUCTION = `
You are Flowtives AI, an assistant for planning a user's calendar.
Use get_my_events for questions about the user's events and inspect their schedule before proposing events when relevant.
Use create_event when the user asks to add or schedule an event. Creating an event only prepares a draft for the user to review; never claim it has been saved.
Use the provided current local date and time zone when interpreting relative dates. Ask a concise follow-up question if essential event details are missing.
Keep replies concise, conversational, and grounded in tool results. Never invent calendar events.
When the user asks about availability or free time, use bold day headings and short bullet lists. For example:
**Today (Nov 26)**
- Busy: 10:00–12:30 (Group study & Chemistry lab overlap), 17:00–19:45 (Badminton, review notes, dinner)
- Free: before 10:00, 12:30–17:00, after 19:45

**Tomorrow (Nov 27)**
- No events scheduled — fully free.
Put one blank line between days, keep each bullet on one line, and end with one short follow-up question. Avoid tables and long paragraphs.
`;

const systemInstruction = (today: string, timeZone: string) =>
  `${SYSTEM_INSTRUCTION}\nCurrent local date: ${today}. Time zone: ${timeZone}.`;

async function runOpenRouter({ message, history, events, today, timeZone }: RequestData): Promise<ProviderResult> {
  const client = getOpenRouterClient();
  if (!OPENROUTER_MODEL) throw new Error("OPENROUTER_MODEL is not configured.");

  const messages: ChatCompletionMessageParam[] = [
    { role: "system", content: systemInstruction(today, timeZone) },
    ...history.map(({ role, text }) => ({
      role: role === "model" ? ("assistant" as const) : ("user" as const),
      content: text,
    })),
    { role: "user", content: message },
  ];
  const proposedEvents: Draft[] = [];

  for (let round = 0; round < MAX_TOOL_ROUNDS; round += 1) {
    const completion = await client.chat.completions.create({
      model: OPENROUTER_MODEL,
      messages,
      tools: openAiTools,
      tool_choice: "auto",
      max_tokens: 1000,
    });

    const assistantMessage = completion.choices[0]?.message;
    if (!assistantMessage) throw new Error("OpenRouter returned no assistant message.");

    const calls = assistantMessage.tool_calls ?? [];
    if (calls.length === 0) {
      return {
        text: assistantMessage.content?.trim() || FALLBACK_TEXT,
        proposedEvents,
      };
    }

    messages.push({
      role: "assistant",
      content: assistantMessage.content,
      tool_calls: calls,
    });

    for (const call of calls) {
      if (call.type !== "function" || !call.function.name) {
        throw new Error("OpenRouter returned an unsupported tool call.");
      }

      let args: unknown;
      try {
        args = JSON.parse(call.function.arguments || "{}");
      } catch {
        throw new Error("OpenRouter returned invalid tool arguments.");
      }

      const output = await runTool(call.function.name, args, events);
      if (output.type === "event_proposal") proposedEvents.push(output.event);
      messages.push({
        role: "tool",
        tool_call_id: call.id,
        content: JSON.stringify(output),
      });
    }
  }

  throw new Error("The OpenRouter request exceeded the tool-call limit.");
}

async function runGemini({ message, history, events, today, timeZone }: RequestData): Promise<ProviderResult> {
  const contents: Content[] = [
    ...history.map(({ role, text }) => ({ role, parts: [{ text }] })),
    { role: "user", parts: [{ text: message }] },
  ];
  const proposedEvents: Draft[] = [];

  for (let round = 0; round < MAX_TOOL_ROUNDS; round += 1) {
    const response = await gemini.models.generateContent({
      model: GEMINI_MODEL,
      contents,
      config: {
        systemInstruction: systemInstruction(today, timeZone),
        maxOutputTokens: 1000,
        tools: [{ functionDeclarations }],
      },
    });

    const calls = response.functionCalls;
    if (!calls?.length) {
      return { text: response.text ?? FALLBACK_TEXT, proposedEvents };
    }

    const modelContent = response.candidates?.[0]?.content;
    if (!modelContent) throw new Error("Gemini returned tool calls without their conversation content.");
    contents.push(modelContent);

    const functionResponses = await Promise.all(
      calls.map(async (call) => {
        if (!call.name) throw new Error("Gemini returned a tool call without a name.");
        const output = await runTool(call.name, call.args, events);
        if (output.type === "event_proposal") proposedEvents.push(output.event);
        return {
          functionResponse: {
            name: call.name,
            ...(call.id ? { id: call.id } : {}),
            response: { output },
          },
        };
      }),
    );
    contents.push({ role: "user", parts: functionResponses });
  }

  throw new Error("The Gemini request exceeded the tool-call limit.");
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }

  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid AI request.", details: z.flattenError(parsed.error).fieldErrors },
      { status: 400 },
    );
  }

  const providers: Array<{ name: string; run: () => Promise<ProviderResult> }> = [];
  if (OPENROUTER_API_KEY && OPENROUTER_MODEL) {
    providers.push({ name: "OpenRouter", run: () => runOpenRouter(parsed.data) });
  }
  providers.push({ name: "Gemini", run: () => runGemini(parsed.data) });

  for (const provider of providers) {
    try {
      return NextResponse.json(await provider.run());
    } catch (error) {
      console.error(`${provider.name} AI request failed`, error);
    }
  }

  return NextResponse.json({ error: "The AI request failed. Please try again." }, { status: 502 });
}
