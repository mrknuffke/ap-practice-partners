"use client";

import { useState, useRef, useEffect, useCallback, Suspense } from "react";
import { storageGet, storageSet, storageClear } from "@/lib/utils";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import {
  Send, ArrowLeft, Bot, Loader2, Mic,
  Trash2, CheckCircle2, AlertCircle, LogOut, Printer, Brain
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import { motion, AnimatePresence } from "framer-motion";
import { COURSE_BY_SLUG, COLOR_CLASSES } from "@/constants/courses";
import { VoiceInput } from "@/components/VoiceInput";
import Mermaid from "@/components/Mermaid";
import { ThemeToggle } from "@/components/ThemeToggle";
import { jsonrepair } from "jsonrepair";
import { getRandomQuip } from "@/constants/loadingQuips";
import { Paperclip } from "lucide-react";

const MD_COMPONENTS: Components = {
  code({ className, children, ...props }) {
    const language = /language-(\w+)/.exec(className || "")?.[1];
    const content = String(children).replace(/\n$/, "");
    if (language === "mermaid") {
      return <Mermaid chart={content} />;
    }
    return (
      <code className={`${className ?? ""} bg-secondary rounded px-1 py-0.5 text-sm font-mono`} {...props}>
        {children}
      </code>
    );
  },
  pre({ children }) {
    return (
      <pre className="bg-secondary rounded-xl p-4 overflow-x-auto text-sm font-mono my-4">
        {children}
      </pre>
    );
  },
  table({ children }) {
    return (
      <div className="overflow-x-auto my-4">
        <table className="w-full text-sm border-collapse">{children}</table>
      </div>
    );
  },
  thead({ children }) {
    return <thead className="bg-secondary text-muted-foreground">{children}</thead>;
  },
  th({ children }) {
    return <th className="px-4 py-2 text-left font-semibold border border-border">{children}</th>;
  },
  td({ children }) {
    return <td className="px-4 py-2 border border-border text-foreground">{children}</td>;
  },
  tr({ children }) {
    return <tr className="even:bg-card/50">{children}</tr>;
  },
};

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  attachments?: { mimeType: string; data: string; name: string }[];
};

interface MCQQuestion {
  id: string;
  stimulus?: string;
  question: string;
  options: {
    A: string;
    B: string;
    C: string;
    D: string;
  };
  correctAnswer: "A" | "B" | "C" | "D";
  explanation: string;
}

interface SourceDocument {
  id: string;
  title: string;
  type: "text" | "image" | "map" | "chart";
  content: string;
  metadata: string;
}

interface SourceExercise {
  id: string;
  type: "dbq" | "synthesis";
  prompt: string;
  documents: SourceDocument[];
  rubric: Record<string, string>;
}

interface SourceGradeResult {
  totalPoints: number;
  maxPoints: 7;
  breakdown: {
    thesis: { earned: boolean, feedback: string },
    context: { earned: boolean, feedback: string },
    evidenceDocs: { earned: number, max: 2, feedback: string },
    evidenceBeyond: { earned: boolean, feedback: string },
    sourcing: { earned: boolean, feedback: string },
    complexity: { earned: boolean, feedback: string }
  },
  overallSummary: string;
}

interface FRQPart {
  letter: string;
  question: string;
  points: number;
  rubric: string;
}

interface FRQData {
  id: string;
  stimulus: string;
  parts: FRQPart[];
}

interface GradeResult {
  totalPoints: number;
  maxPoints: number;
  parts: Array<{
    letter: string;
    pointsEarned: number;
    feedback: string;
  }>;
  overallSummary: string;
}

interface OralGradeResult {
  score: number;
  fluency: string;
  pronunciation: string;
  taskCompletion: string;
  overallFeedback: string;
}

type ViewMode = "chat" | "mcq" | "frq" | "source" | "oral" | "confirm";

interface ContextData {
  mode: string;
  alignmentScore: number;
  alignmentNote: string;
  currentObjective: string;
  currentUnit: string;
}

// Gemini sometimes wraps JSON in markdown fences or includes bad escape sequences.
// Strip fences, extract outermost JSON boundaries, and fall back to jsonrepair.
function safeParseJSON<T>(raw: string): T {
  let s = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
  // Find outermost JSON object or array boundaries
  const firstBrace = s.indexOf('{');
  const firstBracket = s.indexOf('[');
  const start = (firstBrace !== -1 && (firstBracket === -1 || firstBrace < firstBracket)) ? firstBrace : firstBracket;
  if (start !== -1) {
    const isObj = s[start] === '{';
    const end = isObj ? s.lastIndexOf('}') : s.lastIndexOf(']');
    if (end !== -1) s = s.slice(start, end + 1);
  }
  try {
    return JSON.parse(s) as T;
  } catch {
    return JSON.parse(jsonrepair(s)) as T;
  }
}

async function safeResponseJSON<T>(res: Response): Promise<T> {
  const text = await res.text();
  return safeParseJSON<T>(text);
}

