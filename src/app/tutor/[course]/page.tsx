"use client";

import { useState, useRef, useEffect, useCallback, Suspense } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import {
  Send, ArrowLeft, Bot, Loader2, Mic,
  Trash2, CheckCircle2, AlertCircle, LogOut,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { motion, AnimatePresence } from "framer-motion";
import { COURSE_BY_SLUG } from "@/constants/courses";
import { VoiceInput } from "@/components/VoiceInput";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  attachments?: { mimeType: string; data: string; name: string }[];
};

interface MCQQuestion {
  id: string;
  stimulus: string;
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

type ViewMode = "chat" | "mcq" | "frq" | "source" | "oral";

function MCQTrainer({ 
  unit, 
  courseSlug,
  examParam,
  onComplete 
}: { 
  unit: string; 
  courseSlug: string; 
  examParam?: string | null;
  onComplete: (summary: string) => void 
}) {
  const [questions, setQuestions] = useState<MCQQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [showExplanation, setShowExplanation] = useState<Record<number, boolean>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadQuestions() {
      try {
        const res = await fetch("/api/mcq/generate", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-classroom-code": localStorage.getItem("classroom_code") || "",
          },
          body: JSON.stringify({ slug: courseSlug, examParam, unit }),
        });
        if (!res.ok) throw new Error(await res.text());
        const data = await res.json();
        setQuestions(data);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Failed to generate questions.");
      } finally {
        setIsLoading(false);
      }
    }
    loadQuestions();
  }, [courseSlug, examParam, unit]);

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
            I&apos;m building 5 stimulus-based AP questions for Unit {unit}. This takes about 10-15 seconds.
          </p>
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
    const summary = `I completed the Unit ${unit} MCQ practice session. 
Score: ${score}/${questions.length} (${Math.round((score/questions.length)*100)}%).
Can we discuss the concepts I missed?`;
    
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

  return (
    <div className="flex flex-col md:flex-row h-full overflow-hidden bg-neutral-950">
      <div className="flex-1 overflow-y-auto border-r border-neutral-800/50 p-6 lg:p-10 custom-scrollbar">
        <div className="max-w-prose mx-auto space-y-8">
           <ReactMarkdown remarkPlugins={[remarkGfm]}>{q.stimulus}</ReactMarkdown>
        </div>
      </div>
      <div className="w-full md:w-[450px] lg:w-[550px] flex flex-col p-6 lg:p-10">
        <h3 className="text-xl font-bold text-white mb-8">{q.question}</h3>
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
            <div className="mt-4 p-4 rounded-xl bg-neutral-900 text-sm text-neutral-400 italic">
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
            "x-classroom-code": localStorage.getItem("classroom_code") || "",
          },
          body: JSON.stringify({ slug: courseSlug, topic }),
        });
        setExercise(await res.json());
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
          "x-classroom-code": localStorage.getItem("classroom_code") || "",
        },
        body: JSON.stringify({
          essay,
          prompt: exercise.prompt,
          documents: exercise.documents,
          rubric: exercise.rubric,
          courseName
        }),
      });
      setResults(await res.json());
    } finally {
      setIsGrading(false);
    }
  };

  if (isLoading) return <div className="flex h-full items-center justify-center text-white">Compiling Source Packet...</div>;

  if (results) {
    return (
      <div className="p-12 max-w-4xl mx-auto space-y-10 text-white">
        <h2 className="text-4xl font-bold">DBQ Result: {results.totalPoints}/7</h2>
        <p className="text-neutral-400">{results.overallSummary}</p>
        <Button onClick={() => onComplete(`I completed the Source Packet for "${topic}". Score: ${results.totalPoints}/7.`)} className="w-full h-16 bg-amber-600">Return to Tutor</Button>
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
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{activeDoc?.content || ""}</ReactMarkdown>
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
  const [isLoading, setIsLoading] = useState(true);
  const [isGrading, setIsGrading] = useState(false);
  const [results, setResults] = useState<GradeResult | null>(null);

  useEffect(() => {
    async function loadFRQ() {
      try {
        const res = await fetch("/api/frq/generate", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-classroom-code": localStorage.getItem("classroom_code") || "",
          },
          body: JSON.stringify({ slug: courseSlug, topic }),
        });
        setFrq(await res.json());
      } finally {
        setIsLoading(false);
      }
    }
    loadFRQ();
  }, [courseSlug, topic]);

  const handleGrade = async () => {
    setIsGrading(true);
    try {
      const res = await fetch("/api/frq/grade", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-classroom-code": localStorage.getItem("classroom_code") || "",
        },
        body: JSON.stringify({
          courseName,
          parts: frq?.parts,
          answers: frq?.parts.map(p => ({ letter: p.letter, answer: answers[p.letter] || "" }))
        }),
      });
      setResults(await res.json());
    } finally {
      setIsGrading(false);
    }
  };

  if (isLoading) return <div className="h-full flex items-center justify-center text-white">Generating FRQ Simulator...</div>;

  if (results) {
    return (
       <div className="p-12 max-w-4xl mx-auto space-y-8 text-white">
          <h2 className="text-4xl font-bold">FRQ Score: {results.totalPoints}/{results.maxPoints}</h2>
          <Button onClick={() => onComplete(`Completed FRQ on "${topic}". Score: ${results.totalPoints}/${results.maxPoints}`)} className="w-full bg-purple-600">Return to Tutor</Button>
       </div>
    );
  }

  return (
    <div className="flex h-full bg-neutral-950 overflow-hidden">
      <div className="flex-1 overflow-y-auto p-12 custom-scrollbar bg-neutral-900/20">
         <div className="max-w-prose mx-auto">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{frq?.stimulus || ""}</ReactMarkdown>
         </div>
      </div>
      <div className="w-[600px] border-l border-neutral-800 p-12 bg-neutral-900/50 flex flex-col">
         <h3 className="text-2xl font-bold text-white mb-8">Response Entry</h3>
         <div className="flex-1 space-y-6 overflow-y-auto pr-2">
            {frq?.parts.map(p => (
              <div key={p.letter} className="relative">
                 <p className="text-white mb-2 font-bold">{p.letter}. {p.question}</p>
                 <textarea className="w-full h-32 bg-neutral-950 border border-neutral-800 rounded-xl p-4 text-white" value={answers[p.letter] || ""} onChange={e => setAnswers(prev => ({ ...prev, [p.letter]: e.target.value }))} />
                 <div className="absolute right-4 bottom-4"><VoiceInput onTranscript={t => setAnswers(prev => ({ ...prev, [p.letter]: (prev[p.letter] || "") + " " + t }))} /></div>
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
        headers: { "Content-Type": "application/json", "x-classroom-code": localStorage.getItem("classroom_code") || "" },
        body: JSON.stringify({ audioBase64: base64Audio, mimeType: blob.type, prompt: topic, courseName }),
      });
      setResults(await res.json());
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
    return (
      <div className="p-12 max-w-4xl mx-auto text-white space-y-8">
        <h2 className="text-4xl font-bold">Oral Score: {results.score}/6</h2>
        <div className="p-6 bg-neutral-900 rounded-3xl border border-neutral-800 italic">&ldquo;{results.overallFeedback}&rdquo;</div>
        <Button onClick={() => onComplete(`Oral Practice for "${topic}". Score: ${results.score}/6.`)} className="w-full bg-red-600">Return to Tutor</Button>
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
  const [activeConfig, setActiveConfig] = useState<Record<string, string>>({});
  const [attachments, setAttachments] = useState<{ mimeType: string; data: string; name: string }[]>([]);
  const storageKey = `ap_tutor_${courseSlug}_${examParam || "default"}`;
  const bottomRef = useRef<HTMLDivElement>(null);
  const greetingFired = useRef(false);
  const sendMessageRef = useRef<((current: Message[], news?: Message) => Promise<void>) | null>(null);

  const sendMessage = useCallback(async (current: Message[], news?: Message) => {
    const all = news ? [...current, news] : current;
    if (news) setMessages(all);
    setIsLoading(true);
    try {
      const res = await fetch("/api/tutor", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-classroom-code": localStorage.getItem("classroom_code") || "" },
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

      if (mcqMatch) { setActiveConfig(JSON.parse(mcqMatch[1])); setViewMode("mcq"); }
      else if (frqMatch) { setActiveConfig(JSON.parse(frqMatch[1])); setViewMode("frq"); }
      else if (sourceMatch) { setActiveConfig(JSON.parse(sourceMatch[1])); setViewMode("source"); }
      else if (oralMatch) { setActiveConfig(JSON.parse(oralMatch[1])); setViewMode("oral"); }

    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [courseSlug, examParam]);

  sendMessageRef.current = sendMessage;

  useEffect(() => {
    if (greetingFired.current) return;
    const saved = localStorage.getItem(storageKey);
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
  }, [storageKey]);

  useEffect(() => {
    if (messages.length > 0) localStorage.setItem(storageKey, JSON.stringify(messages));
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, storageKey]);

  const handleSend = async () => {
    if ((!input.trim() && attachments.length === 0) || isLoading) return;
    const msg: Message = { id: Date.now().toString(), role: "user", content: input.trim(), attachments: attachments.length > 0 ? attachments : undefined };
    setInput("");
    setAttachments([]);
    await sendMessage(messages, msg);
  };

  const handleModuleComplete = async (summary: string) => {
    setViewMode("chat");
    await sendMessage(messages, { id: Date.now().toString(), role: "user", content: summary });
  };

  const handleEndSession = async () => {
    setViewMode("chat");
    setIsLoading(true);
    try {
      const res = await fetch("/api/summary", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-classroom-code": localStorage.getItem("classroom_code") || "" },
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
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-neutral-950 text-white">
      <header className="p-4 border-b border-neutral-800 flex items-center justify-between bg-neutral-900/50 backdrop-blur-md">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => router.push("/")}><ArrowLeft className="w-5 h-5 mr-2" /> Home</Button>
          <div><h1 className="font-bold">{courseName} Tutor</h1></div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" onClick={handleEndSession} disabled={isLoading || messages.length === 0} className="text-emerald-400 text-sm gap-1.5">
            <LogOut className="w-4 h-4" /> End &amp; Summarize
          </Button>
          <Button variant="ghost" onClick={() => { localStorage.removeItem(storageKey); window.location.reload(); }} className="text-red-400"><Trash2 className="w-4 h-4" /></Button>
        </div>
      </header>

      <div className="flex-1 relative overflow-hidden">
        <AnimatePresence mode="wait">
          {viewMode === "chat" ? (
            <motion.div key="chat" className="h-full flex flex-col max-w-4xl mx-auto w-full">
              <ScrollArea className="flex-1 p-4">
                <div className="flex flex-col gap-6 pb-24">
                  {messages.map(m => (
                    <div key={m.id} className={`flex gap-4 ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                      {m.role === "assistant" && <Bot className="w-8 h-8 text-blue-400 shrink-0" />}
                      <div className={`p-4 rounded-2xl max-w-[85%] ${m.role === "user" ? "bg-blue-600" : "bg-neutral-800"}`}>
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{m.content}</ReactMarkdown>
                      </div>
                    </div>
                  ))}
                  <div ref={bottomRef} />
                </div>
              </ScrollArea>
              <div className="p-4 border-t border-neutral-800 bg-neutral-900/80">
                <div className="flex gap-2">
                  <Input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === "Enter" && handleSend()} placeholder="Ask anything..." className="flex-1 bg-neutral-950 border-neutral-800" />
                  <VoiceInput onTranscript={t => setInput(p => p + " " + t)} />
                  <Button onClick={handleSend} disabled={isLoading} className="bg-blue-600">{isLoading ? <Loader2 className="animate-spin" /> : <Send />}</Button>
                </div>
              </div>
            </motion.div>
          ) : viewMode === "mcq" ? (
            <MCQTrainer unit={activeConfig.unit} courseSlug={courseSlug} examParam={examParam} onComplete={handleModuleComplete} />
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
