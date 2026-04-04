import fs from 'fs';
import path from 'path';
import { CourseEntry } from '@/constants/courses';

const CED_DIR = path.resolve(process.cwd(), "src/constants/extracted-ceds");

export interface CedData {
  courseName: string;
  courseSlug?: string;
  practicesLabel?: string;
  practices?: string;
  sciencePractices?: string;
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

export function loadCedData(entry: CourseEntry, examParam?: string | null): CedData | null {
  if (entry.isPhysicsC && Array.isArray(entry.cedFile)) {
    const [mechFile, emFile] = entry.cedFile as string[];
    const mechData = loadCedJson(mechFile);
    const emData = loadCedJson(emFile);

    if (!mechData && !emData) return null;

    const examLabel = examParam === 'em'
      ? 'AP Physics C: Electricity and Magnetism'
      : 'AP Physics C: Mechanics';

    const primaryData = examParam === 'em' ? emData : mechData;
    const secondaryData = examParam === 'em' ? mechData : emData;
    const secondaryLabel = examParam === 'em' ? 'Mechanics' : 'E&M';

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

export function buildCedBlock(cedData: CedData, entry: CourseEntry): string {
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
