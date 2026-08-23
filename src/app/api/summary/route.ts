import { GoogleGenAI } from "@google/genai";
import { type NextRequest } from "next/server";
import { GEMINI_MODEL } from "@/lib/ai-config";
import { rateLimit } from "@/lib/rate-limit";
import { MAX_MESSAGES, MAX_MESSAGE_CONTENT_LENGTH, tooLarge } from "@/lib/limits";
import { FORMATTING_RULES } from "@/lib/prompt-fragments";
import { requireAuth } from "@/lib/auth-guard";

export async function POST(req: NextRequest) {
  try {
    const authResult = await requireAuth();
    if (authResult instanceof Response) return authResult;

    const limited = rateLimit(req, "grade");
    if (limited) return limited;

    const body = await req.json();
    const { messages } = body;

    if (!Array.isArray(messages) || tooLarge(messages, MAX_MESSAGES)) {
      return new Response("Invalid messages", { status: 400 });
    }
    for (const m of messages) {
      if (typeof m.content === "string" && tooLarge(m.content, MAX_MESSAGE_CONTENT_LENGTH)) {
        return new Response("Message too large", { status: 400 });
      }
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return new Response("API Key not configured", { status: 500 });
    }

    const ai = new GoogleGenAI({ apiKey });

    const systemInstruction = `You are an expert AI tutor evaluating a completed AP exam prep session. Review the full conversation and produce a structured "Session Summary" the student can save or print.

${FORMATTING_RULES}

Use this exact markdown structure:

## Session Summary

**Topics Covered:** [comma-separated list of topics discussed or practiced]

### Strengths
- [specific thing the student demonstrated well — be concrete, reference their actual responses]
- [another strength]

### Areas for Improvement
- [specific gap or misconception identified, with a brief explanation of the correct concept]
- [another area]

### Study Strategies
- [actionable recommendation tied to their specific weaknesses]
- [another strategy — e.g. "Review the chi-square test procedure and practice interpreting p-values"]

### Suggested Next Steps
1. [First priority action]
2. [Second priority action]
3. [Optional third]

---
*Keep this summary as a reference for your next study session.*

Be specific — reference actual topics, actual mistakes, and actual content from the session. Do not give generic advice. Be encouraging but honest.`;

    const formattedMessages = messages.length > 0
      ? messages.map((m: { role: string; content: string }) => ({
          role: m.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: m.content }]
        }))
      : [];

    formattedMessages.push({
      role: 'user',
      parts: [{ text: 'Please generate a session summary of our study session.'}]
    });

    const responseStream = await ai.models.generateContentStream({
      model: GEMINI_MODEL,
      contents: formattedMessages,
      config: {
        systemInstruction,
      }
    });

    const readable = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        try {
          for await (const chunk of responseStream) {
            if (chunk.text) {
              controller.enqueue(encoder.encode(chunk.text));
            }
          }
          controller.close();
        } catch (e) {
          console.error("Stream error", e);
          controller.error(e);
        }
      }
    });

    return new Response(readable, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Transfer-Encoding": "chunked",
      }
    });
  } catch (error: unknown) {
    console.error("Summary API Error:", error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(message, { status: 500 });
  }
}
