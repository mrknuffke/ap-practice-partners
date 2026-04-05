import { GoogleGenAI } from "@google/genai";
import { type NextRequest } from "next/server";
import { COURSE_BY_SLUG } from '@/constants/courses';
import { loadCedData, buildCedBlock } from "@/lib/ced";
import { 
  PEDAGOGY_ADAPTATIONS 
} from '@/constants/activeLearning';

export async function POST(req: NextRequest) {
  try {
    const classCode = req.headers.get("x-classroom-code");
    const validCodes = (process.env.CLASSROOM_CODE || "").split(",").map(c => c.trim());

    if (!classCode || !validCodes.includes(classCode)) {
      return new Response("Unauthorized", { status: 401 });
    }

    const { slug, examParam, topic } = await req.json();

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return new Response("API Key not configured", { status: 500 });

    const entry = COURSE_BY_SLUG[slug];
    if (!entry) return new Response(`Unknown course slug: ${slug}`, { status: 400 });

    const cedData = loadCedData(entry, examParam);
    const cedBlock = cedData ? buildCedBlock(cedData, entry) : "";
    const pedagogy = PEDAGOGY_ADAPTATIONS[entry.subjectArea] || "";

    const systemInstruction = `
You are a highly specialized AP Exam Item Writer. Your task is to generate exactly 1 high-fidelity Free Response Question (FRQ) for the following course and topic:

COURSE: ${entry.displayName} ${examParam ? `(${examParam})` : ""}
TOPIC: ${topic}

${cedBlock}

${pedagogy}

CED ALIGNMENT (CRITICAL):
- Before generating any content, verify that the TOPIC above appears in the CED unit/topic list provided. If the topic is not explicitly listed, generate the FRQ for the closest CED-aligned topic and note the substitution in the stimulus.
- Do NOT generate questions testing content outside the unit/topic scope listed in the CED data above.

FRQ RULES:
- The question must be stimulus-based (graph, data table, experiment, passage).
- The FRQ must be divided into 3-4 sub-parts (a, b, c, d).
- Each sub-part must use an AP task verb precisely (Explain, Describe, Calculate, Justify).
- You must provide a **detailed grading rubric** for each part.
- The rubric should specify exactly what is required to earn the point(s).

OUTPUT FORMAT:
You MUST output a valid JSON object with this exact structure:
{
  "id": "string",
  "stimulus": "string (markdown allowed, use mermaid for diagrams/flowcharts)",
  "parts": [
    {
      "letter": "a",
      "question": "string",
      "points": number,
      "rubric": "string (explicit criteria for the points)"
    }
  ]
}

Do NOT include any commentary before or after the JSON.
`;

    const ai = new GoogleGenAI({ apiKey });

    const result = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [{ role: "user", parts: [{ text: `Generate a full AP-style FRQ for the topic: ${topic}.` }] }],
      config: {
        systemInstruction,
        responseMimeType: "application/json"
      }
    });

    const text = result.text;
    return new Response(text, {
      headers: { "Content-Type": "application/json" }
    });
  } catch (error: unknown) {
    console.error("FRQ Generation Error:", error);
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return new Response(message, { status: 500 });
  }
}
