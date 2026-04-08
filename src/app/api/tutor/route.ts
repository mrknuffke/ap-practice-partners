import { GoogleGenAI } from "@google/genai";
import { type NextRequest } from "next/server";
import { COURSE_BY_SLUG } from '@/constants/courses';
import {
  AP_PREP_ACTIVE_LEARNING_RULES,
  INTERACTION_MODES_INTRO,
  OFF_TOPIC_RULES,
  PEDAGOGY_ADAPTATIONS,
  CONTEXTUAL_METADATA_INSTRUCTION,
} from '@/constants/activeLearning';

import { loadCedData, buildCedBlock } from "@/lib/ced";


export async function POST(req: NextRequest) {
  try {
    // Auth check
    const classCode = req.headers.get("x-classroom-code");
    const validCodes = (process.env.CLASSROOM_CODE || "").split(",").map(c => c.trim());

    if (!classCode || !validCodes.includes(classCode)) {
      return new Response("Unauthorized", { status: 401 });
    }

    const body = await req.json();
    const { slug, examParam, messages } = body;

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return new Response("API Key not configured", { status: 500 });
    }

    // Resolve course entry from registry
    const entry = COURSE_BY_SLUG[slug];
    if (!entry) {
      return new Response(`Unknown course slug: ${slug}`, { status: 400 });
    }

    const cedData = loadCedData(entry, examParam);

    // Build system prompt from 5 sections
    const sections: string[] = [];

    // 1. Role + CED scope
    let courseLabel = entry.displayName;
    if (entry.isPhysicsC) {
      courseLabel = examParam === 'em' ? 'AP Physics C: Electricity and Magnetism' : 'AP Physics C: Mechanics';
    } else if (entry.isCalcABBC) {
      courseLabel = examParam === 'bc' ? 'AP Calculus BC' : 'AP Calculus AB';
    }

    sections.push(
      `You are an expert AI tutor for ${courseLabel}, acting as an active-learning study partner for students preparing for the AP exam.\n\nYou are strictly scoped to the official College Board Course and Exam Description (CED) for this course. Do not teach, assess, or reference content outside this scope.`
    );

    // 2. CED data block
    if (cedData) {
      sections.push(buildCedBlock(cedData, entry));
    } else {
      sections.push(
        `## COURSE SCOPE NOTE\nOfficial CED data for this course could not be loaded. Use your best knowledge of the AP ${entry.displayName} curriculum as published by College Board, and stay within typical AP exam scope.`
      );
    }

    // 3. Active learning rules
    sections.push(AP_PREP_ACTIVE_LEARNING_RULES);

    // 4. Subject-specific pedagogy adaptation
    const pedagogyAdaptation = PEDAGOGY_ADAPTATIONS[entry.subjectArea];
    if (pedagogyAdaptation) {
      sections.push(pedagogyAdaptation);
    }

    // 5. Session opening instruction + off-topic rules
    sections.push(INTERACTION_MODES_INTRO);
    sections.push(OFF_TOPIC_RULES);

    // 6. Contextual metadata instruction (powers the live sidebar)
    sections.push(CONTEXTUAL_METADATA_INSTRUCTION);

    const systemInstruction = sections.join('\n\n---\n\n');

    const ai = new GoogleGenAI({ apiKey });

    const formattedMessages = messages.length > 0
      ? messages.map((m: { role: string; content: string; attachments?: { mimeType: string; data: string }[] }) => {
          const parts: { text?: string; inlineData?: { mimeType: string; data: string } }[] = [{ text: m.content }];
          if (m.attachments && m.attachments.length > 0) {
            m.attachments.forEach(att => {
              parts.push({
                inlineData: {
                  mimeType: att.mimeType,
                  data: att.data
                }
              });
            });
          }
          return {
            role: m.role === 'assistant' ? 'model' : 'user',
            parts
          };
        })
      : [{ 
          role: 'user', 
          parts: [{ 
            text: entry.subjectArea === 'language' 
              ? 'Hello! Please greet me warmly. Since this is a World Language course, please ask me whether I would like to proceed in English or in the target language before offering the standard study modes. Also briefly mention that you can generate speaking practice prompts for oral assessment.' 
              : `Hello! Please greet me warmly and introduce yourself. In your opening message, explicitly let me know that beyond answering questions, you can also generate: (1) MCQ practice sets, (2) FRQ simulations, (3) Source/DBQ exercises${entry.subjectArea === 'english' ? ', and (4) timed writing prompts' : ''}. Encourage me to ask you to start any of these when I am ready.` 
          }] 
        }];

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
    console.error("Tutor API Error:", error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(message, { status: 500 });
  }
}