function MCQTrainer({
  unit,
  mcqFormat,
  courseSlug,
  examParam,
  onComplete
}: {
  unit: string;
  mcqFormat?: string;
  courseSlug: string;
  examParam?: string | null;
  onComplete: (summary: string) => void
}) {
  const [questions, setQuestions] = useState<MCQQuestion[]>([]);
  const [sharedStimulus, setSharedStimulus] = useState<string>("");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [showExplanation, setShowExplanation] = useState<Record<number, boolean>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const quip = useState(() => getRandomQuip())[0];

  useEffect(() => {
    async function loadQuestions() {
      try {
        const res = await fetch("/api/mcq/generate", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-classroom-code": storageGet("classroom_code") || "",
          },
          body: JSON.stringify({ slug: courseSlug, examParam, unit, format: mcqFormat || "independent" }),
        });
        if (!res.ok) throw new Error(await res.text());
        const data = await safeResponseJSON<{ stimulus?: string; questions: MCQQuestion[] } | MCQQuestion[]>(res);
        if (Array.isArray(data)) {
          setQuestions(data);
        } else {
          setSharedStimulus(data.stimulus || "");
          setQuestions(data.questions);
        }
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Failed to generate questions.");
      } finally {
        setIsLoading(false);
      }
    }
    loadQuestions();
  }, [courseSlug, examParam, unit, mcqFormat]);

  const handleSelect = (option: string) => {
    if (showExplanation[currentIndex]) return;
    setAnswers(prev => ({ ...prev, [currentIndex]: option }));
    setShowExplanation(prev => ({ ...prev, [currentIndex]: true }));
  };

  const score = questions.reduce((acc, q, i) => acc + (answers[i] === q.correctAnswer ? 1 : 0), 0);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center space-y-6">
        <div className="relative">
          <div className="w-20 h-20 rounded-full border-4 border-primary/20 border-t-blue-500 animate-spin" />
          <Bot className="w-8 h-8 text-primary absolute inset-0 m-auto" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-foreground mb-2">Generating Practice Set...</h2>
          <p className="text-muted-foreground max-w-sm mx-auto">
            Building 5 AP-style questions for Unit {unit}. This may take up to 30 seconds.
          </p>
          <p className="text-muted-foreground text-xs mt-3 italic">{quip}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center space-y-4">
        <AlertCircle className="w-12 h-12 text-red-500" />
        <p className="text-foreground font-medium">{error}</p>
        <Button onClick={() => window.location.reload()} variant="outline">Try Again</Button>
      </div>
    );
  }

  if (currentIndex === questions.length && questions.length > 0) {
    const missedLines = questions
      .map((q, i) => answers[i] !== q.correctAnswer ? `- Q${i + 1}: ${q.question} (correct: ${q.correctAnswer} — ${q.options[q.correctAnswer]}; ${q.explanation})` : null)
      .filter(Boolean);
    const summary = [
      `Completed Unit ${unit} MCQ practice session. Score: ${score}/${questions.length} (${Math.round((score/questions.length)*100)}%).`,
      missedLines.length > 0 ? `Questions missed:\n${missedLines.join("\n")}` : "All questions answered correctly.",
    ].join("\n");

    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col h-full p-8 overflow-y-auto max-w-2xl mx-auto w-full space-y-6"
      >
        <div className="flex flex-col items-center text-center space-y-4 pt-4">
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20 relative">
            <div className="absolute inset-0 rounded-full bg-primary/5 animate-ping" />
            <CheckCircle2 className="w-10 h-10 text-primary" />
          </div>
          <h2 className="text-3xl font-bold text-foreground">Practice Complete!</h2>
          <div className="grid grid-cols-2 gap-4 w-full max-w-sm">
            <div className="p-4 rounded-2xl bg-card border border-border">
              <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider mb-1">Score</p>
              <p className="text-2xl font-bold text-foreground">{score} / {questions.length}</p>
            </div>
            <div className="p-4 rounded-2xl bg-card border border-border">
              <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider mb-1">Accuracy</p>
              <p className={`text-2xl font-bold ${score/questions.length >= 0.75 ? 'text-emerald-500' : 'text-amber-500'}`}>{Math.round((score/questions.length)*100)}%</p>
            </div>
          </div>
        </div>
        {/* Per-question breakdown */}
        <div className="space-y-3">
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Question Breakdown</p>
          {questions.map((q, i) => {
            const correct = answers[i] === q.correctAnswer;
            return (
              <div key={i} className={`p-4 rounded-2xl border text-sm ${correct ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-red-500/5 border-red-500/20'}`}>
                <div className="flex items-start gap-3">
                  <span className={`shrink-0 font-bold text-xs mt-0.5 ${correct ? 'text-emerald-500' : 'text-red-400'}`}>
                    {correct ? '✓' : '✗'} Q{i+1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-foreground font-medium leading-snug">{q.question}</p>
                    {!correct && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Your answer: <span className="font-bold text-red-400">{answers[i] || '—'}</span> · Correct: <span className="font-bold text-emerald-500">{q.correctAnswer} — {q.options[q.correctAnswer]}</span>
                      </p>
                    )}
                    {!correct && <p className="text-xs text-muted-foreground mt-1 italic">{q.explanation}</p>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        <Button onClick={() => onComplete(summary)} className="w-full h-14 rounded-2xl bg-primary text-primary-foreground font-bold">Return to Tutor</Button>
      </motion.div>
    );
  }

  const q = questions[currentIndex];
  const stimulusToShow = sharedStimulus || q.stimulus;

  return (
    <div className="flex flex-col md:flex-row h-full md:overflow-hidden bg-transparent overflow-y-auto">
      <div className="flex-1 border-b md:border-b-0 md:border-r border-border/50 p-6 lg:p-10 md:overflow-y-auto custom-scrollbar">
        <div className="max-w-prose mx-auto space-y-8">
           <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]} components={MD_COMPONENTS}>{stimulusToShow}</ReactMarkdown>
        </div>
      </div>
      <div className="w-full md:w-[450px] lg:w-[550px] flex flex-col p-6 lg:p-10 md:overflow-y-auto">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Question {currentIndex + 1} of {questions.length}
          </span>
          <div className="flex gap-1">
            {questions.map((_, i) => (
              <div key={i} className={`w-2 h-2 rounded-full transition-colors ${
                i === currentIndex ? 'bg-primary' : i < currentIndex ? 'bg-primary/80' : 'bg-muted'
              }`} />
            ))}
          </div>
        </div>
        <h3 className="text-lg font-bold text-foreground mb-4">{q.question}</h3>
        <div className="flex-1 space-y-3 overflow-y-auto">
          {(Object.entries(q.options) as [string, string][]).map(([key, val]) => (
            <button
              key={key}
              disabled={showExplanation[currentIndex]}
              onClick={() => handleSelect(key)}
              className={`w-full text-left p-5 rounded-[2rem] border transition-all ${
                showExplanation[currentIndex] && key === q.correctAnswer ? 'border-emerald-500/30 bg-emerald-500/10' :
                showExplanation[currentIndex] && answers[currentIndex] === key ? 'border-red-500/30 bg-red-500/10' :
                answers[currentIndex] === key ? 'border-primary/30 bg-primary/10' : 'border-transparent bg-surface-high hover:shadow-sm'
              }`}
            >
              <span className="font-bold mr-4">{key}.</span> {val}
            </button>
          ))}
          {showExplanation[currentIndex] && (
            <div className="mt-4 p-5 rounded-[2rem] bg-surface-high border-l-4 border-primary text-sm text-foreground shadow-sm">
              <p className="text-xs font-bold text-primary uppercase tracking-wider mb-1">Explanation</p>
              {q.explanation}
            </div>
          )}
        </div>
        <div className="pt-8 flex gap-3">
          <Button disabled={currentIndex === 0} onClick={() => setCurrentIndex(prev => prev - 1)} variant="ghost" className="rounded-full">Previous</Button>
          <Button onClick={() => (currentIndex === questions.length - 1 ? setCurrentIndex(questions.length) : setCurrentIndex(prev => prev + 1))} className="flex-1 rounded-full bg-primary text-primary-foreground font-bold shadow-sm">
            {currentIndex === questions.length - 1 ? 'Finish' : 'Next'}
          </Button>
        </div>
      </div>
    </div>
  );
}

function SourceSimulator({ 
  topic, 
  courseSlug,
  courseName,
  onComplete 
}: { 
  topic: string; 
  courseSlug: string; 
  courseName: string;
  onComplete: (summary: string) => void 
}) {
  const [exercise, setExercise] = useState<SourceExercise | null>(null);
  const [activeDocId, setActiveDocId] = useState("1");
  const [essay, setEssay] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isGrading, setIsGrading] = useState(false);
  const [results, setResults] = useState<SourceGradeResult | null>(null);

  useEffect(() => {
    async function loadExercise() {
      try {
        const res = await fetch("/api/source/generate", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-classroom-code": storageGet("classroom_code") || "",
          },
          body: JSON.stringify({ slug: courseSlug, topic }),
        });
        setExercise(await safeResponseJSON<SourceExercise>(res));
      } finally {
        setIsLoading(false);
      }
    }
    loadExercise();
  }, [courseSlug, topic]);

  const handleGrade = async () => {
    if (!exercise || isGrading) return;
    setIsGrading(true);
    try {
      const res = await fetch("/api/source/grade", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-classroom-code": storageGet("classroom_code") || "",
        },
        body: JSON.stringify({
          essay,
          prompt: exercise.prompt,
          documents: exercise.documents,
          rubric: exercise.rubric,
          courseName
        }),
      });
      setResults(await safeResponseJSON<SourceGradeResult>(res));
    } finally {
      setIsGrading(false);
    }
  };

  if (isLoading) return <div className="flex h-full items-center justify-center text-foreground">Compiling Source Packet...</div>;

  if (results) {
    const criteriaLabels: Record<string, string> = {
      thesis: "Thesis / Claim",
      context: "Contextualization",
      evidenceDocs: "Evidence from Documents",
      evidenceBeyond: "Evidence Beyond Documents",
      sourcing: "Sourcing / HAPP",
      complexity: "Complexity",
    };
    const breakdownLines = Object.entries(results.breakdown).map(([key, val]) => {
      const earned = typeof val.earned === "number" ? `${val.earned}/${val.max}` : val.earned ? "1/1" : "0/1";
      return `- ${criteriaLabels[key] ?? key}: ${earned} — ${val.feedback}`;
    });
    const summary = [
      `Completed Source/DBQ on "${topic}". Score: ${results.totalPoints}/7.`,
      ...breakdownLines,
      `Overall: ${results.overallSummary}`,
    ].join("\n");
    return (
      <div className="p-8 max-w-4xl mx-auto space-y-8 text-foreground overflow-y-auto">
        <h2 className="text-4xl font-bold">DBQ Result: {results.totalPoints}/7</h2>
        <p className="text-muted-foreground">{results.overallSummary}</p>
        <div className="space-y-3">
          {(Object.entries(results.breakdown) as [string, { earned: boolean | number; max?: number; feedback: string }][]).map(([key, val]) => {
            const maxPts = typeof val.max === "number" ? val.max : 1;
            const earnedPts = typeof val.earned === "number" ? val.earned : val.earned ? 1 : 0;
            const full = earnedPts === maxPts;
            const none = earnedPts === 0;
            return (
              <div key={key} className="p-5 rounded-2xl bg-card border border-border space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-foreground">{criteriaLabels[key] ?? key}</span>
                  <span className={`font-bold ${full ? "text-emerald-400" : none ? "text-red-400" : "text-yellow-400"}`}>
                    {earnedPts} / {maxPts} pt{maxPts !== 1 ? "s" : ""}
                  </span>
                </div>
                <p className="text-muted-foreground text-sm">{val.feedback}</p>
              </div>
            );
          })}
        </div>
        <Button onClick={() => onComplete(summary)} className="w-full h-16 bg-amber-600">Return to Tutor</Button>
      </div>
    );
  }

  const activeDoc = exercise?.documents.find(d => d.id === activeDocId);

  return (
    <div className="flex h-full bg-transparent overflow-hidden">
      <div className="w-[100px] border-r border-border/10 p-4 flex flex-col gap-3">
        {exercise?.documents.map(d => (
          <button key={d.id} onClick={() => setActiveDocId(d.id)} className={`p-4 rounded-full font-bold border transition-colors ${activeDocId === d.id ? 'border-amber-500/30 bg-amber-500/10 text-amber-600' : 'border-transparent bg-surface-high hover:bg-surface-high/80'}`}>{d.id}</button>
        ))}
      </div>
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="p-6 border-b border-border/10">
          <h1 className="text-xl font-bold text-foreground">Prompt: {exercise?.prompt}</h1>
        </div>
        <div className="flex-1 overflow-y-auto p-12">
          <div className="max-w-prose mx-auto p-10 bg-surface-high rounded-[2rem] border-transparent shadow-sm">
            <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]} components={MD_COMPONENTS}>{activeDoc?.content || ""}</ReactMarkdown>
          </div>
        </div>
      </div>
      <div className="w-[500px] border-l border-border/10 p-8 flex flex-col">
        <h3 className="text-xl font-bold text-foreground mb-4">Your Argument</h3>
        <textarea className="flex-1 bg-surface p-6 rounded-[2rem] border-transparent shadow-inner text-[15px] focus:outline-none focus:ring-2 focus:ring-amber-500/50 resize-none text-foreground" value={essay} onChange={e => setEssay(e.target.value)} />
        <div className="mt-4 flex justify-end"><VoiceInput onTranscript={t => setEssay(p => p + " " + t)} /></div>
        <Button onClick={handleGrade} disabled={isGrading} className="mt-6 h-16 rounded-full font-bold bg-amber-500 hover:bg-amber-600 text-white shadow-sm">{isGrading ? "Grading..." : "Submit for Review"}</Button>
      </div>
    </div>
  );
}

