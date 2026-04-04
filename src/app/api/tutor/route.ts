import { GoogleGenAI } from "@google/genai";
import { type NextRequest } from "next/server";
import fs from 'fs';
import path from 'path';
import { COURSE_BY_SLUG } from '@/constants/courses';
import type { CourseEntry } from '@/constants/courses';
import {
  AP_PREP_ACTIVE_LEARNING_RULES,
  INTERACTION_MODES_INTRO,
  OFF_TOPIC_RULES,
  PEDAGOGY_ADAPTATIONS,
} from '@/constants/activeLearning';

const CED_DIR = path.resolve(process.cwd(), "src/constants/extracted-ceds");

interface CedData {
  courseName: string;
  courseSlug?: string;
  practicesLabel?: string;
  practices?: string;
  sciencePractices?: string; // legacy field name — handled in buildCedBlock
  units?: Array<{ unitNumber: string; unitTitle: string; examWeight: string; keyTopics?: string[] }>;
  examFormat?: { multipleChoice?: string; freeResponse?: string };
  antiPatterns?: string;
}

function loadCedJson(stem: string): CedData | null {
  try {
    const filePath = path.join(CED_DIR, `${stem}.json`);
    if (!fs.existsSync(filePath)) return null;
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch {
    return null;
  }
}

function loadCedData(entry: CourseEntry, physicsCExam?: string | null): CedData | null {
  if (entry.isPhysicsC && Array.isArray(entry.cedFile)) {
    const [mechFile, emFile] = entry.cedFile as string[];
    const mechData = loadCedJson(mechFile);
    const emData = loadCedJson(emFile);

    if (!mechData && !emData) return null;

    const examLabel = physicsCExam === 'em'
      ? 'AP Physics C: Electricity and Magnetism'
      : 'AP Physics C: Mechanics';

    const primaryData = physicsCExam === 'em' ? emData : mechData;
    const secondaryData = physicsCExam === 'em' ? mechData : emData;
    const secondaryLabel = physicsCExam === 'em' ? 'Mechanics' : 'E&M';

    return {
      courseName: examLabel,
      courseSlug: entry.slug,
      practicesLabel: 'Science Practices',
      practices: primaryData?.practices ?? primaryData?.sciencePractices
        ?? 'Calculus-based mechanics and electromagnetism with emphasis on Mathematical Routines and Argumentation.',
      units: primaryData?.units ?? [],
      examFormat: primaryData?.examFormat ?? { multipleChoice: '35 MCQ, 45 min, 50%', freeResponse: '3 FRQ, 45 min, 50%' },
      antiPatterns: [
        primaryData?.antiPatterns ?? '',
        secondaryData
          ? `Note: ${secondaryLabel} topics are covered by a separate exam and are out of scope for this session.`
          : '',
      ].filter(Boolean).join(' '),
    };
  }

  const stem = typeof entry.cedFile === 'string' ? entry.cedFile : entry.cedFile[0];
  return loadCedJson(stem);
}

function buildCedBlock(cedData: CedData, entry: CourseEntry): string {
  const practicesLabel = cedData.practicesLabel ?? 'Core Practices';
  const practicesText = cedData.practices ?? cedData.sciencePractices ?? '';

  const unitsText = cedData.units && cedData.units.length > 0
    ? cedData.units.map(u => {
        const header = `  Unit ${u.unitNumber}: ${u.unitTitle} (${u.examWeight})`;
        const topics = u.keyTopics && u.keyTopics.length > 0
          ? '\n' + u.keyTopics.map(t => `    - ${t}`).join('\n')
          : '';
        return header + topics;
      }).join('\n')
    : '  (Unit data not available — use your general knowledge of the CED)';

  const calcNote = (entry.subjectArea === 'science' && entry.slug.includes('physics-c'))
    ? '\nIMPORTANT: This is a CALCULUS-BASED course. Always use derivatives and integrals. Never use algebra-only solutions.'
    : '';

  return `## COURSE SCOPE: ${cedData.courseName}

### Unit Structure & Exam Weighting:
${unitsText}

### ${practicesLabel}:
${practicesText}

### Exam Format:
- Multiple Choice: ${cedData.examFormat?.multipleChoice ?? 'See CED'}
- Free Response: ${cedData.examFormat?.freeResponse ?? 'See CED'}
${calcNote}
### Topics Outside CED Scope (NEVER assess these):
${cedData.antiPatterns ?? 'Avoid topics not listed in the unit structure above.'}`;
}

export async function POST(req: NextRequest) {
  try {
    // Auth check
    const classCode = req.headers.get("x-classroom-code");
    const validCodes = (process.env.CLASSROOM_CODE || "").split(",").map(c => c.trim());

    if (!classCode || !validCodes.includes(classCode)) {
      return new Response("Unauthorized", { status: 401 });
    }

    const body = await req.json();
    const { slug, physicsCExam, messages } = body;

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return new Response("API Key not configured", { status: 500 });
    }

    // Resolve course entry from registry
    const entry = COURSE_BY_SLUG[slug];
    if (!entry) {
      return new Response(`Unknown course slug: ${slug}`, { status: 400 });
    }

    const cedData = loadCedData(entry, physicsCExam);

    // Build system prompt from 5 sections
    const sections: string[] = [];

    // 1. Role + CED scope
    const courseLabel = physicsCExam === 'em'
      ? 'AP Physics C: Electricity and Magnetism'
      : physicsCExam === 'mechanics'
      ? 'AP Physics C: Mechanics'
      : entry.displayName;

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

    const systemInstruction = sections.join('\n\n---\n\n');

    const ai = new GoogleGenAI({ apiKey });

    const formattedMessages = messages.length > 0
      ? messages.map((m: { role: string; content: string }) => ({
          role: m.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: m.content }]
        }))
      : [{ role: 'user', parts: [{ text: 'Hello! Please greet me and offer the study modes.' }] }];

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
