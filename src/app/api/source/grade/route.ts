import { GoogleGenAI } from "@google/genai";
import { type NextRequest } from "next/server";
import { rateLimit } from "@/lib/rate-limit";
import { MAX_ESSAY_LENGTH, tooLarge } from "@/lib/limits";

export async function POST(req: NextRequest) {
  try {
    const classCode = req.headers.get("x-classroom-code");
    const validCodes = (process.env.CLASSROOM_CODE || "").split(",").map(c => c.trim());

    if (!classCode || !validCodes.includes(classCode)) {
      return new Response("Unauthorized", { status: 401 });
    }

    const limited = rateLimit(req, "grade");
    if (limited) return limited;

    const { essay, prompt, documents, rubric, courseName }: {
      essay: string;
      prompt: string;
      documents: { id: string; metadata: string; content: string }[];
      rubric: Record<string, string>;
      courseName: string;
    } = await req.json();

    if (typeof essay === "string" && tooLarge(essay, MAX_ESSAY_LENGTH)) {
      return new Response("Essay too large", { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return new Response("API Key not configured", { status: 500 });

    const systemInstruction = `
You are a highly specialized AP Exam Grader for ${courseName}. Your task is to evaluate a student's Source-Based Essay (DBQ or Synthesis) based on official College Board grading standards.

SCORING CRITERIA (7 Points Total):
1. **Thesis/Claim (1pt)**: Responds to the prompt with a historically defensible thesis or claim that establishes a line of reasoning.
2. **Contextualization (1pt)**: Describes a broader historical context relevant to the prompt.
3. **Evidence from Documents (2pts)**: 
    - Use content from at least 3 documents to address the prompt (1pt).
    - Use content from at least 6 documents to support an argument (2pts).
4. **Evidence Beyond Documents (1pt)**: Uses at least one additional piece of specific historical evidence (beyond the documents) relevant to an argument about the prompt.
5. **Sourcing/HIPP (1pt)**: For at least 3 documents, explains how or why the document's point of view, intended audience, purpose, and/or historical situation is relevant to an argument.
6. **Complexity (1pt)**: Demonstrates a complex understanding of the historical development that is the focus of the prompt.

OUTPUT FORMAT:
You MUST output a valid JSON object with this exact structure:
{
  "totalPoints": number,
  "maxPoints": 7,
  "breakdown": {
    "thesis": { "earned": boolean, "feedback": "string" },
    "context": { "earned": boolean, "feedback": "string" },
    "evidenceDocs": { "earned": number, "max": 2, "feedback": "string" },
    "evidenceBeyond": { "earned": boolean, "feedback": "string" },
    "sourcing": { "earned": boolean, "feedback": "string" },
    "complexity": { "earned": boolean, "feedback": "string" }
  },
  "overallSummary": "string"
}

Do NOT include any commentary before or after the JSON.
`;

    const ai = new GoogleGenAI({ apiKey });

    const promptMessage = `
Course: ${courseName}
Prompt: ${prompt}

Documents Provided:
${documents.map(d => `Doc ${d.id}: ${d.metadata}\nContent: ${d.content}\n`).join("\n")}

Official Rubric Guide:
${JSON.stringify(rubric, null, 2)}

Student Essay:
---
${essay}
---
`;

    const result = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [{ role: "user", parts: [{ text: promptMessage }] }],
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
    console.error("Source Grading Error:", error);
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return new Response(message, { status: 500 });
  }
}
