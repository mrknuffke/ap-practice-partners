"use client";

import { useState, useRef, useEffect, useCallback, Suspense } from "react";
import { storageGet, storageSet, storageClear } from "@/lib/utils";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import {
  Send, ArrowLeft, Bot, Loader2, Mic,
  Trash2, CheckCircle2, AlertCircle, LogOut, Printer,
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
      <code className={`${className ?? ""} bg-neutral-800 rounded px-1 py-0.5 text-sm font-mono`} {...props}>
        {children}
      </code>
    );
  },
  pre({ children }) {
    return (
      <pre className="bg-neutral-800 rounded-xl p-4 overflow-x-auto text-sm font-mono my-4">
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
    return <thead className="bg-neutral-800 text-neutral-300">{children}</thead>;
  },
  th({ children }) {
    return <th className="px-4 py-2 text-left font-semibold border border-neutral-700">{children}</th>;
  },
  td({ children }) {
    return <td className="px-4 py-2 border border-neutral-700 text-neutral-200">{children}</td>;
  },
  tr({ children }) {
    return <tr className="even:bg-neutral-900/50">{children}</tr>;
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
          <div className="w-20 h-20 rounded-full border-4 border-blue-500/20 border-t-blue-500 animate-spin" />
          <Bot className="w-8 h-8 text-blue-400 absolute inset-0 m-auto" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-white mb-2">Generating Practice Set...</h2>
          <p className="text-neutral-400 max-w-sm mx-auto">
            Building 5 AP-style questions for Unit {unit}. This may take up to 30 seconds.
          </p>
          <p className="text-neutral-500 text-xs mt-3 italic">{quip}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center space-y-4">
        <AlertCircle className="w-12 h-12 text-red-500" />
        <p className="text-neutral-200 font-medium">{error}</p>
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
        className="flex flex-col items-center justify-center h-full p-8 text-center space-y-8 max-w-2xl mx-auto"
      >
        <div className="w-24 h-24 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 relative">
          <div className="absolute inset-0 rounded-full bg-emerald-500/5 animate-ping" />
          <CheckCircle2 className="w-12 h-12 text-emerald-400" />
        </div>
        <h2 className="text-3xl font-bold text-white">Practice Complete!</h2>
        <div className="grid grid-cols-2 gap-4 w-full">
          <div className="p-4 rounded-2xl bg-neutral-900 border border-neutral-800">
            <p className="text-xs text-neutral-500 uppercase font-bold tracking-wider mb-1">Score</p>
            <p className="text-2xl font-bold text-white">{score} / {questions.length}</p>
          </div>
          <div className="p-4 rounded-2xl bg-neutral-900 border border-neutral-800">
            <p className="text-xs text-neutral-500 uppercase font-bold tracking-wider mb-1">Accuracy</p>
            <p className="text-2xl font-bold text-emerald-400">{Math.round((score/questions.length)*100)}%</p>
          </div>
        </div>
        <Button onClick={() => onComplete(summary)} className="w-full h-14 rounded-2xl bg-blue-600">Return to Tutor</Button>
      </motion.div>
    );
  }

  const q = questions[currentIndex];
  const stimulusToShow = sharedStimulus || q.stimulus;

  return (
    <div className="flex flex-col md:flex-row h-full md:overflow-hidden bg-neutral-950 overflow-y-auto">
      <div className="flex-1 border-b md:border-b-0 md:border-r border-neutral-800/50 p-6 lg:p-10 md:overflow-y-auto custom-scrollbar">
        <div className="max-w-prose mx-auto space-y-8">
           <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]} components={MD_COMPONENTS}>{stimulusToShow}</ReactMarkdown>
        </div>
      </div>
      <div className="w-full md:w-[450px] lg:w-[550px] flex flex-col p-6 lg:p-10 md:overflow-y-auto">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-medium text-neutral-500 uppercase tracking-wider">
            Question {currentIndex + 1} of {questions.length}
          </span>
          <div className="flex gap-1">
            {questions.map((_, i) => (
              <div key={i} className={`w-2 h-2 rounded-full transition-colors ${
                i === currentIndex ? 'bg-blue-500' : i < currentIndex ? 'bg-emerald-500' : 'bg-neutral-700'
              }`} />
            ))}
          </div>
        </div>
        <h3 className="text-lg font-bold text-white mb-4">{q.question}</h3>
        <div className="flex-1 space-y-3 overflow-y-auto">
          {(Object.entries(q.options) as [string, string][]).map(([key, val]) => (
            <button
              key={key}
              disabled={showExplanation[currentIndex]}
              onClick={() => handleSelect(key)}
              className={`w-full text-left p-4 rounded-2xl border transition-all ${
                showExplanation[currentIndex] && key === q.correctAnswer ? 'border-emerald-500 bg-emerald-500/10' :
                showExplanation[currentIndex] && answers[currentIndex] === key ? 'border-red-500 bg-red-500/10' :
                answers[currentIndex] === key ? 'border-blue-500 bg-blue-500/10' : 'border-neutral-800 bg-neutral-900'
              }`}
            >
              <span className="font-bold mr-4">{key}.</span> {val}
            </button>
          ))}
          {showExplanation[currentIndex] && (
            <div className="mt-3 p-4 rounded-xl bg-neutral-900 border-l-4 border-blue-500 text-sm text-neutral-200">
              <p className="text-xs font-bold text-blue-400 uppercase tracking-wider mb-1">Explanation</p>
              {q.explanation}
            </div>
          )}
        </div>
        <div className="pt-8 flex gap-3">
          <Button disabled={currentIndex === 0} onClick={() => setCurrentIndex(prev => prev - 1)} variant="ghost">Previous</Button>
          <Button onClick={() => (currentIndex === questions.length - 1 ? setCurrentIndex(questions.length) : setCurrentIndex(prev => prev + 1))} className="flex-1 bg-blue-600">
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

  if (isLoading) return <div className="flex h-full items-center justify-center text-white">Compiling Source Packet...</div>;

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
      <div className="p-8 max-w-4xl mx-auto space-y-8 text-white overflow-y-auto">
        <h2 className="text-4xl font-bold">DBQ Result: {results.totalPoints}/7</h2>
        <p className="text-neutral-300">{results.overallSummary}</p>
        <div className="space-y-3">
          {(Object.entries(results.breakdown) as [string, { earned: boolean | number; max?: number; feedback: string }][]).map(([key, val]) => {
            const maxPts = typeof val.max === "number" ? val.max : 1;
            const earnedPts = typeof val.earned === "number" ? val.earned : val.earned ? 1 : 0;
            const full = earnedPts === maxPts;
            const none = earnedPts === 0;
            return (
              <div key={key} className="p-5 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white">{criteriaLabels[key] ?? key}</span>
                  <span className={`font-bold ${full ? "text-emerald-400" : none ? "text-red-400" : "text-yellow-400"}`}>
                    {earnedPts} / {maxPts} pt{maxPts !== 1 ? "s" : ""}
                  </span>
                </div>
                <p className="text-neutral-300 text-sm">{val.feedback}</p>
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
    <div className="flex h-full bg-neutral-950 overflow-hidden">
      <div className="w-[100px] border-r border-neutral-800 p-2 flex flex-col gap-2">
        {exercise?.documents.map(d => (
          <button key={d.id} onClick={() => setActiveDocId(d.id)} className={`p-4 rounded-xl border ${activeDocId === d.id ? 'border-amber-500 bg-amber-500/10' : 'border-neutral-800'}`}>{d.id}</button>
        ))}
      </div>
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="p-6 border-b border-neutral-800 bg-neutral-900/50">
          <h1 className="text-xl font-bold text-white">Prompt: {exercise?.prompt}</h1>
        </div>
        <div className="flex-1 overflow-y-auto p-12">
          <div className="max-w-prose mx-auto p-10 bg-neutral-900 rounded-3xl border border-neutral-800">
            <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]} components={MD_COMPONENTS}>{activeDoc?.content || ""}</ReactMarkdown>
          </div>
        </div>
      </div>
      <div className="w-[500px] border-l border-neutral-800 p-8 flex flex-col bg-neutral-900/50">
        <h3 className="text-xl font-bold text-white mb-4">Your Argument</h3>
        <textarea className="flex-1 bg-neutral-950 p-6 rounded-2xl border border-neutral-800 text-white" value={essay} onChange={e => setEssay(e.target.value)} />
        <div className="mt-4 flex justify-end"><VoiceInput onTranscript={t => setEssay(p => p + " " + t)} /></div>
        <Button onClick={handleGrade} disabled={isGrading} className="mt-6 h-16 bg-amber-600">{isGrading ? "Grading..." : "Submit for Review"}</Button>
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
          <div className="w-20 h-20 rounded-full border-4 border-purple-500/20 border-t-purple-500 animate-spin" />
          <Bot className="w-8 h-8 text-purple-400 absolute inset-0 m-auto" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-white mb-2">Generating FRQ...</h2>
          <p className="text-neutral-400 max-w-sm mx-auto">
            Building a stimulus-based free response question. This may take up to 30 seconds.
          </p>
          <p className="text-neutral-500 text-xs mt-3 italic">{quip}</p>
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
      <div className="p-8 max-w-4xl mx-auto space-y-8 text-white overflow-y-auto">
        <h2 className="text-4xl font-bold">FRQ Score: {results.totalPoints}/{results.maxPoints}</h2>
        <p className="text-neutral-300">{results.overallSummary}</p>
        <div className="space-y-4">
          {results.parts.map(p => (
            <div key={p.letter} className="p-5 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-white text-lg">Part ({p.letter})</span>
                <span className={`text-lg font-bold ${p.pointsEarned === (frq?.parts.find(fp => fp.letter === p.letter)?.points ?? 0) ? "text-emerald-400" : p.pointsEarned === 0 ? "text-red-400" : "text-yellow-400"}`}>
                  {p.pointsEarned} / {frq?.parts.find(fp => fp.letter === p.letter)?.points ?? "?"} pts
                </span>
              </div>
              <p className="text-neutral-300 text-sm">{p.feedback}</p>
            </div>
          ))}
        </div>
        <Button onClick={() => onComplete(summary)} className="w-full bg-purple-600">Return to Tutor</Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col md:flex-row h-full bg-neutral-950 overflow-y-auto md:overflow-hidden">
      <div className="flex-1 p-6 md:p-12 border-b md:border-b-0 md:border-r border-neutral-800 md:overflow-y-auto custom-scrollbar bg-neutral-900/20">
        <div className="max-w-prose mx-auto">
          <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]} components={MD_COMPONENTS}>{frq?.stimulus || ""}</ReactMarkdown>
        </div>
      </div>
      <div className="w-full md:w-[600px] p-6 md:p-12 bg-neutral-900/50 flex flex-col md:overflow-y-auto">
        <h3 className="text-2xl font-bold text-white mb-8">Response Entry</h3>
        <div className="flex-1 space-y-6 overflow-y-auto pr-2">
          {frq?.parts.map(p => (
            <div key={p.letter}>
              <div className="text-white mb-2 prose prose-invert prose-sm max-w-none">
                <span className="font-semibold text-neutral-400 not-prose">{p.letter}.</span>{" "}
                <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]} components={MD_COMPONENTS}>{p.question}</ReactMarkdown>
              </div>
              <div className="relative">
                <textarea
                  className="w-full h-32 bg-neutral-950 border border-neutral-800 rounded-xl p-4 text-white resize-none"
                  value={answers[p.letter] || ""}
                  onChange={e => setAnswers(prev => ({ ...prev, [p.letter]: e.target.value }))}
                  placeholder="Type your response here..."
                />
                <div className="absolute right-3 bottom-3">
                  <VoiceInput onTranscript={t => setAnswers(prev => ({ ...prev, [p.letter]: (prev[p.letter] || "") + " " + t }))} />
                </div>
              </div>
              <label
                className={`flex flex-col items-center justify-center gap-1 mt-2 p-3 rounded-xl border border-dashed text-xs cursor-pointer transition-colors ${
                  attachments[p.letter]
                    ? "border-emerald-600 bg-emerald-900/20 text-emerald-400"
                    : "border-neutral-700 text-neutral-500 hover:border-neutral-500 hover:text-neutral-300 hover:bg-neutral-900/50"
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
        <Button onClick={handleGrade} disabled={isGrading} className="mt-8 h-16 bg-emerald-600">{isGrading ? "Grading..." : "Submit Response"}</Button>
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
      <div className="h-full flex items-center justify-center bg-neutral-950 p-8 text-center">
        <div className="max-w-md space-y-6">
          <Mic className="w-16 h-16 text-red-500 mx-auto" />
          <h2 className="text-3xl font-bold text-white">Oral Practice</h2>
          <Button onClick={startRecording} className="w-full h-16 bg-red-600 text-lg">Start 20s Prompt</Button>
        </div>
      </div>
    );
  }

  if (stage === "recording") {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-neutral-950 text-white space-y-8">
        <div className="text-6xl font-black">{timeLeft}s</div>
        <p className="text-red-500 animate-pulse font-bold tracking-widest text-2xl">RECORDING...</p>
        <Button onClick={stopRecording} variant="outline" className="text-red-500 border-red-500">Finish Early</Button>
      </div>
    );
  }

  if (stage === "grading") return <div className="h-full flex items-center justify-center text-white">AI is evaluating your speech...</div>;

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
      <div className="p-8 max-w-4xl mx-auto text-white space-y-8 overflow-y-auto">
        <h2 className="text-4xl font-bold">Oral Score: {results.score}/6</h2>
        <div className="p-6 bg-neutral-900 rounded-3xl border border-neutral-800 italic">&ldquo;{results.overallFeedback}&rdquo;</div>
        <div className="space-y-3">
          {oralCriteria.map(c => (
            <div key={c.key} className="p-5 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-1">
              <span className="font-bold text-white">{c.label}</span>
              <p className="text-neutral-300 text-sm">{c.value}</p>
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
  const storageKey = `ap_tutor_${courseSlug}_${examParam || "default"}`;
  const scrollRef = useRef<HTMLDivElement>(null);
  const userSentRef = useRef(false);
  const isStreamingRef = useRef(false);
  const greetingFired = useRef(false);
  const sendMessageRef = useRef<((current: Message[], news?: Message) => Promise<void>) | null>(null);

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
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        fullContent += chunk;
        setMessages(p => {
          const last = p[p.length - 1];
          return [...p.slice(0, -1), { ...last, content: fullContent }];
        });
      }

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

      // Strip trigger tags from the displayed message regardless of whether they fired
      const cleanedContent = fullContent.replace(/\n?:::(?:mcq|frq|source|oral)\s*\{.*?\}\s*:::/g, "").trimEnd();
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
    const win = window.open("", "_blank");
    if (!win) return;
    win.document.write(`<!DOCTYPE html>
<html>
<head>
  <title>${courseName} — Session Summary</title>
  <style>
    body { font-family: Georgia, serif; max-width: 720px; margin: 40px auto; padding: 0 24px; color: #111; line-height: 1.7; }
    h1 { font-size: 1.5rem; margin-bottom: 4px; }
    .meta { color: #666; font-size: 0.9rem; margin-bottom: 32px; }
    h2 { font-size: 1.2rem; margin-top: 28px; border-bottom: 1px solid #ddd; padding-bottom: 4px; }
    h3 { font-size: 1rem; margin-top: 20px; color: #333; }
    ul, ol { padding-left: 20px; }
    li { margin-bottom: 6px; }
    hr { border: none; border-top: 1px solid #ddd; margin: 24px 0; }
    em { color: #555; font-size: 0.9rem; }
    @media print { body { margin: 20px; } }
  </style>
</head>
<body>
  <h1>${courseName} — Study Session Summary</h1>
  <p class="meta">Generated ${new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</p>
  <div id="content"></div>
  <script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script>
  <script>
    document.getElementById("content").innerHTML = marked.parse(${JSON.stringify(summaryMsg.content)});
    window.onload = () => window.print();
  </script>
</body>
</html>`);
    win.document.close();
  };

  return (
    <div className="flex flex-col h-dvh bg-neutral-950 text-white">
      <header className="px-3 py-2 border-b border-neutral-800 flex items-center justify-between bg-neutral-900/50 backdrop-blur-md gap-2 min-w-0">
        <div className="flex items-center gap-2 min-w-0">
          <Button variant="ghost" size="icon" onClick={() => router.push("/")} className="shrink-0"><ArrowLeft className="w-5 h-5" /></Button>
          <h1 className="font-bold text-sm sm:text-base truncate">{courseName}</h1>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {summaryReady && (
            <Button variant="ghost" onClick={handlePrintSummary} className="text-blue-400 text-xs sm:text-sm gap-1 px-2">
              <Printer className="w-4 h-4" />
              <span className="hidden sm:inline">Print Summary</span>
            </Button>
          )}
          <Button variant="ghost" onClick={handleEndSession} disabled={isLoading || messages.length === 0} className="text-emerald-400 text-xs sm:text-sm gap-1 px-2">
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">End &amp; Summarize</span>
          </Button>
          <Button variant="ghost" size="icon" onClick={() => { storageClear(storageKey); window.location.reload(); }} className="text-red-400"><Trash2 className="w-4 h-4" /></Button>
        </div>
      </header>

      <div className="flex-1 relative overflow-hidden">
        <AnimatePresence mode="wait">
          {viewMode === "chat" ? (
            <motion.div key="chat" className="h-full flex flex-col max-w-4xl mx-auto w-full">
              <div ref={scrollRef} className="flex-1 overflow-y-auto p-4">
                <div className="flex flex-col gap-6 pb-6">
                  {messages.map(m => (
                    <div key={m.id} className={`flex gap-2 sm:gap-4 ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                      {m.role === "assistant" && <Bot className={`w-6 h-6 sm:w-8 sm:h-8 shrink-0 mt-1 ${COLOR_CLASSES[entry?.color ?? 'blue']?.text ?? 'text-blue-400'}`} />}
                      <div className={`p-3 sm:p-4 rounded-2xl max-w-[90%] sm:max-w-[85%] text-sm sm:text-base ${m.role === "user" ? "bg-blue-600" : "bg-neutral-800"}`}>
                        <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]} components={MD_COMPONENTS}>{m.content}</ReactMarkdown>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="p-3 sm:p-4 border-t border-neutral-800 bg-neutral-900/80">
                <div className="flex gap-2">
                  <Input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === "Enter" && !e.shiftKey && handleSend()} placeholder="Ask anything..." className="flex-1 bg-neutral-950 border-neutral-800 text-sm sm:text-base" />
                  <VoiceInput onTranscript={t => setInput(p => p + " " + t)} className="hidden sm:flex" />
                  <Button onClick={handleSend} disabled={isLoading} className="bg-blue-600 shrink-0">{isLoading ? <Loader2 className="animate-spin" /> : <Send />}</Button>
                </div>
              </div>
            </motion.div>
          ) : viewMode === "confirm" ? (
            <motion.div key="confirm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="h-full flex items-center justify-center p-8">
              <div className="bg-neutral-900 border border-neutral-700 rounded-3xl p-8 w-full max-w-sm shadow-2xl text-center space-y-4">
                <p className="text-white font-semibold text-lg">
                  {pendingMode === "mcq"    ? "Start a Practice Quiz?" :
                   pendingMode === "frq"    ? "Start an FRQ Simulation?" :
                   pendingMode === "source" ? "Start a Source/DBQ Exercise?" :
                                             "Start an Oral Practice?"}
                </p>
                <p className="text-neutral-400 text-sm">You can return to the chat when you&apos;re done.</p>
                <div className="flex gap-3 pt-2">
                  <Button variant="ghost" className="flex-1 border border-neutral-700"
                    onClick={() => setViewMode("chat")}>
                    Not yet
                  </Button>
                  <Button className="flex-1 bg-blue-600"
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
    </div>
  );
}

export default function TutorPage() {
  return (
    <Suspense fallback={<div className="h-screen bg-neutral-950 text-white flex items-center justify-center">Loading Tutor...</div>}>
      <TutorPageInner />
    </Suspense>
  );
}
