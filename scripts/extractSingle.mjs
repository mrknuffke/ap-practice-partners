import fs from 'fs';
import path from 'path';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

dotenv.config({ path: '.env.local' });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const pdfPath = path.resolve(__dirname, '../../SAS AP CEDs/ap-african-american-studies-course-and-exam-description.pdf');
const outPath = path.resolve(__dirname, '../src/constants/extracted-ceds/ap-african-american-studies.json');

const promptText = `You are an expert AP Curriculum analyst.
Attached is the official Course and Exam Description (CED) for AP African American Studies.
Analyze this document and output ONLY a valid JSON object with this exact schema:

{
  "courseName": "AP African American Studies",
  "courseSlug": "ap-african-american-studies",
  "practicesLabel": "Interdisciplinary Practices",
  "practices": "Detailed paragraph describing the core skills assessed, including any specific weighting percentages.",
  "units": [
    { "unitNumber": "1", "unitTitle": "Title", "examWeight": "e.g. 20-25% or N/A" }
  ],
  "examFormat": {
    "multipleChoice": "Number of questions, time, percentage",
    "freeResponse": "Number/types, time, percentage"
  },
  "antiPatterns": "Topics or depths explicitly out of scope or de-emphasized in the CED."
}

No markdown formatting. Raw JSON only.`;

async function run() {
  console.log('Uploading AP African American Studies PDF...');
  const uploadResult = await ai.files.upload({
    file: pdfPath,
    mimeType: 'application/pdf',
    displayName: 'ap-african-american-studies',
  });

  const fileName = uploadResult.name;
  const fileUri = uploadResult.uri;
  console.log(`Uploaded: ${fileName} (${fileUri})`);

  let state = 'PROCESSING';
  while (state === 'PROCESSING') {
    const info = await ai.files.get({ name: fileName });
    state = info.state;
    if (state === 'FAILED') throw new Error('File processing failed');
    if (state === 'PROCESSING') {
      console.log('Still processing...');
      await new Promise(r => setTimeout(r, 5000));
    }
  }
  console.log('File active. Extracting...');

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-pro',
    contents: [{ role: 'user', parts: [{ fileData: { fileUri, mimeType: 'application/pdf' } }, { text: promptText }] }],
    config: { responseMimeType: 'application/json' }
  });

  fs.writeFileSync(outPath, response.text || '{}', 'utf8');
  console.log('Saved: ap-african-american-studies.json');

  try { await ai.files.delete({ name: fileName }); } catch {}
}

run().catch(console.error);
