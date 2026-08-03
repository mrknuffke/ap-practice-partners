/**
 * extractChiefReaderNotes.mjs
 *
 * Extracts a synthesized briefing from a College Board Chief Reader Report PDF
 * and merges it into the corresponding CED JSON as an additive `chiefReaderNotes` field.
 *
 * Usage:
 *   node scripts/extractChiefReaderNotes.mjs <pdf-filename> <ced-json-stem> <course-name>
 *
 * Example:
 *   node scripts/extractChiefReaderNotes.mjs \
 *     ap-biology-chief-reader-recommendations.pdf \
 *     ap-biology \
 *     "AP Biology"
 *
 * The PDF is expected to be in the project's "SAS AP CEDs" directory
 * (../../SAS\ AP\ CEDs/ relative to this script).
 */

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

// --- Parse CLI args ---
const args = process.argv.slice(2);
if (args.length < 3) {
  console.error('Usage: node scripts/extractChiefReaderNotes.mjs <pdf-filename> <ced-json-stem> <course-name>');
  console.error('Example: node scripts/extractChiefReaderNotes.mjs ap-biology-chief-reader-recommendations.pdf ap-biology "AP Biology"');
  process.exit(1);
}

const [pdfFilename, cedStem, courseName] = args;
const pdfPath = path.resolve(__dirname, '../../SAS AP CEDs', pdfFilename);
const targetCedFile = path.resolve(__dirname, '../src/constants/extracted-ceds', `${cedStem}.json`);

const promptText = `
You are an expert AP exam consultant. Attached is a College Board Chief Reader Report / Chief Reader Recommendations document for ${courseName}, summarizing patterns AP Reading graders observed across multiple years of scoring student free-response answers.

Analyze the entire document and produce a concise, actionable briefing (400-700 words, plain text, no markdown headers) that an AI grading/tutoring assistant can use to grade FRQs and coach students the way a real AP reader would. Cover, where the document discusses them:
- Common misconceptions or errors that repeatedly cost students points
- Specific phrasing, precision, or reasoning readers require to award credit (vs. vague answers that look right but don't earn points)
- Differences between what students commonly write and what actually satisfies the rubric
- Any recurring advice Chief Readers give teachers about how to prepare students for FRQs
- Patterns specific to particular question types or units, if mentioned

Write it as flowing guidance paragraphs (not a list), synthesized from across all years covered in the document, prioritizing patterns that recur across multiple years over one-off notes. Do not include any preamble like "Here is a summary" — output only the guidance text itself.
`;

async function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function generateWithRetry(params, maxRetries = 4) {
  const delays = [30000, 60000, 120000, 180000];
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await ai.models.generateContent(params);
    } catch (error) {
      const isRetryable = error?.status === 429 || error?.status === 503 ||
        (error?.message && (error.message.includes('429') || error.message.includes('503') || error.message.includes('quota') || error.message.includes('rate') || error.message.includes('UNAVAILABLE')));

      if (isRetryable && attempt < maxRetries) {
        const waitMs = delays[attempt];
        console.log(`Retryable error (attempt ${attempt + 1}/${maxRetries + 1}). Waiting ${waitMs / 1000}s before retry...`);
        await sleep(waitMs);
        continue;
      }
      throw error;
    }
  }
}

async function run() {
  if (!fs.existsSync(pdfPath)) {
    console.error(`PDF not found at ${pdfPath}`);
    console.error(`Place the Chief Reader Report PDF in the "SAS AP CEDs" directory.`);
    process.exit(1);
  }
  if (!fs.existsSync(targetCedFile)) {
    console.error(`Target CED file not found at ${targetCedFile} — run the main course extraction first.`);
    process.exit(1);
  }

  console.log(`Uploading ${path.basename(pdfPath)} to Gemini...`);
  const uploadResult = await ai.files.upload({
    file: pdfPath,
    mimeType: 'application/pdf',
    displayName: `chief-reader-${cedStem}`,
  });

  const fileName = uploadResult.name;
  const fileUri = uploadResult.uri;
  console.log(`Uploaded as ${fileName}. Waiting for processing...`);

  let state = 'PROCESSING';
  while (state === 'PROCESSING') {
    const info = await ai.files.get({ name: fileName });
    state = info.state;
    if (state === 'FAILED') throw new Error('File processing failed.');
    if (state === 'PROCESSING') {
      console.log('Still processing, waiting 5 seconds...');
      await sleep(5000);
    }
  }
  console.log('File is ACTIVE. Requesting summary...');

  const response = await generateWithRetry({
    model: 'gemini-3.5-flash',
    contents: [
      { role: 'user', parts: [{ fileData: { fileUri, mimeType: 'application/pdf' } }, { text: promptText }] }
    ],
  });

  const notes = (response.text || '').trim();
  if (!notes) throw new Error('Gemini returned an empty response.');

  const cedData = JSON.parse(fs.readFileSync(targetCedFile, 'utf8'));
  cedData.chiefReaderNotes = notes;
  fs.writeFileSync(targetCedFile, JSON.stringify(cedData, null, 2), 'utf8');
  console.log(`Merged chiefReaderNotes into ${path.basename(targetCedFile)}`);

  try {
    await ai.files.delete({ name: fileName });
  } catch (err) {
    console.log(`Could not cleanup file ${fileName}: ${err.message}`);
  }
}

run().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
