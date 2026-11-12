// lib/ai-tools.ts
import "server-only";
import { Type, type FunctionDeclaration } from "@google/genai";
import { z } from "zod";

export const functionDeclarations: FunctionDeclaration[] = [
  {
    name: "get_my_events",
    description: "List events the current user registered for.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        limit: {
          type: Type.INTEGER,
          description:
            "Maximum results to return, between 1 and 20. Default to 10 if not specified.",
        },
        date: {
          type: Type.STRING,
          description:
            "Date range in the format YYYY-MM-DD-HH:MM->YYYY-MM-DD-HH:MM-. Use 'all' if no date range is specified.",
        },
        fields: {
          type: Type.ARRAY,
          items: {
            type: Type.STRING,
            enum: ["title", "description", "start_date", "end_date", "time", "location"],
          },
          description:
            "Specific event fields to include. Include all enum values if the user does not ask for specific fields.",
        },
        query: {
          type: Type.STRING,
          description:
            "Optional keyword to filter by event title or description.",
        },
      },
      required: ["limit", "date", "fields"],
    },
  },
];


const getMyEventsArgs = z.object({ limit: z.number().int().min(1).max(20).default(10),query : z.string().optional(), fields : z.enum(["title", "description", "start_date", "end_date", "time", "location"]) , date:z.string().refine((date)=> /\d\d-\d\d-\d\d-\d\d:\d\d/) });

// userId comes from the session, never from the model
export async function runTool(name: string, args: unknown, userId: string) {
    switch (name) {
        case "get_my_events": {
            const parsedData = getMyEventsArgs.parse(args ?? {});

            // Actual API Call HERE
            //   return prisma.registration.findMany({
            //     where: { userId },
            //     take: limit,
            //     select: { event: { select: { title: true, startsAt: true } } },
            //   });



        }
        default:
            throw new Error("Unknown tool");
    }
}


export const get_my_events = (limit : number, date : string , filter : string , query? : string) => {
    const [startStrDate,endStrDate] = date.split("->");
    const [startTime,endTime] = time.split("->");
    const [startDate,endDate] = [new Date(startStrDate),new Date(endStrDate)];

}