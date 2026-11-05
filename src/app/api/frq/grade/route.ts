import { GoogleGenAI } from "@google/genai";
import { type NextRequest } from "next/server";
import { GEMINI_MODEL } from "@/lib/ai-config";
import { rateLimit } from "@/lib/rate-limit";
import {
  MAX_ATTACHMENTS_PER_MESSAGE, MAX_ATTACHMENT_BASE64_LENGTH,
  MAX_ESSAY_LENGTH, ALLOWED_IMAGE_MIMES, tooLarge,
} from "@/lib/limits";
import { FORMATTING_RULES } from "@/lib/prompt-fragments";
import { requireAuth } from "@/lib/auth-guard";
import { COURSE_BY_SLUG } from "@/constants/courses";
import { loadCedData } from "@/lib/ced";

export async function POST(req: NextRequest) {
  try {
    const authResult = await requireAuth();
    if (authResult instanceof Response) return authResult;

    const limited = rateLimit(req, "grade", authResult);
    if (limited) return limited;

    const { slug, examParam, answers, parts, courseName }: {
      slug?: string;
      examParam?: string | null;
      answers: { letter: string; answer: string; attachment?: { mimeType: string; data: string } | null }[];
      parts: { letter: string; points: number; rubric: string }[];
      courseName: string;
    } = await req.json();

    // Chief Reader guidance for this course, if its CED JSON has any. A
    // missing or unknown slug grades exactly as before, from the rubric alone.
    const entry = slug ? COURSE_BY_SLUG[slug] : undefined;
    const chiefReaderNotes = entry ? loadCedData(entry, examParam)?.chiefReaderNotes : undefined;
    const readerGuidance = chiefReaderNotes ? `
AP READER GUIDANCE (synthesized from College Board Chief Reader Reports for this course):
${chiefReaderNotes}

HOW TO USE THE READER GUIDANCE:
- The rubric for each part decides WHAT earns a point. The reader guidance decides whether the student's wording actually meets that criterion, the way a real AP reader would judge it.
- Withhold a point when the response matches a pattern the guidance says does not earn credit (vague or empty phrasing, a misconception it names, a direction or comparison left unstated), even if it superficially resembles the rubric language.
- Do NOT deduct for anything the rubric for that part does not assess. A misconception elsewhere in the answer is feedback, not a lost point.
- When a point is withheld for one of these reasons, say so plainly in that part's feedback and state what a reader would need to see instead.
` : "";

    if (!Array.isArray(answers) || tooLarge(answers, MAX_ATTACHMENTS_PER_MESSAGE * 4)) {
      return new Response("Invalid answers", { status: 400 });
    }
    for (const a of answers) {
      if (typeof a.answer === "string" && tooLarge(a.answer, MAX_ESSAY_LENGTH)) {
        return new Response("Answer too large", { status: 400 });
      }
      if (a.attachment?.data) {
        if (!ALLOWED_IMAGE_MIMES.includes(a.attachment.mimeType as typeof ALLOWED_IMAGE_MIMES[number])) {
          return new Response("Unsupported attachment type", { status: 400 });
        }
        if (tooLarge(a.attachment.data, MAX_ATTACHMENT_BASE64_LENGTH)) {
          return new Response("Attachment too large", { status: 400 });
        }
      }
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return new Response("API Key not configured", { status: 500 });

    const systemInstruction = `
You are a highly specialized AP Exam Grader for ${courseName}. Your task is to grade a student's responses to a multi-part Free Response Question (FRQ) based on the official grading rubric.

${FORMATTING_RULES}

STRUCTURE OF INPUT:
- You will be provided with the student's answers (Part a, Part b, etc.)
- You will be provided with the official rubric and maximum points for each part.

GOAL:
- **Be fair but strict**: Only award points if the student meets the specific criteria in the rubric. 
- **Explain why**: For each part, provide a brief (1-2 sentence) explanation of why they earned or lost a point.
- **Provide a summary**: Briefly state their overall performance (e.g. "Strong understanding of concept X, but missing mechanism in Part b").
${readerGuidance}
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

    const promptText = `
Course: ${courseName}

Student Answers:
${answers.map(a => `Part ${a.letter}: ${a.answer || "(no text response)"}${a.attachment ? " [See attached image]" : ""}`).join("\n")}

Official Rubrics:
${parts.map(p => `Part ${p.letter} (${p.points} points max): ${p.rubric}`).join("\n")}
`;

    // Build content parts: text prompt + any image attachments
    const contentParts: { text?: string; inlineData?: { mimeType: string; data: string } }[] = [{ text: promptText }];
    for (const a of answers) {
      if (a.attachment?.data) {
        contentParts.push({ inlineData: { mimeType: a.attachment.mimeType, data: a.attachment.data } });
      }
    }

    const result = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: [{ role: "user", parts: contentParts }],
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