function FRQSimulator({ topic, courseSlug, courseName, onComplete }: { topic: string; courseSlug: string; courseName: string; onComplete: (summary: string) => void }) {
  const [frq, setFrq] = useState<FRQData | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [attachments, setAttachments] = useState<Record<string, { mimeType: string; data: string; name: string }>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isGrading, setIsGrading] = useState(false);
  const [results, setResults] = useState<GradeResult | null>(null);
  const quip = useState(() => getRandomQuip())[0];

  useEffect(() => {
    async function loadFRQ() {
      try {
        const res = await fetch("/api/frq/generate", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-classroom-code": storageGet("classroom_code") || "",
          },
          body: JSON.stringify({ slug: courseSlug, topic }),
        });
        setFrq(await safeResponseJSON<FRQData>(res));
      } finally {
        setIsLoading(false);
      }
    }
    loadFRQ();
  }, [courseSlug, topic]);

  const handleAttach = (letter: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const base64 = dataUrl.split(",")[1];
      setAttachments(prev => ({ ...prev, [letter]: { mimeType: file.type, data: base64, name: file.name } }));
    };
    reader.readAsDataURL(file);
  };

  const handleGrade = async () => {
    setIsGrading(true);
    try {
      const res = await fetch("/api/frq/grade", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-classroom-code": storageGet("classroom_code") || "",
        },
        body: JSON.stringify({
          courseName,
          parts: frq?.parts,
          answers: frq?.parts.map(p => ({
            letter: p.letter,
            answer: answers[p.letter] || "",
            attachment: attachments[p.letter] || null,
          }))
        }),
      });
      setResults(await safeResponseJSON<GradeResult>(res));
    } finally {
      setIsGrading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center space-y-6">
        <div className="relative">
          <div className="w-20 h-20 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
          <Bot className="w-8 h-8 text-primary absolute inset-0 m-auto" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-foreground mb-2">Generating FRQ...</h2>
          <p className="text-muted-foreground max-w-sm mx-auto">
            Building a stimulus-based free response question. This may take up to 30 seconds.
          </p>
          <p className="text-muted-foreground text-xs mt-3 italic">{quip}</p>
        </div>
      </div>
    );
  }

  if (results) {
    const summary = [
      `Completed FRQ on "${topic}". Score: ${results.totalPoints}/${results.maxPoints}.`,
      `Part-by-part results:`,
      ...results.parts.map(p => `- (${p.letter}) ${p.pointsEarned}/${frq?.parts.find(fp => fp.letter === p.letter)?.points ?? "?"} — ${p.feedback}`),
      `Overall: ${results.overallSummary}`,
    ].join("\n");
    return (
      <div className="p-8 max-w-4xl mx-auto space-y-8 text-foreground overflow-y-auto">
        <h2 className="text-4xl font-bold">FRQ Score: {results.totalPoints}/{results.maxPoints}</h2>
        <p className="text-muted-foreground">{results.overallSummary}</p>
        <div className="space-y-4">
          {results.parts.map(p => (
            <div key={p.letter} className="p-5 rounded-2xl bg-card border border-border space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-foreground text-lg">Part ({p.letter})</span>
                <span className={`text-lg font-bold ${p.pointsEarned === (frq?.parts.find(fp => fp.letter === p.letter)?.points ?? 0) ? "text-emerald-400" : p.pointsEarned === 0 ? "text-red-400" : "text-yellow-400"}`}>
                  {p.pointsEarned} / {frq?.parts.find(fp => fp.letter === p.letter)?.points ?? "?"} pts
                </span>
              </div>
              <p className="text-muted-foreground text-sm">{p.feedback}</p>
            </div>
          ))}
        </div>
        <Button onClick={() => onComplete(summary)} className="w-full bg-purple-600">Return to Tutor</Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col md:flex-row h-full bg-transparent overflow-y-auto md:overflow-hidden">
      <div className="flex-1 p-6 md:p-12 border-b md:border-b-0 md:border-r border-border/10 md:overflow-y-auto custom-scrollbar">
        <div className="max-w-prose mx-auto">
          <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]} components={MD_COMPONENTS}>{frq?.stimulus || ""}</ReactMarkdown>
        </div>
      </div>
      <div className="w-full md:w-[600px] p-6 md:p-12 flex flex-col md:overflow-y-auto">
        <h3 className="text-2xl font-bold text-foreground mb-8">Response Entry</h3>
        <div className="flex-1 space-y-6 overflow-y-auto pr-2 custom-scrollbar">
          {frq?.parts.map(p => (
            <div key={p.letter}>
              <div className="text-foreground mb-2 prose dark:prose-invert prose-sm max-w-none">
                <span className="font-semibold text-muted-foreground not-prose">{p.letter}.</span>{" "}
                <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]} components={MD_COMPONENTS}>{p.question}</ReactMarkdown>
              </div>
              <div className="relative">
                <textarea
                  className="w-full h-32 bg-surface text-foreground placeholder:text-muted-foreground border-none rounded-[1.5rem] shadow-inner p-5 text-[14px] resize-none focus:ring-2 focus:ring-purple-500/50 outline-none"
                  value={answers[p.letter] || ""}
                  onChange={e => setAnswers(prev => ({ ...prev, [p.letter]: e.target.value }))}
                  placeholder="Type your response here..."
                />
                <div className="absolute right-3 bottom-3">
                  <VoiceInput onTranscript={t => setAnswers(prev => ({ ...prev, [p.letter]: (prev[p.letter] || "") + " " + t }))} />
                </div>
              </div>
              <label
                className={`flex flex-col items-center justify-center gap-1 mt-2 p-3 rounded-[1.5rem] border border-dashed text-xs cursor-pointer transition-colors ${
                  attachments[p.letter]
                    ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-500"
                    : "border-border/40 text-muted-foreground hover:bg-surface-high"
                }`}
                onDragOver={e => e.preventDefault()}
                onDrop={e => {
                  e.preventDefault();
                  const file = e.dataTransfer.files?.[0];
                  if (!file) return;
                  const synth = { target: { files: e.dataTransfer.files } } as unknown as React.ChangeEvent<HTMLInputElement>;
                  handleAttach(p.letter, synth);
                }}
              >
                <Paperclip className="w-4 h-4" />
                <span>{attachments[p.letter]?.name ?? "Attach image — click or drag & drop"}</span>
                <input type="file" accept="image/*" className="hidden" onChange={e => handleAttach(p.letter, e)} />
              </label>
            </div>
          ))}
        </div>
        <Button onClick={handleGrade} disabled={isGrading} className="mt-8 h-16 rounded-[2rem] font-bold bg-purple-600 hover:bg-purple-700 text-white shadow-sm">{isGrading ? "Grading..." : "Submit Response"}</Button>
      </div>
    </div>
  );
}

