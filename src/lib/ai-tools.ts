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
                limit: { type: Type.INTEGER, description: "Max results, 1-20" },
            },
        },
    },
];

const getMyEventsArgs = z.object({ limit: z.number().int().min(1).max(20).default(10) });

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