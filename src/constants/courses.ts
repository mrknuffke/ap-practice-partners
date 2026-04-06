export type SubjectArea =
  | 'science'
  | 'math'
  | 'history'
  | 'social'
  | 'english'
  | 'cs'
  | 'economics'
  | 'language'
  | 'other';

export type CourseEntry = {
  displayName: string;
  slug: string;
  cedFile: string | string[];
  subjectArea: SubjectArea;
  emoji: string;
  color: string;
  isPhysicsC?: boolean;
  isCalcABBC?: boolean;
};

export const COURSES: CourseEntry[] = [
  // Science
  {
    displayName: 'AP Biology',
    slug: 'ap-biology',
    cedFile: 'ap-biology',
    subjectArea: 'science',
    emoji: '🧬',
    color: 'emerald',
  },
  {
    displayName: 'AP Chemistry',
    slug: 'ap-chemistry',
    cedFile: 'ap-chemistry',
    subjectArea: 'science',
    emoji: '⚗️',
    color: 'violet',
  },
  {
    displayName: 'AP Environmental Science',
    slug: 'ap-environmental-science',
    cedFile: 'ap-environmental-science',
    subjectArea: 'science',
    emoji: '🌍',
    color: 'teal',
  },
  {
    displayName: 'AP Physics 1',
    slug: 'ap-physics-1',
    cedFile: 'ap-physics-1',
    subjectArea: 'science',
    emoji: '⚡',
    color: 'cyan',
  },
  {
    displayName: 'AP Physics 2',
    slug: 'ap-physics-2',
    cedFile: 'ap-physics-2',
    subjectArea: 'science',
    emoji: '🔭',
    color: 'sky',
  },
  {
    displayName: 'AP Physics C',
    slug: 'ap-physics-c',
    cedFile: ['ap-physics-c-mechanics', 'ap-physics-c-electricity-and-magnetism'],
    subjectArea: 'science',
    emoji: '🧲',
    color: 'indigo',
    isPhysicsC: true,
  },

  // Math
  {
    displayName: 'AP Calculus AB/BC',
    slug: 'ap-calculus-ab-bc',
    cedFile: 'ap-calculus-ab-and-bc',
    subjectArea: 'math',
    emoji: '📐',
    color: 'rose',
    isCalcABBC: true,
  },
  {
    displayName: 'AP Statistics',
    slug: 'ap-statistics',
    cedFile: 'ap-statistics',
    subjectArea: 'math',
    emoji: '📊',
    color: 'pink',
  },

  // History
  {
    displayName: 'AP US History',
    slug: 'ap-us-history',
    cedFile: 'ap-us-history',
    subjectArea: 'history',
    emoji: '🏛️',
    color: 'amber',
  },
  {
    displayName: 'AP US Government & Politics',
    slug: 'ap-us-government-and-politics',
    cedFile: 'ap-us-government-and-politics',
    subjectArea: 'social',
    emoji: '🗳️',
    color: 'orange',
  },
  {
    displayName: 'AP Comparative Government & Politics',
    slug: 'ap-comparative-government-and-politics',
    cedFile: 'ap-comparative-government-and-politics',
    subjectArea: 'social',
    emoji: '🌐',
    color: 'yellow',
  },

  // English
  {
    displayName: 'AP English Language & Composition',
    slug: 'ap-english-language-and-composition',
    cedFile: 'ap-english-language-and-composition',
    subjectArea: 'english',
    emoji: '✍️',
    color: 'blue',
  },
  {
    displayName: 'AP English Literature & Composition',
    slug: 'ap-english-literature-and-composition',
    cedFile: 'ap-english-literature-and-composition',
    subjectArea: 'english',
    emoji: '📚',
    color: 'purple',
  },

  // Computer Science
  {
    displayName: 'AP Computer Science A',
    slug: 'ap-computer-science-a',
    cedFile: 'ap-computer-science-a',
    subjectArea: 'cs',
    emoji: '💻',
    color: 'lime',
  },

  // Economics
  {
    displayName: 'AP Macroeconomics',
    slug: 'ap-macroeconomics',
    cedFile: 'ap-macroeconomics',
    subjectArea: 'economics',
    emoji: '📈',
    color: 'green',
  },
  {
    displayName: 'AP Microeconomics',
    slug: 'ap-microeconomics',
    cedFile: 'ap-microeconomics',
    subjectArea: 'economics',
    emoji: '💰',
    color: 'emerald',
  },

  // Language
  {
    displayName: 'AP Spanish Language & Culture',
    slug: 'ap-spanish-language-and-culture',
    cedFile: 'ap-spanish-language-and-culture',
    subjectArea: 'language',
    emoji: '🇪🇸',
    color: 'red',
  },
  {
    displayName: 'AP French Language & Culture',
    slug: 'ap-french-language-and-culture',
    cedFile: 'ap-french-language-and-culture',
    subjectArea: 'language',
    emoji: '🇫🇷',
    color: 'blue',
  },
  {
    displayName: 'AP Chinese Language & Culture',
    slug: 'ap-chinese-language-and-culture',
    cedFile: 'ap-chinese-language-and-culture',
    subjectArea: 'language',
    emoji: '🇨🇳',
    color: 'red',
  },

  // Other
  {
    displayName: 'AP African American Studies',
    slug: 'ap-african-american-studies',
    cedFile: 'ap-african-american-studies',
    subjectArea: 'other',
    emoji: '📖',
    color: 'amber',
  },
];

export const COURSE_BY_SLUG: Record<string, CourseEntry> = Object.fromEntries(
  COURSES.map(c => [c.slug, c])
);

export const SUBJECT_LABELS: Record<SubjectArea, string> = {
  science: 'Science',
  math: 'Mathematics',
  history: 'History',
  social: 'Government & Politics',
  english: 'English',
  cs: 'Computer Science',
  economics: 'Economics',
  language: 'World Language',
  other: 'Interdisciplinary',
};

