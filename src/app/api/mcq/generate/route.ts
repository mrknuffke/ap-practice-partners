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

    const { slug, examParam, unit } = await req.json();

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return new Response("API Key not configured", { status: 500 });

    const entry = COURSE_BY_SLUG[slug];
    if (!entry) return new Response(`Unknown course slug: ${slug}`, { status: 400 });

    const cedData = loadCedData(entry, examParam);
    const cedBlock = cedData ? buildCedBlock(cedData, entry) : "";

    const pedagogy = PEDAGOGY_ADAPTATIONS[entry.subjectArea] || "";

    const systemInstruction = `
You are a highly specialized AP Exam Item Writer. Your task is to generate exactly 5 high-quality, stimulus-based Multiple Choice Questions (MCQs) for the following course and unit:

COURSE: ${entry.displayName} ${examParam ? `(${examParam})` : ""}
UNIT: ${unit}

${cedBlock}

${pedagogy}

CED ALIGNMENT (CRITICAL):
- Before generating any content, verify that the UNIT above appears in the CED unit list provided. If it does not match exactly, generate questions for the closest matching CED unit.
- Do NOT generate questions testing content outside the unit/topic scope listed in the CED data above.

GENERAL MCQ RULES:
- EVERY question must be stimulus-based (graph, data table, scenario, or passage).
- Stimulus must be 2-4 sentences and provide enough context to solve the problem.
- Questions must use AP task verbs accurately (Explain, Identify, Predict, Calculate).
- Distractors MUST be plausible and based on common student misconceptions.
- All 4 options (A-D) must be of similar length.
- Randomize the position of the correct answer.

OUTPUT FORMAT:
You MUST output a valid JSON array of objects with this exact structure:
[
  {
    "id": "string",
    "stimulus": "string (markdown allowed, use mermaid for diagrams if needed)",
    "question": "string",
    "options": {
      "A": "string",
      "B": "string",
      "C": "string",
      "D": "string"
    },
    "correctAnswer": "A" | "B" | "C" | "D",
    "explanation": "string (explain why the correct answer is right and why distractors are wrong)"
  }
]

Do NOT include any commentary before or after the JSON.
`;

    const ai = new GoogleGenAI({ apiKey });

    const result = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [{ role: "user", parts: [{ text: `Generate 5 MCQs for Unit ${unit} of ${entry.displayName}.` }] }],
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
    console.error("MCQ Generation Error:", error);
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return new Response(message, { status: 500 });
  }
}