function OralSimulator({ topic, courseName, onComplete }: { topic: string; courseSlug: string; courseName: string; onComplete: (summary: string) => void }) {
  const [stage, setStage] = useState<"intro" | "recording" | "grading" | "results">("intro");
  const [isRecording, setIsRecording] = useState(false);
  const [timeLeft, setTimeLeft] = useState(20);
  const [results, setResults] = useState<OralGradeResult | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const stopRecording = useCallback(() => { mediaRecorderRef.current?.stop(); setIsRecording(false); }, []);

  useEffect(() => {
    if (!isRecording || timeLeft <= 0) return;
    const timer = setInterval(() => setTimeLeft(t => t - 1), 1000);
    return () => clearInterval(timer);
  }, [isRecording, timeLeft]);

  useEffect(() => {
    if (timeLeft === 0 && isRecording) {
      mediaRecorderRef.current?.stop();
    }
  }, [timeLeft, isRecording]);

  const startRecording = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mediaRecorder = new MediaRecorder(stream);
    mediaRecorderRef.current = mediaRecorder;
    audioChunksRef.current = [];
    mediaRecorder.ondataavailable = (e) => { if (e.data.size > 0) audioChunksRef.current.push(e.data); };
    mediaRecorder.onstop = () => {
      const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
      handleGrade(blob);
    };
    mediaRecorder.start();
    setIsRecording(true);
    setStage("recording");
    setTimeLeft(20);
  };


  const handleGrade = async (blob: Blob) => {
    setStage("grading");
    const reader = new FileReader();
    reader.readAsDataURL(blob);
    reader.onloadend = async () => {
      const base64Audio = (reader.result as string).split(",")[1];
      const res = await fetch("/api/oral/grade", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-classroom-code": storageGet("classroom_code") || "" },
        body: JSON.stringify({ audioBase64: base64Audio, mimeType: blob.type, prompt: topic, courseName }),
      });
      setResults(await safeResponseJSON<OralGradeResult>(res));
      setStage("results");
    };
  };

  if (stage === "intro") {
    return (
      <div className="h-full flex items-center justify-center bg-transparent p-8 text-center">
        <div className="max-w-md space-y-6">
          <Mic className="w-16 h-16 text-red-500 mx-auto" />
          <h2 className="text-3xl font-bold text-foreground">Oral Practice</h2>
          <Button onClick={startRecording} className="w-full h-16 rounded-[2rem] bg-red-500 hover:bg-red-600 text-white font-bold text-lg shadow-sm">Start 20s Prompt</Button>
        </div>
      </div>
    );
  }

  if (stage === "recording") {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-transparent text-foreground space-y-8">
        <div className="text-6xl font-black">{timeLeft}s</div>
        <p className="text-red-500 animate-pulse font-bold tracking-widest text-2xl">RECORDING...</p>
        <Button onClick={stopRecording} variant="outline" className="text-red-500 border-red-500 rounded-full font-bold">Finish Early</Button>
      </div>
    );
  }

  if (stage === "grading") return <div className="h-full flex items-center justify-center text-foreground">AI is evaluating your speech...</div>;

  if (results) {
    const oralCriteria = [
      { key: "taskCompletion", label: "Task Completion", value: results.taskCompletion },
      { key: "fluency", label: "Fluency", value: results.fluency },
      { key: "pronunciation", label: "Pronunciation / Accuracy", value: results.pronunciation },
    ];
    const summary = [
      `Completed Oral Practice on "${topic}". Score: ${results.score}/6.`,
      `- Task Completion: ${results.taskCompletion}`,
      `- Fluency: ${results.fluency}`,
      `- Pronunciation/Accuracy: ${results.pronunciation}`,
      `Overall: ${results.overallFeedback}`,
    ].join("\n");
    return (
      <div className="p-8 max-w-4xl mx-auto text-foreground space-y-8 overflow-y-auto">
        <h2 className="text-4xl font-bold">Oral Score: {results.score}/6</h2>
        <div className="p-6 bg-card rounded-3xl border border-border italic">&ldquo;{results.overallFeedback}&rdquo;</div>
        <div className="space-y-3">
          {oralCriteria.map(c => (
            <div key={c.key} className="p-5 rounded-2xl bg-card border border-border space-y-1">
              <span className="font-bold text-foreground">{c.label}</span>
              <p className="text-muted-foreground text-sm">{c.value}</p>
            </div>
          ))}
        </div>
        <Button onClick={() => onComplete(summary)} className="w-full bg-red-600">Return to Tutor</Button>
      </div>
    );
  }

  return null;
}

