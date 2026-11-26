import { z } from "zod";
import type { EventColor } from "@/app/calendar/lib";

export interface TimetableSlot {
  weekday: number; // 0 = Sunday, 1 = Monday, ...
  title: string;
  start: string;
  end: string;
  description: string;
  color: EventColor;
}

const WEEKDAYS = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
const HOUR_MINUTE = /^([01]\d|2[0-3]):[0-5]\d$/;
const COLORS: EventColor[] = ["lavender", "mint", "blue", "peach"];

/** Accept both "09:00" and "9:00 AM" from the model. */
export function normalizeTime(value: string): string {
  const raw = value.trim().replace(/\s+/g, " ").toUpperCase();
  const match = /^(\d{1,2})(?::(\d{2}))?\s*(AM|PM)?$/.exec(raw);
  if (!match) return raw;

  let hour = Number(match[1]);
  const minute = match[2] ?? "00";
  const meridiem = match[3];
  if (meridiem) {
    if (hour < 1 || hour > 12) return raw;
    hour = (hour % 12) + (meridiem === "PM" ? 12 : 0);
  }
  return `${String(hour).padStart(2, "0")}:${minute}`;
}

export const TIMETABLE_EXTRACTION_PROMPT = `You read a class timetable from an image or PDF and return the weekly schedule as JSON.

Respond with JSON only. No markdown fences, no commentary.

Use exactly this shape:
{
  "days": [
    {
      "day": "Monday",
      "classes": [
        { "title": "Biology lecture", "start": "09:00", "end": "10:30", "location": "Room 204" }
      ]
    }
  ]
}

Rules:
- Use 24-hour HH:MM times, for example 13:30, not 1:30 PM.
- Include only real scheduled classes, lectures, labs and tutorials. Ignore headings, holidays, breaks, notes and free periods.
- Include only days that actually have classes, and use full weekday names.
- Keep titles short (under 60 characters). Put the room or teacher in "location" when present.
- If a start or end time is unclear, skip that class. Never invent a class or a time.
- If no timetable can be read, return {"days": []}.`;

const entrySchema = z.object({
  title: z.string().max(120).nullish(),
  subject: z.string().max(120).nullish(),
  name: z.string().max(120).nullish(),
  start: z.string().max(30).nullish(),
  end: z.string().max(30).nullish(),
  location: z.string().max(200).nullish(),
  description: z.string().max(300).nullish(),
});

const responseSchema = z.object({
  days: z
    .array(
      z.object({
        day: z.string().max(40).nullish(),
        classes: z.array(entrySchema).max(20).optional().default([]),
        entries: z.array(entrySchema).max(20).optional().default([]),
      }),
    )
    .max(7),
});

/** Parse and sanitize the model's JSON into calendar-ready weekly slots. */
export function parseTimetableResponse(raw: string): TimetableSlot[] {
  const withoutFences = raw
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/```\s*$/, "")
    .trim();
  const start = withoutFences.indexOf("{");
  const end = withoutFences.lastIndexOf("}");
  if (start === -1 || end <= start) throw new Error("Timetable response was not JSON.");

  const parsed = responseSchema.safeParse(JSON.parse(withoutFences.slice(start, end + 1)));
  if (!parsed.success) throw new Error("Timetable response had an unexpected shape.");

  const slots: TimetableSlot[] = [];
  const seen = new Set<string>();

  for (const day of parsed.data.days) {
    const name = (day.day ?? "").trim().toLowerCase().replace(/\.$/, "");
    const exact = WEEKDAYS.indexOf(name);
    const weekday = exact === -1 && name.length >= 3
      ? WEEKDAYS.findIndex((value) => value.startsWith(name.slice(0, 3)))
      : exact;
    if (weekday === -1) continue;

    for (const entry of [...day.classes, ...day.entries]) {
      const title = (entry.title ?? entry.subject ?? entry.name ?? "").trim();
      const start = normalizeTime(entry.start ?? "");
      const end = normalizeTime(entry.end ?? "");
      if (!title || !HOUR_MINUTE.test(start) || !HOUR_MINUTE.test(end) || end <= start) continue;

      const key = `${weekday}|${title.toLowerCase()}|${start}|${end}`;
      if (seen.has(key)) continue;
      seen.add(key);

      const description = [entry.location, entry.description]
        .map((value) => value?.trim())
        .filter(Boolean)
        .join(" · ");
      slots.push({
        weekday,
        title,
        start,
        end,
        description,
        color: COLORS[slots.length % COLORS.length],
      });
    }
  }

  if (!slots.length) throw new Error("No readable classes were found in the timetable.");
  return slots;
}
