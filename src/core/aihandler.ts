// app/api/ai/route.ts
import { NextResponse } from "next/server";
import { success, z } from "zod";
import { ai, GEMINI_MODEL } from "@/lib/gemini";
import validate from "@/func/validator";

const bodySchema = z.string().min(1).max(4000);

const AISystemPrompt = () => {
    return `
        You are Flowtives AI 1.0 made as a Full Stack Web Application Project 
        The user will primarily request you to perform lookups on their calander events and assistance .
        These may include finding particular events at a time, adding new events, explaining events, updating schedule, finding free time, updating schedule based on intrests and tests, and more. 
        When given an unclear or generic instruction, consider it in the context of these tasks and the current working event. 
        For example, if the user asks you to change "eventDescription" to snake case, do not reply with just "method_name", instead find the method in the code and modify the code.
        You are highly capable and often allow users to complete ambitious tasks that would otherwise be too complex or take too long. 
        You should defer to user judgement about whether a task is too large to attempt. When sending user-facing text, you're writing for a person, not logging to a console.
        Assume users can't see most tool calls or thinking - only your text output. Before your first tool call, briefly state what you're about to do.
        While working, give short updates at key moments: when you find something about the event or updaing some parts of their event.
        When making updates, assume the person has stepped away and lost the thread. They don't know codenames, abbreviations, or shorthand you created along the way, and didn't track your process.
        When adding descriptions or replying to the user write so they can pick back up cold: use complete, grammatically correct sentences without unexplained jargon. Expand technical terms. 
        For upding the title keep it short and simple without explaining too much and keep it within 50 words.
        Err on the side of more explanation. Attend to cues about the user's level of expertise; if they seem like an expert, tilt a bit more concise, while if they seem like they're new, be more explanatory. 
        Write user-facing text in flowing prose while eschewing fragments, excessive em dashes, symbols and notation, or similarly hard-to-parse content. 
        Only use tables when appropriate; for example to hold short enumerable facts (file names, line numbers, pass/fail), or communicate quantitative data.
        Don't pack explanatory reasoning into table cells -- explain before or after. 
        Avoid semantic backtracking: structure each sentence so a person can read it linearly, building up meaning without having to re-parse what came before. 
        What's most important is the reader understanding your output without mental overhead or follow-ups, not how terse you are. 
        If the user has to reread a summary or ask you to explain, that will more than eat up the time savings from a shorter first read. 
        Match responses to the task: a simple question gets a direct answer in prose, not headers and numbered sections. 
        While keeping communication clear, also keep it concise, direct, and free of fluff. Avoid filler or stating the obvious. 
        Get straight to the point. Don't overemphasize unimportant trivia about your process or use superlatives to oversell small wins or losses. 
        Use inverted pyramid when appropriate (leading with the action), and if something about your reasoning or process is so important that it absolutely must be in user-facing text, save it for the end.
        These user-facing text instructions do not apply to code or tool calls.
    `
}

export const aihandler = async (prompt: string) => {
    try {
        const parsed = bodySchema.safeParse(prompt);
        if (!parsed.success) {
            return { success: false, error: z.flattenError(parsed.error).fieldErrors };
        }
        const validedPrompt = validate(parsed.data);
        if (!validedPrompt.valid) {
            return NextResponse.json({ error: { prompt: [validedPrompt.error] } }, { status: 400 });
        }
        if (!validedPrompt.value) {
            return { success: false, error: { metaError: ['No Input Data'] } };
        }

        const response = await ai.models.generateContent({
            model: GEMINI_MODEL,
            contents: validedPrompt.value,
            config: {
                systemInstruction: "You are a concise assistant.",
                maxOutputTokens: 1000,
            },
        });

        return { success: true, text: response.text ?? "" };
    } catch (err) {
        // A 429 means you've hit the free-tier rate limit
        console.error("Gemini error", err);
        return { success: false, error: { metaError: ["AI request failed"] } }
    }
}


// 1.Direct base 64 image

// app/api/ai/vision/route.ts
// import { NextResponse } from "next/server";
// import { z } from "zod";
// import { ai, GEMINI_MODEL } from "@/lib/gemini";

// const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/webp"] as const;
// const MAX_BYTES = 5 * 1024 * 1024; // 5 MB

// const fieldsSchema = z.object({
//   prompt: z.string().min(1).max(2000),
// });

// export async function POST(req: Request) {
//   const form = await req.formData();
//   const file = form.get("image");

//   const fields = fieldsSchema.safeParse({ prompt: form.get("prompt") });
//   if (!fields.success || !(file instanceof File)) {
//     return NextResponse.json({ error: "Invalid input" }, { status: 400 });
//   }
//   if (!(ALLOWED_TYPES as readonly string[]).includes(file.type)) {
//     return NextResponse.json({ error: "Unsupported image type" }, { status: 400 });
//   }
//   if (file.size > MAX_BYTES) {
//     return NextResponse.json({ error: "Image too large" }, { status: 413 });
//   }

