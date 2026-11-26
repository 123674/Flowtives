import "server-only";
import { Type, type FunctionDeclaration } from "@google/genai";
import type { ChatCompletionTool } from "openai/resources/chat/completions";
import { z } from "zod";
import type { CalEvent, Draft } from "@/app/calendar/lib";

const eventFields = ["title", "description", "date", "start", "end"] as const;
const eventColors = ["lavender", "mint", "blue", "peach"] as const;

export const functionDeclarations: FunctionDeclaration[] = [
  {
    name: "get_my_events",
    description:
      "Find events in the current user's calendar. Use this before answering questions about their schedule.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        limit: {
          type: Type.INTEGER,
          description: "Maximum number of matching events to return, from 1 to 50.",
        },
        startDate: {
          type: Type.STRING,
          description: "Optional inclusive start date in YYYY-MM-DD format.",
        },
        endDate: {
          type: Type.STRING,
          description: "Optional inclusive end date in YYYY-MM-DD format.",
        },
        query: {
          type: Type.STRING,
          description: "Optional case-insensitive keyword in the event title or description.",
        },
        fields: {
          type: Type.ARRAY,
          items: { type: Type.STRING, enum: [...eventFields] },
          description: "Event fields to return. Defaults to all fields.",
        },
      },
    },
  },
  {
    name: "create_event",
    description:
      "Prepare a new calendar event for the user to review and save. Do not claim it was saved; the user must confirm it in the calendar.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        title: { type: Type.STRING, description: "Short event title." },
        date: { type: Type.STRING, description: "Event date in YYYY-MM-DD format." },
        start: { type: Type.STRING, description: "Start time in 24-hour HH:MM format." },
        end: { type: Type.STRING, description: "End time in 24-hour HH:MM format." },
        description: { type: Type.STRING, description: "Optional event description." },
        color: {
          type: Type.STRING,
          enum: [...eventColors],
          description: "Calendar color. Use lavender if unspecified.",
        },
      },
      required: ["title", "date", "start", "end"],
    },
  },
];

// OpenRouter speaks the OpenAI-compatible chat completions tool format.
// Both tool lists feed the same runTool implementation below.
export const openAiTools: ChatCompletionTool[] = [
  {
    type: "function",
    function: {
      name: "get_my_events",
      description:
        "Find events in the current user's calendar. Use this before answering questions about their schedule.",
      parameters: {
        type: "object",
        properties: {
          limit: {
            type: "integer",
            description: "Maximum number of matching events to return, from 1 to 50.",
          },
          startDate: {
            type: "string",
            description: "Optional inclusive start date in YYYY-MM-DD format.",
          },
          endDate: {
            type: "string",
            description: "Optional inclusive end date in YYYY-MM-DD format.",
          },
          query: {
            type: "string",
            description: "Optional case-insensitive keyword in the event title or description.",
          },
          fields: {
            type: "array",
            items: { type: "string", enum: [...eventFields] },
            description: "Event fields to return. Defaults to all fields.",
          },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "create_event",
      description:
        "Prepare a new calendar event for the user to review and save. Do not claim it was saved; the user must confirm it in the calendar.",
      parameters: {
        type: "object",
        properties: {
          title: { type: "string", description: "Short event title." },
          date: { type: "string", description: "Event date in YYYY-MM-DD format." },
          start: { type: "string", description: "Start time in 24-hour HH:MM format." },
          end: { type: "string", description: "End time in 24-hour HH:MM format." },
          description: { type: "string", description: "Optional event description." },
          color: {
            type: "string",
            enum: [...eventColors],
            description: "Calendar color. Use lavender if unspecified.",
          },
        },
        required: ["title", "date", "start", "end"],
      },
    },
  },
];

const dateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine((value) => {
    const date = new Date(`${value}T00:00:00Z`);
    return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
  }, "Expected a valid calendar date.");
const timeSchema = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/);

const getMyEventsArgs = z.object({
  limit: z.number().int().min(1).max(50).default(10),
  startDate: dateSchema.optional(),
  endDate: dateSchema.optional(),
  query: z.string().trim().max(200).optional(),
  fields: z.array(z.enum(eventFields)).min(1).default([...eventFields]),
});

const createEventArgs = z
  .object({
    title: z.string().trim().min(1).max(120),
    date: dateSchema,
    start: timeSchema,
    end: timeSchema,
    description: z.string().trim().max(1000).default(""),
    color: z.enum(eventColors).default("lavender"),
  })
  .refine((event) => event.end > event.start, {
    message: "The event end time must be after its start time.",
    path: ["end"],
  });

export async function runTool(name: string, args: unknown, events: CalEvent[]) {
  switch (name) {
    case "get_my_events": {
      const parsed = getMyEventsArgs.parse(args ?? {});
      if (parsed.startDate && parsed.endDate && parsed.startDate > parsed.endDate) {
        throw new Error("startDate must be on or before endDate.");
      }

      const query = parsed.query?.toLocaleLowerCase();
      const matchingEvents = events.filter((event) => {
        if (parsed.startDate && event.date < parsed.startDate) return false;
        if (parsed.endDate && event.date > parsed.endDate) return false;
        if (query && !`${event.title} ${event.description}`.toLocaleLowerCase().includes(query)) {
          return false;
        }
        return true;
      });

      return {
        type: "events" as const,
        events: matchingEvents.slice(0, parsed.limit).map((event) =>
          Object.fromEntries(parsed.fields.map((field) => [field, event[field]])),
        ),
        total: matchingEvents.length,
      };
    }
    case "create_event": {
      const parsed = createEventArgs.parse(args ?? {});
      const event: Draft = {
        ...parsed,
        description: parsed.description,
        color: parsed.color,
      };
      return { type: "event_proposal" as const, event };
    }
    default:
      throw new Error(`Unknown AI tool: ${name}`);
  }
}
