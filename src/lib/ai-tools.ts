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
                    description: "Maximum results, 1-20",
                },
                date: {
                    type: Type.STRING,
                    description:
                        "Optional date range, format yyyy-mm-dd->yyyy-mm-dd",
                },
                time: {
                    type: Type.STRING,
                    description:
                        "Optional time range, format hh:mm->hh:mm",
                },
                meta: {
                    type: Type.OBJECT,
                    description: "Additional event data fields.",
                    properties: {
                        id: {
                            type: Type.STRING,
                            description: "Event unique ID",
                        },
                        date: {
                            type: Type.STRING,
                            description: "Event date, format YYYY-MM-DD",
                        },
                        title: {
                            type: Type.STRING,
                            description: "Event title",
                        },
                        description: {
                            type: Type.STRING,
                            description: "Event description",
                        },
                        start: {
                            type: Type.STRING,
                            description: "Event start time, format HH:mm",
                        },
                        end: {
                            type: Type.STRING,
                            description: "Event end time, format HH:mm",
                        },
                        color: {
                            type: Type.STRING,
                            description: "Event color scheme",
                        },
                    },
                },
            },
        },
    },
];

const getMyEventsArgs = z.object({ limit: z.number().int().min(1).max(20).default(10) , date:z.string().refine((date)=> /\d\d-\d\d-\d\d/) });

// userId comes from the session, never from the model
export async function runTool(name: string, args: unknown, userId: string) {
    switch (name) {
        case "get_my_events": {
            const { limit } = getMyEventsArgs.parse(args ?? {});

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