//   const base64 = Buffer.from(await file.arrayBuffer()).toString("base64");

//   try {
//     const response = await ai.models.generateContent({
//       model: GEMINI_MODEL,
//       contents: [
//         { inlineData: { mimeType: file.type, data: base64 } },
//         { text: fields.data.prompt },
//       ],
//     });
//     return NextResponse.json({ text: response.text ?? "" });
//   } catch (err) {
//     console.error("Gemini vision error", err);
//     return NextResponse.json({ error: "AI request failed" }, { status: 502 });
//   }
// }

// Client side

// const formData = new FormData();
// formData.append("image", fileInput.files![0]);
// formData.append("prompt", "Describe this image");

// const res = await fetch("/api/ai/vision", { method: "POST", body: formData });
// const data: { text?: string; error?: string } = await res.json();


// 2. File API

// const uploaded = await ai.files.upload({
//   file: blobOrPath, // Blob in the server runtime, or a file path
//   config: { mimeType: "image/png" },
// });

// const response = await ai.models.generateContent({
//   model: GEMINI_MODEL,
//   contents: [
//     { fileData: { fileUri: uploaded.uri!, mimeType: uploaded.mimeType! } },
//     { text: "Describe this image" },
//   ],
// });


// 3. AI Tools

// lib/ai-tools.ts
// import "server-only";
// import { Type, type FunctionDeclaration } from "@google/genai";
// import { z } from "zod";
// import { prisma } from "@/lib/prisma";

// export const functionDeclarations: FunctionDeclaration[] = [
//   {
//     name: "get_my_events",
//     description: "List events the current user registered for.",
//     parameters: {
//       type: Type.OBJECT,
//       properties: {
//         limit: { type: Type.INTEGER, description: "Max results, 1-20" },
//       },
//     },
//   },
// ];

// const getMyEventsArgs = z.object({ limit: z.number().int().min(1).max(20).default(10) });

// // userId comes from the session, never from the model
// export async function runTool(name: string, args: unknown, userId: string) {
//   switch (name) {
//     case "get_my_events": {
//       const { limit } = getMyEventsArgs.parse(args ?? {});
//       return prisma.registration.findMany({
//         where: { userId },
//         take: limit,
//         select: { event: { select: { title: true, startsAt: true } } },
//       });
//     }
//     default:
//       throw new Error("Unknown tool");
//   }
// }


// in your route handler


// import type { Content } from "@google/genai";
// import { ai, GEMINI_MODEL } from "@/lib/gemini";
// import { functionDeclarations, runTool } from "@/lib/ai-tools";

// const contents: Content[] = [{ role: "user", parts: [{ text: prompt }] }];

// for (let i = 0; i < 4; i++) { // hard cap on round trips
//   const response = await ai.models.generateContent({
//     model: GEMINI_MODEL,
//     contents,
//     config: { tools: [{ functionDeclarations }] },
//   });

//   const calls = response.functionCalls;
//   if (!calls?.length) return NextResponse.json({ text: response.text ?? "" });

//   contents.push(response.candidates![0].content!); // the model's tool request

//   const parts = await Promise.all(
//     calls.map(async (c) => {
//       try {
//         const output = await runTool(c.name!, c.args, session.userId);
//         return { functionResponse: { name: c.name!, response: { output } } };
//       } catch {
//         return { functionResponse: { name: c.name!, response: { error: "Tool failed" } } };
//       }
//     })
//   );
//   contents.push({ role: "user", parts });
// }
// return NextResponse.json({ error: "Too many steps" }, { status: 502 });

// Count rows cheaply

// const [rows, total] = await Promise.all([
//   prisma.registration.findMany({
//     where: { userId },
//     take: limit,
//     orderBy: { createdAt: "desc" },
//     select: { event: { select: { title: true, startsAt: true } } },
//   }),
//   prisma.registration.count({ where: { userId } }),
// ]);


// 5.Measure the serialized size in your tool, and trim if needed

// lib/ai-limits.ts
// import "server-only";

// const MAX_TOOL_BYTES = 12 * 1024; // 12 KB

// export function limitToolOutput<T>(rows: T[], total: number) {
//   let kept = rows;
//   let json = JSON.stringify(kept);

//   // Drop rows from the end until it fits
//   while (Buffer.byteLength(json, "utf8") > MAX_TOOL_BYTES && kept.length > 1) {
//     kept = kept.slice(0, Math.ceil(kept.length / 2));
//     json = JSON.stringify(kept);
//   }

//   return {
//     rows: kept,
//     returned: kept.length,
//     total,
//     truncated: kept.length < total,
//   };
// }


//The truncated flag matters because the model then knows the list is incomplete and won’t treat it as the full data.

// case "get_my_events": {
//   const { limit } = getMyEventsArgs.parse(args ?? {});
//   const [rows, total] = await Promise.all([ /* as above */ ]);
//   return limitToolOutput(rows, total);
// }