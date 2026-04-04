import fs from 'fs';
import path from 'path';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

// Load env vars
dotenv.config({ path: '.env.local' });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const cedsDir = path.resolve(__dirname, '../../SAS AP CEDs');
const outputDir = path.resolve(__dirname, '../src/constants/extracted-ceds');

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Skip these files — portfolio/process courses, clarification supplements
const SKIP_SUBSTRINGS = [
  'ap-art-and-design',
  'ap-seminar',
  'ap-research',
  '-clarification',
  '-clarifications',
];

// Files to skip even on force-reextract (hand-curated or PDF incompatible)
const MANUAL_CURATED = [
  'ap-african-american-studies',
];

// Set to true to re-extract all files (overwrite existing JSONs)
const FORCE_REEXTRACT = false;

// Define the extraction prompt
const promptText = `
You are an expert AP Curriculum analyst.
Attached is the official Course and Exam Description (CED) for an AP Course.
Analyze this entire document carefully and extract the core curriculum framework required to build a highly aligned AI Tutor prompt for this course.

Extract the following information and output it DIRECTLY AND ONLY AS A VALID JSON OBJECT, matching this exact schema:

{
  "courseName": "Full official name of the AP course (e.g., 'AP United States History')",
  "courseSlug": "kebab-case URL slug for this course (e.g., 'ap-us-history')",
  "practicesLabel": "The name of the skill/practice framework for this course. Use one of: 'Science Practices', 'Mathematical Practices', 'Historical Thinking Skills and Reasoning Processes', 'Communication Modes', 'Computational Thinking Practices', 'English Language and Composition Skills', 'English Literature and Composition Skills', 'Economics Reasoning Skills', 'Political Science Practices', 'Interdisciplinary Practices' — choose whichever best matches the course.",
  "practices": "Detailed paragraph describing the core skills/practices assessed, including specific weighting percentages for each practice if mentioned in the CED.",
  "units": [
    {
      "unitNumber": "e.g., 1",
      "unitTitle": "Title of the unit",
      "examWeight": "e.g., 8-11% (use 'N/A' if not weighted)",
      "keyTopics": ["4 to 8 specific content topics the CED explicitly lists or emphasizes within this unit. Use the actual topic/learning objective language from the CED, not summaries. Examples: 'Cell membrane structure and the fluid mosaic model', 'Chi-square statistical test for genetics data', 'Causes of the Mexican-American War'"]
    }
  ],
  "examFormat": {
    "multipleChoice": "Number of questions, time limit, and percentage of total score (or 'N/A' if not applicable)",
    "freeResponse": "Number/types of free response questions, time limit, and percentage of total score (or 'N/A' if not applicable)"
  },
  "antiPatterns": "A description of topics, depths, or question types explicitly stated as out of scope, not assessed, or that students should NOT be expected to memorize/perform. If none stated, describe what the CED explicitly de-emphasizes."
}

IMPORTANT for keyTopics:
- Pull directly from the CED's learning objectives, essential knowledge statements, or topic lists — do not invent topics.
- Use specific, testable language (e.g., 'Enzyme inhibition: competitive vs. noncompetitive' not 'enzymes').
- For history courses, include major events, turning points, and thematic concepts the CED names.
- For math courses, include specific theorems, techniques, and problem types listed in the CED.
- For language courses, include specific communication tasks and cultural comparison themes.
- Aim for 5–7 keyTopics per unit; 4 is the minimum, 8 is the maximum.

Do NOT include any markdown formatting (like \`\`\`json) in your response. Output the raw JSON text directly.
If you cannot determine a field, provide a reasonable summary based on the document or leave as empty string if totally unknown.
`;

