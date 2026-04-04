import { GoogleGenAI } from "@google/genai";
import { type NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { messages } = body;

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return new Response("API Key not configured", { status: 500 });
    }

    const ai = new GoogleGenAI({ apiKey });

    const systemInstruction = `You are an expert AI tutor evaluating a session between yourself and a student preparing for an AP exam.
Review the conversation history and provide a concise, encouraging "Session Summary" for the student.
Format using markdown. Highlight strengths, areas for improvement, and suggest what they should study next based on their performance. Keep it under 200 words.`;

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
      model: "gemini-2.5-flash",
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
