import { GoogleGenAI } from "@google/genai";
import { type NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const classCode = req.headers.get("x-classroom-code");
    const validCodes = (process.env.CLASSROOM_CODE || "").split(",").map(c => c.trim());

    if (!classCode || !validCodes.includes(classCode)) {
      return new Response("Unauthorized", { status: 401 });
    }

    const { answers, parts, courseName }: {
      answers: { letter: string; answer: string }[];
      parts: { letter: string; points: number; rubric: string }[];
      courseName: string;
    } = await req.json();

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return new Response("API Key not configured", { status: 500 });

    const systemInstruction = `
You are a highly specialized AP Exam Grader for ${courseName}. Your task is to grade a student's responses to a multi-part Free Response Question (FRQ) based on the official grading rubric.

STRUCTURE OF INPUT:
- You will be provided with the student's answers (Part a, Part b, etc.)
- You will be provided with the official rubric and maximum points for each part.

GOAL:
- **Be fair but strict**: Only award points if the student meets the specific criteria in the rubric. 
- **Explain why**: For each part, provide a brief (1-2 sentence) explanation of why they earned or lost a point.
- **Provide a summary**: Briefly state their overall performance (e.g. "Strong understanding of concept X, but missing mechanism in Part b").

OUTPUT FORMAT:
You MUST output a valid JSON object with this exact structure:
{
  "totalPoints": number,
  "maxPoints": number,
  "parts": [
    {
      "letter": "string",
      "pointsEarned": number,
      "feedback": "string"
    }
  ],
  "overallSummary": "string"
}

Do NOT include any commentary before or after the JSON.
`;

    const ai = new GoogleGenAI({ apiKey });

    const prompt = `
Course: ${courseName}

Student Answers:
${answers.map(a => `Part ${a.letter}: ${a.answer}`).join("\n")}

Official Rubrics:
${parts.map(p => `Part ${p.letter} (${p.points} points max): ${p.rubric}`).join("\n")}
`;

    const result = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
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
    console.error("FRQ Grading Error:", error);
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return new Response(message, { status: 500 });
  }
}