export const SUBJECT_ORDER: SubjectArea[] = [
  'science',
  'math',
  'history',
  'social',
  'english',
  'cs',
  'economics',
  'language',
  'other',
];

export const COURSES_BY_SUBJECT: Record<SubjectArea, CourseEntry[]> = (() => {
  const result = {} as Record<SubjectArea, CourseEntry[]>;
  for (const subject of SUBJECT_ORDER) {
    result[subject] = COURSES.filter(c => c.subjectArea === subject);
  }
  return result;
})();

// Tailwind color classes — full strings required for JIT scanning
export const COLOR_CLASSES: Record<string, {
  border: string;
  hover: string;
  badge: string;
  text: string;
  glow: string;
}> = {
  emerald: {
    border: 'border-emerald-500/30',
    hover: 'hover:border-emerald-500/60',
    badge: 'bg-emerald-500/20',
    text: 'text-emerald-700 dark:text-emerald-300',
    glow: 'hover:shadow-[0_0_20px_rgba(16,185,129,0.15)]',
  },
  violet: {
    border: 'border-violet-500/30',
    hover: 'hover:border-violet-500/60',
    badge: 'bg-violet-500/20',
    text: 'text-violet-700 dark:text-violet-300',
    glow: 'hover:shadow-[0_0_20px_rgba(139,92,246,0.15)]',
  },
  teal: {
    border: 'border-teal-500/30',
    hover: 'hover:border-teal-500/60',
    badge: 'bg-teal-500/20',
    text: 'text-teal-700 dark:text-teal-300',
    glow: 'hover:shadow-[0_0_20px_rgba(20,184,166,0.15)]',
  },
  cyan: {
    border: 'border-cyan-500/30',
    hover: 'hover:border-cyan-500/60',
    badge: 'bg-cyan-500/20',
    text: 'text-cyan-700 dark:text-cyan-300',
    glow: 'hover:shadow-[0_0_20px_rgba(6,182,212,0.15)]',
  },
  sky: {
    border: 'border-sky-500/30',
    hover: 'hover:border-sky-500/60',
    badge: 'bg-sky-500/20',
    text: 'text-sky-700 dark:text-sky-300',
    glow: 'hover:shadow-[0_0_20px_rgba(14,165,233,0.15)]',
  },
  indigo: {
    border: 'border-indigo-500/30',
    hover: 'hover:border-indigo-500/60',
    badge: 'bg-indigo-500/20',
    text: 'text-indigo-700 dark:text-indigo-300',
    glow: 'hover:shadow-[0_0_20px_rgba(99,102,241,0.15)]',
  },
  rose: {
    border: 'border-rose-500/30',
    hover: 'hover:border-rose-500/60',
    badge: 'bg-rose-500/20',
    text: 'text-rose-700 dark:text-rose-300',
    glow: 'hover:shadow-[0_0_20px_rgba(244,63,94,0.15)]',
  },
  pink: {
    border: 'border-pink-500/30',
    hover: 'hover:border-pink-500/60',
    badge: 'bg-pink-500/20',
    text: 'text-pink-700 dark:text-pink-300',
    glow: 'hover:shadow-[0_0_20px_rgba(236,72,153,0.15)]',
  },
  amber: {
    border: 'border-amber-500/30',
    hover: 'hover:border-amber-500/60',
    badge: 'bg-amber-500/20',
    text: 'text-amber-700 dark:text-amber-300',
    glow: 'hover:shadow-[0_0_20px_rgba(245,158,11,0.15)]',
  },
  orange: {
    border: 'border-orange-500/30',
    hover: 'hover:border-orange-500/60',
    badge: 'bg-orange-500/20',
    text: 'text-orange-700 dark:text-orange-300',
    glow: 'hover:shadow-[0_0_20px_rgba(249,115,22,0.15)]',
  },
  yellow: {
    border: 'border-yellow-600/30',
    hover: 'hover:border-yellow-600/60',
    badge: 'bg-yellow-500/20',
    text: 'text-yellow-700 dark:text-yellow-300',
    glow: 'hover:shadow-[0_0_20px_rgba(234,179,8,0.15)]',
  },
  blue: {
    border: 'border-blue-500/30',
    hover: 'hover:border-blue-500/60',
    badge: 'bg-blue-500/20',
    text: 'text-blue-700 dark:text-blue-300',
    glow: 'hover:shadow-[0_0_20px_rgba(59,130,246,0.15)]',
  },
  purple: {
    border: 'border-purple-500/30',
    hover: 'hover:border-purple-500/60',
    badge: 'bg-purple-500/20',
    text: 'text-purple-700 dark:text-purple-300',
    glow: 'hover:shadow-[0_0_20px_rgba(168,85,247,0.15)]',
  },
  lime: {
    border: 'border-lime-500/30',
    hover: 'hover:border-lime-500/60',
    badge: 'bg-lime-500/20',
    text: 'text-lime-700 dark:text-lime-300',
    glow: 'hover:shadow-[0_0_20px_rgba(132,204,22,0.15)]',
  },
  green: {
    border: 'border-green-500/30',
    hover: 'hover:border-green-500/60',
    badge: 'bg-green-500/20',
    text: 'text-green-700 dark:text-green-300',
    glow: 'hover:shadow-[0_0_20px_rgba(34,197,94,0.15)]',
  },
  red: {
    border: 'border-red-500/30',
    hover: 'hover:border-red-500/60',
    badge: 'bg-red-500/20',
    text: 'text-red-700 dark:text-red-300',
    glow: 'hover:shadow-[0_0_20px_rgba(239,68,68,0.15)]',
  },
};
