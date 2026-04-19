import { GoogleGenAI } from "@google/genai";
import { type NextRequest } from "next/server";
import { COURSE_BY_SLUG } from '@/constants/courses';
import { loadCedData, buildCedBlock } from "@/lib/ced";
import {
  PEDAGOGY_ADAPTATIONS
} from '@/constants/activeLearning';
import { rateLimit } from "@/lib/rate-limit";
import { CED_SCOPE_RULES, FORMATTING_RULES } from "@/lib/prompt-fragments";

export async function POST(req: NextRequest) {
  try {
    const classCode = req.headers.get("x-classroom-code");
    const validCodes = (process.env.CLASSROOM_CODE || "").split(",").map(c => c.trim());

    if (!classCode || !validCodes.includes(classCode)) {
      return new Response("Unauthorized", { status: 401 });
    }

    const limited = rateLimit(req, "generate");
    if (limited) return limited;

    const { slug, examParam, topic } = await req.json();

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return new Response("API Key not configured", { status: 500 });

    const entry = COURSE_BY_SLUG[slug];
    if (!entry) return new Response(`Unknown course slug: ${slug}`, { status: 400 });

    const cedData = loadCedData(entry, examParam);
    const cedBlock = cedData ? buildCedBlock(cedData, entry) : "";
    const pedagogy = PEDAGOGY_ADAPTATIONS[entry.subjectArea] || "";

    const systemInstruction = `
You are a highly specialized AP Exam Item Writer for History and English. Your task is to generate a full Source Packet (DBQ or Synthesis Essay) for the following course and topic:

COURSE: ${entry.displayName} ${examParam ? `(${examParam})` : ""}
TOPIC: ${topic}

${cedBlock}

${pedagogy}

${CED_SCOPE_RULES}

${FORMATTING_RULES}

SOURCE PACKET RULES:
- You must generate 1 central prompt (e.g., "Analyze the extent to which...")
- You must generate exactly 6-7 numbered documents (Doc 1 to Doc 7).
- Documents should be a mix of primary and secondary sources.
- For non-text sources (images, cartoons, maps), provide a detailed description.
- Each document must include metadata (Source name, author, date).
- The documents must represent a diversity of perspectives on the topic.
- Include a hidden grading rubric for each of the AP DBQ/Synthesis points (Thesis, Context, Evidence, Sourcing/HIPP).

OUTPUT FORMAT:
You MUST output a valid JSON object with this exact structure:
{
  "id": "string",
  "type": "dbq",
  "prompt": "string",
  "documents": [
    {
      "id": "1",
      "title": "string",
      "type": "text" | "image" | "map",
      "content": "string (the actual text or description)",
      "metadata": "string (author, title, date)"
    }
  ],
  "rubric": {
    "thesis": "string",
    "context": "string",
    "evidence": "string",
    "sourcing": "string"
  }
}

Do NOT include any commentary before or after the JSON.
`;

    const ai = new GoogleGenAI({ apiKey });

    const result = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [{ role: "user", parts: [{ text: `Generate a full AP-style Source/DBQ Packet for the topic: ${topic}.` }] }],
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
    console.error("Source Generation Error:", error);
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return new Response(message, { status: 500 });
  }
}
