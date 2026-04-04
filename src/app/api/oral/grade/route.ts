import { GoogleGenAI } from "@google/genai";
import { type NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const classCode = req.headers.get("x-classroom-code");
    const validCodes = (process.env.CLASSROOM_CODE || "").split(",").map(c => c.trim());

    if (!classCode || !validCodes.includes(classCode)) {
      return new Response("Unauthorized", { status: 401 });
    }

    const { audioBase64, mimeType, prompt, courseName } = await req.json();

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return new Response("API Key not configured", { status: 500 });

    const systemInstruction = `
You are a highly specialized AP World Language Examiner for ${courseName}. Your task is to evaluate a student's oral response based on official College Board grading standards (0-6 scale).

CRITERIA:
1. **Interpersonal/Presentational Communication**: How well did they address the specific prompt?
2. **Vocabulary/Grammar**: Range and accuracy of language.
3. **Fluency/Pronunciation**: Smoothness of speech and accuracy of accent.

OUTPUT FORMAT:
You MUST output a valid JSON object with this exact structure:
{
  "score": number,
  "fluency": "string (1-2 sentences)",
  "pronunciation": "string (1-2 sentences)",
  "taskCompletion": "string (1-2 sentences)",
  "overallFeedback": "string"
}

Do NOT include any commentary before or after the JSON.
`;

    const ai = new GoogleGenAI({ apiKey });

    const result = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        {
          role: "user",
          parts: [
            { text: `Grade this oral response for the prompt: ${prompt}` },
            {
              inlineData: {
                mimeType: mimeType || "audio/webm",
                data: audioBase64
              }
            }
          ]
        }
      ],
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
    console.error("Oral Grading Error:", error);
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return new Response(message, { status: 500 });
  }
}
