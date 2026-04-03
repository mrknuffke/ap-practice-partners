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

// Define the extraction prompt
const promptText = `
You are an expert AP Curriculum analyst.
Attached is the official Course and Exam Description (CED) for an AP Course.
Analyze this entire document and extract the core curriculum framework required to build a highly aligned AI Tutor prompt for this course.

Extract the following information and output it DIRECTLY AND ONLY AS A VALID JSON OBJECT, matching this exact schema:

{
  "courseName": "Full name of the AP course",
  "units": [
    {
      "unitNumber": "e.g., 1",
      "unitTitle": "Title of the unit",
      "examWeight": "e.g., 8-11%"
    }
  ],
  "sciencePractices": "Detailed paragraph describing the core skills assessed (e.g., Mathematical Routines, Model Analysis, Argumentation), including any specific percentages if mentioned.",
  "examFormat": {
    "multipleChoice": "Number of questions, time limit, and percentage of total score",
    "freeResponse": "Number of questions, time limit, and percentage of total score"
  },
  "antiPatterns": "A list of topics or depths explicitly stated as 'out of scope' or 'not assessed' in the CED."
}

Do NOT include any markdown formatting (like \`\`\`json) in your response. Output the raw JSON text directly.
If you cannot determine a field, provide a reasonable summary or leave empty string if totally unknown.
`;

async function processPdf(pdfPath, fileName) {
  const courseBaseName = fileName.replace('.pdf', '');
  const outPath = path.join(outputDir, `${courseBaseName}.json`);

  if (fs.existsSync(outPath)) {
    console.log(`Skipping ${fileName}, already extracted.`);
    return;
  }

  console.log(`Uploading ${fileName} to Gemini...`);
  try {
    // 1. Upload to File API
    const uploadResult = await ai.files.upload({
      file: pdfPath,
      mimeType: 'application/pdf',
      displayName: courseBaseName,
    });
    const fileUri = uploadResult.name;

    console.log(`Uploaded successfully as ${fileUri}. Requesting extraction...`);

    // 2. Call Gemini
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-pro', // use pro for large document reasoning
      contents: [
         { role: 'user', parts: [ { fileData: { fileUri, mimeType: 'application/pdf' } }, { text: promptText } ] }
      ],
      config: {
        responseMimeType: 'application/json'
      }
    });

    const jsonText = response.text || "{}";

    // 3. Save JSON
    fs.writeFileSync(outPath, jsonText, 'utf8');
    console.log(`Successfully extracted and saved data for ${fileName}`);

    // Optional: Delete file from API to save space
    try {
      await ai.files.delete({ name: fileUri });
    } catch(err) {
      console.log(`Failed to cleanup file ${fileUri}:`, err.message);
    }

  } catch (error) {
    console.error(`Error processing ${fileName}:`, error);
  }
}

async function run() {
  const files = fs.readdirSync(cedsDir).filter(f => f.endsWith('.pdf'));
  console.log(`Found ${files.length} PDFs to process.`);

  for (const file of files) {
    await processPdf(path.join(cedsDir, file), file);
  }
  
  console.log('Finished processing all CEDs.');
}

run();