async function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function generateWithRetry(params, maxRetries = 3) {
  const delays = [30000, 60000, 120000];
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await ai.models.generateContent(params);
    } catch (error) {
      const isRateLimit = error?.status === 429 || error?.status === 503 ||
        (error?.message && (error.message.includes('429') || error.message.includes('503') || error.message.includes('quota') || error.message.includes('rate')));

      if (isRateLimit && attempt < maxRetries) {
        const waitMs = delays[attempt];
        console.log(`Rate limit hit (attempt ${attempt + 1}/${maxRetries + 1}). Waiting ${waitMs / 1000}s before retry...`);
        await sleep(waitMs);
        continue;
      }
      throw error;
    }
  }
}

async function processPdf(pdfPath, fileName) {
  const courseBaseName = fileName
    .replace('-course-and-exam-description', '')
    .replace('.pdf', '');
  const outPath = path.join(outputDir, `${courseBaseName}.json`);

  // Skip hand-curated files regardless of FORCE_REEXTRACT
  if (MANUAL_CURATED.some(s => courseBaseName.includes(s))) {
    console.log(`Skipping ${courseBaseName}.json (hand-curated, not overwriting)`);
    return;
  }

  if (!FORCE_REEXTRACT && fs.existsSync(outPath)) {
    console.log(`Skipping ${fileName}, already extracted to ${courseBaseName}.json`);
    return;
  }

  console.log(`\nUploading ${fileName} to Gemini...`);
  try {
    // 1. Upload to File API
    const uploadResult = await ai.files.upload({
      file: pdfPath,
      mimeType: 'application/pdf',
      displayName: courseBaseName,
    });
    // uploadResult.name is the short resource name (e.g. "files/abc123"), used for get/delete
    // uploadResult.uri is the full URI needed for fileData in content requests
    const fileName2 = uploadResult.name;
    const fileUri = uploadResult.uri;

    console.log(`Uploaded as ${fileName2} (uri: ${fileUri}). Waiting for processing...`);

    // Poll until the file is active
    let fileState = 'PROCESSING';
    while (fileState === 'PROCESSING') {
      const fileInfo = await ai.files.get({ name: fileName2 });
      fileState = fileInfo.state;
      if (fileState === 'FAILED') {
        throw new Error("File processing failed.");
      }
      if (fileState === 'PROCESSING') {
        console.log("Still processing, waiting 5 seconds...");
        await sleep(5000);
      }
    }

    console.log(`File is ACTIVE. Requesting extraction...`);

    // 2. Call Gemini with retry logic
    const response = await generateWithRetry({
      model: 'gemini-2.5-pro',
      contents: [
        { role: 'user', parts: [{ fileData: { fileUri, mimeType: 'application/pdf' } }, { text: promptText }] }
      ],
      config: {
        responseMimeType: 'application/json'
      }
    });

    const jsonText = response.text || "{}";

    // 3. Save JSON
    fs.writeFileSync(outPath, jsonText, 'utf8');
    console.log(`Saved: ${courseBaseName}.json`);

    // Optional: Delete file from API to save quota
    try {
      await ai.files.delete({ name: fileName2 });
    } catch (err) {
      console.log(`Could not cleanup file ${fileName2}: ${err.message}`);
    }

  } catch (error) {
    console.error(`Error processing ${fileName}:`, error);
  }
}

async function run() {
  const allFiles = fs.readdirSync(cedsDir).filter(f => f.endsWith('.pdf'));
  const files = allFiles.filter(f => !SKIP_SUBSTRINGS.some(s => f.includes(s)));

  const skipped = allFiles.filter(f => SKIP_SUBSTRINGS.some(s => f.includes(s)));
  if (skipped.length > 0) {
    console.log(`Skipping ${skipped.length} excluded files: ${skipped.join(', ')}`);
  }

  console.log(`Processing ${files.length} PDFs...`);

  for (let i = 0; i < files.length; i++) {
    await processPdf(path.join(cedsDir, files[i]), files[i]);

    // 15-second pause between files to avoid rate limits (skip after last file)
    if (i < files.length - 1) {
      console.log('Waiting 15s before next file...');
      await sleep(15000);
    }
  }

  console.log('\nFinished processing all CEDs.');
}

run();
