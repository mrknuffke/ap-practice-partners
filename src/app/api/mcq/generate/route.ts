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

    const { slug, examParam, unit, format } = await req.json();
    const isPassage = format === "passage";

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
FORMAT: ${isPassage ? "PASSAGE-BASED (5 questions on one shared stimulus)" : "INDEPENDENT (5 questions each with their own stimulus)"}

${cedBlock}

${pedagogy}

CED ALIGNMENT (CRITICAL):
- Before generating any content, verify that the UNIT above appears in the CED unit list provided. If it does not match exactly, generate questions for the closest matching CED unit.
- Do NOT generate questions testing content outside the unit/topic scope listed in the CED data above.

STIMULUS RULES — MANDATORY:
- Every stimulus MUST contain actual rendered content. ABSOLUTELY FORBIDDEN: "imagine a graph", "consider a table", "suppose you are given", or any placeholder language. Render the actual data or diagram inline.
- Use a markdown table with explicit data points for numerical/experimental data, or a \`\`\`mermaid xychart-beta block for trends and graphs.
- NEVER use Mermaid flowcharts or diagrams to attempt to depict physical objects, biological structures (like cells), or experimental apparatuses—they look horrendous and confuse students. If a visual is needed, describe the observations textually, or provide a markdown table of experimental results.
- The stimulus alone must provide all information needed to answer the question.
- NEVER use LaTeX (dollar signs $, $$, or backslash-escaped symbols like \\chi, \\alpha, \\frac). Use unicode directly: χ², α, β, Δ, μ, ≤, ≥, →, ∑, ×, ÷, π, σ.
- Do NOT include raw backslashes in any JSON string value.

GENERAL MCQ RULES:
- Questions must use AP task verbs accurately (Explain, Identify, Predict, Calculate).
- Distractors MUST be plausible and based on common student misconceptions.
- All 4 options (A-D) must be of similar length.
- Randomize the position of the correct answer across A, B, C, and D.

${isPassage ? `PASSAGE-BASED FORMAT:
Generate ONE shared stimulus (a 300–500 word passage, a detailed data table, or a rich experimental scenario with multiple data points). All 5 questions must reference this shared stimulus.
Each question stem should begin with "Based on the passage above," or "According to the data," or similar.

OUTPUT FORMAT — return a JSON object:
{
  "stimulus": "string (the shared passage/data/scenario — markdown allowed, use mermaid or tables for data)",
  "questions": [
    {
      "id": "string",
      "question": "string",
      "options": { "A": "string", "B": "string", "C": "string", "D": "string" },
      "correctAnswer": "A" | "B" | "C" | "D",
      "explanation": "string"
    }
  ]
}` : `INDEPENDENT FORMAT:
Each of the 5 questions has its own short stimulus (a specific data table, a brief scenario with concrete numbers, or a mermaid diagram).

OUTPUT FORMAT — return a JSON array:
[
  {
    "id": "string",
    "stimulus": "string (markdown allowed — must be actual rendered content, not placeholder language)",
    "question": "string",
    "options": { "A": "string", "B": "string", "C": "string", "D": "string" },
    "correctAnswer": "A" | "B" | "C" | "D",
    "explanation": "string (explain why the correct answer is right and why each distractor is wrong)"
  }
]`}

Do NOT include any commentary before or after the JSON.
`;

    const ai = new GoogleGenAI({ apiKey });

    const result = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [{ role: "user", parts: [{ text: `Generate 5 ${isPassage ? "passage-based" : "independent"} MCQs for Unit ${unit} of ${entry.displayName}.` }] }],
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