function TutorPageInner() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const courseSlug = typeof params?.course === "string" ? params.course : "";
  const examParam = searchParams?.get("exam") ?? null;
  const entry = COURSE_BY_SLUG[courseSlug];

  let courseName = entry?.displayName ?? courseSlug;
  if (entry?.isPhysicsC) courseName = `AP Physics C: ${examParam === 'em' ? 'E&M' : 'Mechanics'}`;
  if (entry?.isCalcABBC) courseName = `AP Calculus ${examParam?.toUpperCase()}`;

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("chat");
  const [pendingMode, setPendingMode] = useState<ViewMode>("chat");
  const [activeConfig, setActiveConfig] = useState<Record<string, string>>({});
  const [summaryReady, setSummaryReady] = useState(false);
  const [attachments, setAttachments] = useState<{ mimeType: string; data: string; name: string }[]>([]);
  const [contextData, setContextData] = useState<ContextData | null>(null);
  const storageKey = `ap_tutor_${courseSlug}_${examParam || "default"}`;
  const scrollRef = useRef<HTMLDivElement>(null);
  const userSentRef = useRef(false);
  const isStreamingRef = useRef(false);
  const greetingFired = useRef(false);
  const sendMessageRef = useRef<((current: Message[], news?: Message) => Promise<void>) | null>(null);
  // Smooth typewriter drip — buffer incoming AI text and reveal at a controlled pace
  const pendingContentRef = useRef("");
  const dripIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const sendMessage = useCallback(async (current: Message[], news?: Message) => {
    const all = news ? [...current, news] : current;
    if (news) setMessages(all);
    setIsLoading(true);
    isStreamingRef.current = true;
    try {
      const res = await fetch("/api/tutor", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-classroom-code": storageGet("classroom_code") || "" },
        body: JSON.stringify({ slug: courseSlug, examParam, messages: all.map(m => ({ role: m.role, content: m.content, attachments: m.attachments })) })
      });
      if (!res.body) return;
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      const assistantMsg: Message = { id: Date.now().toString(), role: "assistant", content: "" };
      setMessages(p => [...p, assistantMsg]);
      
      let fullContent = "";
      let displayedLen = 0;

      // Clear any leftover drip from a prior message
      if (dripIntervalRef.current) clearInterval(dripIntervalRef.current);
      pendingContentRef.current = "";
      displayedLen = 0;

      // Drip interval: reveal ~25 chars every 20ms — smooth but not slow
      dripIntervalRef.current = setInterval(() => {
        const target = pendingContentRef.current;
        if (displayedLen >= target.length) return;
        // Adaptive step: catch up faster if we're falling far behind
        const lag = target.length - displayedLen;
        const step = lag > 400 ? 60 : lag > 150 ? 35 : lag > 40 ? 20 : 8;
        displayedLen = Math.min(displayedLen + step, target.length);
        const visible = target.slice(0, displayedLen);
        setMessages(p => {
          const last = p[p.length - 1];
          return [...p.slice(0, -1), { ...last, content: visible }];
        });
      }, 20);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        fullContent += chunk;
        pendingContentRef.current = fullContent;
      }

      // Stream done — wait for drip to finish revealing before post-processing
      await new Promise<void>(resolve => {
        const check = setInterval(() => {
          if (dripIntervalRef.current === null || displayedLen >= pendingContentRef.current.length) {
            clearInterval(check);
            resolve();
          }
        }, 20);
      });
      if (dripIntervalRef.current) { clearInterval(dripIntervalRef.current); dripIntervalRef.current = null; }

      // Detect triggers
      const mcqMatch = fullContent.match(/:::mcq\s*(\{.*?\})\s*:::/);
      const frqMatch = fullContent.match(/:::frq\s*(\{.*?\})\s*:::/);
      const sourceMatch = fullContent.match(/:::source\s*(\{.*?\})\s*:::/);
      const oralMatch = fullContent.match(/:::oral\s*(\{.*?\})\s*:::/);

      const triggerMatch =
        mcqMatch    ? { raw: mcqMatch[1],    mode: "mcq"    as ViewMode } :
        frqMatch    ? { raw: frqMatch[1],    mode: "frq"    as ViewMode } :
        sourceMatch ? { raw: sourceMatch[1], mode: "source" as ViewMode } :
        oralMatch   ? { raw: oralMatch[1],   mode: "oral"   as ViewMode } :
        null;

      // Parse and strip :::context::: metadata blocks (powers the sidebar)
      const contextMatch = fullContent.match(/:::context\s*(\{.*?\})\s*:::/);
      if (contextMatch) {
        try {
          setContextData(safeParseJSON<ContextData>(contextMatch[1]));
        } catch { /* ignore malformed context */ }
      }

      // Strip ALL special tags (context + triggers) from the displayed message
      const cleanedContent = fullContent
        .replace(/\n?:::(?:mcq|frq|source|oral|context)\s*\{.*?\}\s*:::/g, "")
        .replace(/\n?:::context\s*\{[^}]*\}\s*:::/g, "")
        .trimEnd();
      if (cleanedContent !== fullContent) {
        setMessages(p => {
          const last = p[p.length - 1];
          return [...p.slice(0, -1), { ...last, content: cleanedContent }];
        });
      }

      if (triggerMatch) {
        try {
          setActiveConfig(safeParseJSON<Record<string, string>>(triggerMatch.raw));
        } catch {
          setActiveConfig({});
        }
        setPendingMode(triggerMatch.mode);
        setViewMode("confirm");
      }

    } catch (err) {
      console.error(err);
    } finally {
      isStreamingRef.current = false;
      setIsLoading(false);
    }
  }, [courseSlug, examParam]);

  sendMessageRef.current = sendMessage;

  useEffect(() => {
    // Don't fire if no classroom code — Gatekeeper will intercept
    if (!storageGet("classroom_code")) return;
    // Redirect Physics C / Calc to home if no exam sub-type selected
    if ((entry?.isPhysicsC || entry?.isCalcABBC) && !examParam) {
      router.replace("/");
      return;
    }
    if (greetingFired.current) return;
    const saved = storageGet(storageKey);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setMessages(parsed);
          greetingFired.current = true;
          return;
        }
      } catch {}
    }
    greetingFired.current = true;
    sendMessageRef.current?.([]);
  }, [storageKey, entry, examParam, router]);

  useEffect(() => {
    if (messages.length > 0) storageSet(storageKey, JSON.stringify(messages));
    const el = scrollRef.current;
    if (!el) return;
    const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 120;
    if (nearBottom || userSentRef.current || isStreamingRef.current) {
      el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
      userSentRef.current = false;
    }
  }, [messages, isLoading, storageKey]);

  const handleSend = async () => {
    if ((!input.trim() && attachments.length === 0) || isLoading) return;
    const msg: Message = { id: Date.now().toString(), role: "user", content: input.trim(), attachments: attachments.length > 0 ? attachments : undefined };
    setInput("");
    setAttachments([]);
    userSentRef.current = true;
    await sendMessage(messages, msg);
  };

  const handleModuleComplete = async (summary: string) => {
    setViewMode("chat");
    await sendMessage(messages, { id: Date.now().toString(), role: "user", content: summary });
  };

  const handleEndSession = async () => {
    setViewMode("chat");
    setSummaryReady(false);
    setIsLoading(true);
    try {
      const res = await fetch("/api/summary", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-classroom-code": storageGet("classroom_code") || "" },
        body: JSON.stringify({ messages: messages.map(m => ({ role: m.role, content: m.content })) }),
      });
      if (!res.body) return;
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      const summaryMsg: Message = { id: Date.now().toString(), role: "assistant", content: "" };
      setMessages(p => [...p, summaryMsg]);
      let full = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        full += decoder.decode(value);
        setMessages(p => [...p.slice(0, -1), { ...p[p.length - 1], content: full }]);
      }
      setSummaryReady(true);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePrintSummary = () => {
    const summaryMsg = [...messages].reverse().find(m => m.role === "assistant" && m.content.includes("Session Summary"));
    if (!summaryMsg) return;
    const studentName = storageGet("student_name") || "Student";
    const sessionDate = new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
    const completions = messages.filter(m => m.role === "user" && (
      m.content.includes("Completed Unit ") || m.content.includes("Completed FRQ") ||
      m.content.includes("Completed Source/DBQ") || m.content.includes("Completed Oral")
    ));
    const completionRows = completions.map(m => {
      const scoreMatch = m.content.match(/Score:\s*(\d+\/\d+)/i);
      const typeMatch = m.content.match(/Completed (Unit [^\s]+ MCQ|FRQ on "[^"]+"|Source\/DBQ on "[^"]+"|Oral Practice on "[^"]+')/i);
      return `<tr><td>${typeMatch?.[1] || m.content.slice(0, 60)}</td><td>${scoreMatch?.[1] || '—'}</td></tr>`;
    }).join("");
    const win = window.open("", "_blank");
    if (!win) return;
    win.document.write(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${courseName} — Session Summary — ${studentName}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    @page { size: A4 landscape; margin: 10mm; }
    body { font-family: 'Georgia', serif; color: #1a1a1a; line-height: 1.65; background: #fff; }
    .no-print { display: flex; gap: 12px; padding: 16px 24px; background: #f8f8f8; border-bottom: 1px solid #ddd; align-items: center; }
    .btn { padding: 8px 20px; border-radius: 999px; border: none; font-size: 14px; font-weight: 600; cursor: pointer; text-decoration: none; display: inline-block; }
    .btn-primary { background: #16a34a; color: #fff; }
    .btn-outline { background: transparent; border: 1.5px solid #888; color: #333; }
    @media print { .no-print { display: none !important; } }
    .page { padding: 0; }
    .header { border-bottom: 3px solid #1a1a1a; padding-bottom: 12px; margin-bottom: 24px; display: flex; justify-content: space-between; align-items: flex-end; }
    .header h1 { font-size: 1.6rem; font-style: italic; }
    .header .meta { text-align: right; font-size: 0.8rem; color: #555; line-height: 1.6; }
    h2 { font-size: 1rem; text-transform: uppercase; letter-spacing: 0.1em; color: #555; margin: 28px 0 10px; border-bottom: 1px solid #ddd; padding-bottom: 4px; }
    .summary-body p { margin-bottom: 12px; }
    .summary-body ul, .summary-body ol { padding-left: 24px; margin-bottom: 12px; }
    .summary-body li { margin-bottom: 4px; }
    .summary-body strong { font-weight: 700; }
    .summary-body em { font-style: italic; color: #444; }
    table { width: 100%; border-collapse: collapse; font-size: 0.9rem; margin-bottom: 16px; }
    th { background: #f0f0f0; text-align: left; padding: 8px 12px; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.06em; }
    td { padding: 8px 12px; border-bottom: 1px solid #eee; }
    .footer { margin-top: 32px; padding-top: 12px; border-top: 1px solid #ddd; font-size: 0.75rem; color: #888; text-align: center; }
    .page-break { page-break-before: always; }
  </style>
</head>
<body>
  <div class="no-print">
    <button class="btn btn-primary" onclick="window.print()">⬇ Download PDF</button>
    <span style="font-size:13px;color:#666;margin-left:12px">Use your browser's <strong>Save as PDF</strong> option in the print dialog</span>
  </div>
  <div class="page">
    <div class="header">
      <div>
        <p style="font-size:0.75rem;text-transform:uppercase;letter-spacing:0.1em;color:#888;margin-bottom:2px">AP Study Bots</p>
        <h1>${courseName}</h1>
        <p style="font-size:0.9rem;color:#555;margin-top:4px">Study Session Summary</p>
      </div>
      <div class="meta">
        <p><strong>${studentName}</strong></p>
        <p>${sessionDate}</p>
        <p>${messages.length} messages · ${completions.length} module(s) completed</p>
      </div>
    </div>
    ${completionRows ? `
    <h2>Completed Practice Modules</h2>
    <table>
      <thead><tr><th>Module</th><th>Score</th></tr></thead>
      <tbody>${completionRows}</tbody>
    </table>` : ""}
    <h2>Session Summary</h2>
    <div class="summary-body" id="content"></div>
    <div class="footer">Generated by AP Study Bots · Answers align with College Board Course and Exam Descriptions</div>
  </div>
  <script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script>
  <script>
    document.getElementById("content").innerHTML = marked.parse(${JSON.stringify(summaryMsg.content)});
  </script>
</body>
</html>`);
    win.document.close();
  };

  return (
    <div className="flex flex-col h-dvh bg-background text-foreground w-full">
      <header className="px-6 py-4 flex items-center justify-between border-b border-border/40 shrink-0 bg-surface-lowest">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push("/")} className="shrink-0 hover:bg-surface"><ArrowLeft className="w-5 h-5 text-muted-foreground" /></Button>
          <div>
            <h1 className="font-heading font-bold text-lg sm:text-xl text-foreground italic flex items-center gap-2">
              Coach AI <span className="text-primary not-italic text-sm px-3 py-1 bg-primary/10 rounded-full font-sans tracking-tight">{courseName}</span>
            </h1>
            <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mt-1">Your Personal Thinking Partner</p>
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          {summaryReady && (
            <Button variant="outline" onClick={handlePrintSummary} className="text-primary text-xs sm:text-sm gap-2 rounded-full border-primary/20">
              <Printer className="w-4 h-4" />
              <span className="hidden sm:inline">Download / Email</span>
            </Button>
          )}
          <Button variant="default" onClick={handleEndSession} disabled={isLoading || messages.length === 0} className="bg-primary hover:bg-primary/90 text-primary-foreground text-xs sm:text-sm gap-2 rounded-full px-5 font-bold shadow-sm transition-all hover:shadow-md">
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">End &amp; Summarize</span>
          </Button>
          <Button variant="ghost" onClick={() => { if (confirm("Start a new session? Your current chat will be cleared.")) { storageClear(storageKey); window.location.reload(); } }} className="text-muted-foreground hover:bg-surface-high hover:text-foreground text-xs sm:text-sm gap-2 rounded-full px-4 font-medium"><Trash2 className="w-4 h-4" /><span className="hidden sm:inline">New Session</span></Button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Left Pane (Primary Chat / Modules) */}
        <div className="flex-1 relative flex flex-col min-w-0 bg-surface">
          <AnimatePresence mode="wait">
            {viewMode === "chat" ? (
              <motion.div key="chat" className="h-full flex flex-col max-w-4xl mx-auto w-full">
                <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 md:p-8 custom-scrollbar">
                  <div className="flex flex-col gap-8 pb-10">
                    {messages.map(m => (
                      <div key={m.id} className={`flex gap-3 sm:gap-4 ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                        {m.role === "assistant" && (
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 mt-1 border border-border/20 shadow-sm bg-surface-lowest ${COLOR_CLASSES[entry?.color ?? 'blue']?.text ?? 'text-primary'}`}>
                            <Brain className="w-6 h-6" />
                          </div>
                        )}
                        <div className={`p-5 rounded-[2rem] max-w-[90%] sm:max-w-[85%] text-sm sm:text-[15px] shadow-sm
                           ${m.role === "user" ? "bg-primary-dim/10 border border-primary-dim/20 text-foreground rounded-tr-none" 
                                               : "bg-surface-high text-foreground rounded-tl-none border border-transparent"}`}>
                          <div className="prose dark:prose-invert prose-sm sm:prose-base max-w-none leading-relaxed">
                             <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]} components={MD_COMPONENTS}>{m.content}</ReactMarkdown>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="p-4 sm:p-6 pb-6 sm:pb-8 bg-gradient-to-t from-surface via-surface to-transparent relative z-20">
                  <div className="flex gap-2 max-w-3xl mx-auto bg-surface-high/80 backdrop-blur-md border border-border/40 rounded-full p-2 shadow-lg focus-within:ring-2 focus-within:ring-primary/40 focus-within:border-primary/60 transition-all">
                    <Input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === "Enter" && !e.shiftKey && handleSend()} placeholder="Ask your coach anything..." className="flex-1 bg-transparent border-none text-[15px] rounded-full px-4 focus-visible:ring-0 shadow-none placeholder:text-muted-foreground/60 h-12" />
                    <div className="flex items-center gap-1 pr-2">
                       <VoiceInput onTranscript={t => setInput(p => p + " " + t)} className="hidden sm:flex" />
                       <Button onClick={handleSend} disabled={isLoading} className="bg-primary text-primary-foreground shrink-0 rounded-full w-10 h-10 p-0 shadow-sm hover:scale-105 transition-transform">{isLoading ? <Loader2 className="animate-spin w-5 h-5" /> : <Send className="w-5 h-5" />}</Button>
                    </div>
                  </div>
                  <div className="text-center mt-3">
                     <p className="text-[10px] text-muted-foreground font-bold tracking-widest uppercase">Answers align strictly with College Board CEDs</p>
                  </div>
                </div>
              </motion.div>
            ) : viewMode === "confirm" ? (
              <motion.div key="confirm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="h-full flex items-center justify-center p-8">
                <div className="bg-surface-high border-none rounded-[2rem] p-10 w-full max-w-md shadow-2xl text-center space-y-6">
                  <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-2 text-primary-foreground"><Brain className="w-8 h-8" /></div>
                  <div>
                    <h3 className="text-foreground font-heading italic font-bold text-2xl mb-1">
                      {pendingMode === "mcq"    ? "Start a Practice Quiz?" :
                       pendingMode === "frq"    ? "Start an FRQ Simulation?" :
                       pendingMode === "source" ? "Start a Source / DBQ Exercise?" :
                                                 "Start an Oral Practice?"}
                    </h3>
                    <p className="text-muted-foreground text-sm font-medium">Your chat progress will be saved automatically.</p>
                  </div>
                  <div className="flex gap-4 pt-4">
                    <Button variant="ghost" className="flex-1 h-12 rounded-xl text-muted-foreground hover:bg-surface"
                      onClick={() => setViewMode("chat")}>
                      Not yet
                    </Button>
                    <Button className="flex-1 h-12 rounded-xl bg-primary text-primary-foreground font-bold"
                      onClick={() => setViewMode(pendingMode)}>
                      Let&apos;s go
                    </Button>
                  </div>
                </div>
              </motion.div>
            ) : viewMode === "mcq" ? (
              <MCQTrainer unit={activeConfig.unit} mcqFormat={activeConfig.format} courseSlug={courseSlug} examParam={examParam} onComplete={handleModuleComplete} />
            ) : viewMode === "frq" ? (
              <FRQSimulator topic={activeConfig.topic} courseSlug={courseSlug} courseName={courseName} onComplete={handleModuleComplete} />
            ) : viewMode === "source" ? (
              <SourceSimulator topic={activeConfig.topic} courseSlug={courseSlug} courseName={courseName} onComplete={handleModuleComplete} />
            ) : (
              <OralSimulator topic={activeConfig.topic} courseSlug={courseSlug} courseName={courseName} onComplete={handleModuleComplete} />
            )}
          </AnimatePresence>
        </div>

        {/* RIGHT PANE — Live Contextual Sidebar */}
        <aside className="hidden lg:flex w-80 bg-surface-lowest flex-col border-l border-border/20 z-10 shrink-0">
          <div className="p-6 border-b border-border/20">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-4">Session Context</p>
            {contextData ? (
              <div className="space-y-3">
                {/* Pedagogical Mode */}
                <div className="bg-surface-high rounded-2xl p-4">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse inline-block" /> Current Mode
                  </p>
                  <p className="text-sm font-bold text-foreground font-heading italic">{contextData.mode}</p>
                </div>
                {/* CED Alignment */}
                <div className="bg-surface-high rounded-2xl p-4">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">CED Alignment</p>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="flex-1 h-1.5 bg-surface rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          contextData.alignmentScore >= 8 ? 'bg-emerald-500' :
                          contextData.alignmentScore >= 5 ? 'bg-amber-400' : 'bg-red-400'
                        }`}
                        style={{ width: `${contextData.alignmentScore * 10}%` }}
                      />
                    </div>
                    <span className={`text-xs font-bold ${
                      contextData.alignmentScore >= 8 ? 'text-emerald-500' :
                      contextData.alignmentScore >= 5 ? 'text-amber-400' : 'text-red-400'
                    }`}>{contextData.alignmentScore}/10</span>
                  </div>
                  <p className="text-xs text-muted-foreground italic leading-snug">{contextData.alignmentNote}</p>
                </div>
              </div>
            ) : (
              <div className="bg-surface-high rounded-2xl p-4 text-center">
                <Brain className="w-6 h-6 text-muted-foreground/40 mx-auto mb-2" />
                <p className="text-xs text-muted-foreground">Waiting for first response...</p>
              </div>
            )}
          </div>
          {/* CED Objective */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
            {contextData && (
              <>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-3">Current Unit</p>
                  <div className="bg-surface-high rounded-2xl p-4">
                    <p className="text-sm font-bold text-foreground">{contextData.currentUnit}</p>
                  </div>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-3">CED Objective</p>
                  <div className="bg-surface-high rounded-2xl p-4">
                    <p className="text-xs text-foreground leading-relaxed">{contextData.currentObjective}</p>
                  </div>
                </div>
              </>
            )}
            {!contextData && (
              <p className="text-xs text-muted-foreground italic text-center pt-4">
                Live curriculum tracking will appear here as you work with your coach.
              </p>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}

export default function TutorPage() {
  return (
    <Suspense fallback={<div className="h-screen bg-background text-foreground flex items-center justify-center">Loading Tutor...</div>}>
      <TutorPageInner />
    </Suspense>
  );
}
