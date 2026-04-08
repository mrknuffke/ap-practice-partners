import { GoogleGenAI } from "@google/genai";
import { type NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  const classCode = req.headers.get("x-classroom-code");
  const validCodes = (process.env.CLASSROOM_CODE || "").split(",").map(c => c.trim());
  if (!classCode || !validCodes.includes(classCode)) {
    return new Response("Unauthorized", { status: 401 });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return new Response("API Key not configured", { status: 500 });

  const ai = new GoogleGenAI({ apiKey });

  const prompt = `You are a warm, encouraging AP exam coach. Generate ONE concise, insightful study tip for AP students. 
The tip should be:
- 1-3 sentences maximum
- Practically actionable (not just "study hard!")
- Focused on a specific study strategy, mindset, or AP exam technique
- Varied — it can relate to any AP subject (Biology, History, Calc, Lang, CS, etc.)
- Conversational and warm in tone
Return ONLY the tip text itself — no labels, no quotation marks, no preamble.`;

  try {
    const result = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
    });

    const tip = result.text?.trim() ?? 
      "Focus on understanding the *why* behind each concept — AP exams reward deeper reasoning over pure memorization.";

    return Response.json({ tip });
  } catch {
    return Response.json({ 
      tip: "Focus on understanding the *why* behind each concept — AP exams reward deeper reasoning over pure memorization."
    });
  }
}
