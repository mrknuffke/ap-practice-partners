"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, ChevronRight, RotateCcw, CheckCircle2, Sparkles } from "lucide-react";
import { storageGet } from "@/lib/utils";
import ReactMarkdown from "react-markdown";

interface ContrastAct {
  type: "contrast";
  title: string;
  concept: string;
  badLabel: string;
  goodLabel: string;
  badMessages: { role: "user" | "assistant"; content: string }[];
  goodMessages: { role: "user" | "assistant"; content: string }[];
  coachNote: string;
}

interface SpotlightAct {
  type: "spotlight";
  title: string;
  concept: string;
  featureLabel: string;
  messages: { role: "user" | "assistant"; content: string }[];
  coachNote: string;
}

type Act = ContrastAct | SpotlightAct;

const SLUG = "ap-biology";

const ACTS: Act[] = [
  {
    type: "contrast",
    title: "Act 1 — Don't ask for answers",
    concept: "The tutor is designed to teach, not to give you answers. Watch what happens with each approach.",
    badLabel: "❌ Asking for the answer",
    goodLabel: "✓ Asking for understanding",
    badMessages: [
      { role: "user", content: "Just tell me the answer: what happens during the light-dependent reactions of photosynthesis? I have a test tomorrow." },
    ],
    goodMessages: [
      { role: "user", content: "Explain the light-dependent reactions of photosynthesis to me. I want to actually understand what's happening." },
    ],
    coachNote: "Notice how the tutor on the left redirects rather than dumps information — that's intentional. The version on the right starts a real learning conversation: short explanation, then a question back to you. Answering that question is where the learning actually happens.",
  },
  {
    type: "contrast",
    title: "Act 2 — Engage with the follow-up",
    concept: "The tutor always asks you a question. What you do next makes all the difference.",
    badLabel: "❌ Skipping the question",
    goodLabel: "✓ Trying an answer (even a rough one)",
    badMessages: [
      { role: "user", content: "Explain meiosis." },
      { role: "assistant", content: "Meiosis is the process of cell division that produces gametes — sex cells — with half the chromosome number of the parent cell. It has two rounds of division (Meiosis I and II).\n\nHere's a key question: why does the chromosome number need to be halved before fertilization?" },
      { role: "user", content: "Can you just keep explaining? Tell me about Meiosis I and II." },
    ],
    goodMessages: [
      { role: "user", content: "Explain meiosis." },
      { role: "assistant", content: "Meiosis is the process of cell division that produces gametes — sex cells — with half the chromosome number of the parent cell. It has two rounds of division (Meiosis I and II).\n\nHere's a key question: why does the chromosome number need to be halved before fertilization?" },
      { role: "user", content: "I think... if it wasn't halved, then when sperm and egg joined, the offspring would have double the chromosomes? Like it would keep doubling every generation?" },
    ],
    coachNote: "The rough answer on the right is excellent — not because it's perfect, but because it shows real thinking. The tutor can now build on that exact reasoning. Skipping the question (left) stalls the conversation and keeps you in passive reading mode, which doesn't build exam-ready recall.",
  },
  {
    type: "spotlight",
    title: "Act 3 — MCQ Practice Mode",
    concept: "The tutor can generate College Board-style multiple choice questions on any unit or topic.",
    featureLabel: "🎯 AP-style MCQ in action",
    messages: [
      { role: "user", content: "Give me one AP Biology multiple choice question on cell membranes and membrane transport. Make it the kind of question that would actually appear on the AP exam — stimulus-based with realistic wrong answers." },
    ],
    coachNote: "Notice the AP-style format: a realistic scenario, plausible distractors that test common misconceptions, not just obviously wrong options. You can ask for MCQ on any unit, any topic. After you answer, the bot will explain why each option is right or wrong.",
  },
  {
    type: "spotlight",
    title: "Act 4 — FRQ Simulator",
    concept: "The tutor generates multi-part Free Response Questions with AP task verbs and point values — just like the real exam.",
    featureLabel: "📝 FRQ prompt in action",
    messages: [
      { role: "user", content: "Generate an AP Biology free response question on natural selection and evolution. It should be multi-part, use real AP task verbs like 'describe', 'explain', 'justify', and include approximate point values for each part." },
    ],
    coachNote: "FRQ practice is one of the highest-leverage study activities because it forces you to produce knowledge, not just recognize it. After you write your response, the tutor grades it part-by-part against a rubric — just like a real AP reader would.",
  },
  {
    type: "spotlight",
    title: "Act 5 — Explanation Partner Mode",
    concept: "Instead of the bot explaining to you, YOU explain to the bot. It listens, asks probing questions, and helps you find your own gaps.",
    featureLabel: "🧠 Explanation Partner in action",
    messages: [
      { role: "user", content: "I'm going to explain the cell cycle to you — like I'm the teacher. Listen, and when I'm done ask me one probing Socratic question about something I might have glossed over or gotten slightly wrong. Here goes: The cell cycle has two main phases — interphase and mitosis. Interphase is when the cell grows and copies its DNA. Then mitosis splits the cell into two identical daughter cells. That's pretty much it." },
    ],
    coachNote: "This is the most powerful mode in the app. Students who can explain a concept out loud (or in writing) understand it at a fundamentally deeper level than students who can only recognize it. The tutor's probing question targets exactly what's missing or imprecise — which is far more valuable than another explanation you didn't ask for.",
  },
];

// Strip :::context::: metadata blocks from display, including partial blocks during stream
function cleanContent(text: string): string {
  let cleaned = text.replace(/:::context\s*\{[\s\S]*?\}\s*:::/g, "").trim();
  const match = cleaned.match(/:::context\b/);
  if (match && match.index !== undefined) {
    cleaned = cleaned.substring(0, match.index).trim();
  }
  return cleaned;
}

interface StreamState {
  content: string;
  done: boolean;
  error: boolean;
}

export function InteractiveDemo() {
  const [actIndex, setActIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [left, setLeft] = useState<StreamState>({ content: "", done: false, error: false });
  const [right, setRight] = useState<StreamState>({ content: "", done: false, error: false });
  const [showCoach, setShowCoach] = useState(false);

  const leftPendingRef = useRef("");
  const rightPendingRef = useRef("");
  const leftDripRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const rightDripRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const act = ACTS[actIndex];
  const isContrast = act.type === "contrast";
  const bothDone = isContrast ? left.done && right.done : left.done; // spotlight only uses left

  function streamTo(
    messages: { role: "user" | "assistant"; content: string }[],
    pendingRef: React.MutableRefObject<string>,
    dripRef: React.MutableRefObject<ReturnType<typeof setInterval> | null>,
    setter: React.Dispatch<React.SetStateAction<StreamState>>,
    onDone: () => void
  ) {
    const code = storageGet("classroom_code") || "";
    let isStreamDone = false;
    let displayedLen = 0;

    if (dripRef.current) clearInterval(dripRef.current);
    dripRef.current = setInterval(() => {
      const target = pendingRef.current;
      if (displayedLen >= target.length) {
        if (isStreamDone) {
          if (dripRef.current) {
            clearInterval(dripRef.current);
            dripRef.current = null;
          }
          onDone();
        }
        return;
      }
      const lag = target.length - displayedLen;
      const step = lag > 400 ? 5 : lag > 150 ? 4 : lag > 40 ? 3 : 1;
      displayedLen = Math.min(displayedLen + step, target.length);
      setter(prev => ({ ...prev, content: cleanContent(target.slice(0, displayedLen)) }));
    }, 40);

    fetch("/api/tutor", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-classroom-code": code },
      body: JSON.stringify({ slug: SLUG, examParam: null, messages }),
    }).then(async res => {
      if (!res.body) throw new Error("No body");
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      pendingRef.current = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        pendingRef.current += decoder.decode(value);
      }
      isStreamDone = true;
    }).catch(() => {
      setter(prev => ({ ...prev, error: true, done: true }));
      isStreamDone = true;
    });
  }

  function handlePlay() {
    setPlaying(true);
    setLeft({ content: "", done: false, error: false });
    setRight({ content: "", done: false, error: false });
    setShowCoach(false);

    let leftDone = false;
    let rightDone = false;

    const checkBothDone = () => {
      if (isContrast ? (leftDone && rightDone) : leftDone) {
        setTimeout(() => setShowCoach(true), 400);
      }
    };

    const fakeGreeting: { role: "assistant"; content: string } = { 
      role: "assistant", 
      content: "Hello! I am your AP Biology tutor. Here's how we can work together today:\n\n1. **Explain**\n2. **Practice**\n3. **Review**\n4. **Visualize**\n5. **Quick Review**\n6. **Explanation Partner**\n\nWhich mode would you like to start with?" 
    };

    const messages = isContrast
      ? [fakeGreeting, ...(act as ContrastAct).badMessages]
      : [fakeGreeting, ...(act as SpotlightAct).messages];

    streamTo(messages, leftPendingRef, leftDripRef, setLeft, () => {
      setLeft(prev => ({ ...prev, done: true }));
      leftDone = true;
      checkBothDone();
    });

    if (isContrast) {
      const goodMessages = [fakeGreeting, ...(act as ContrastAct).goodMessages];
      streamTo(goodMessages, rightPendingRef, rightDripRef, setRight, () => {
        setRight(prev => ({ ...prev, done: true }));
        rightDone = true;
        checkBothDone();
      });
    }
  }

  function handleReset() {
    if (leftDripRef.current) clearInterval(leftDripRef.current);
    if (rightDripRef.current) clearInterval(rightDripRef.current);
    leftPendingRef.current = "";
    rightPendingRef.current = "";
    setPlaying(false);
    setLeft({ content: "", done: false, error: false });
    setRight({ content: "", done: false, error: false });
    setShowCoach(false);
  }

  function handleNext() {
    handleReset();
    setTimeout(() => setActIndex(i => i + 1), 50);
  }

  const isLast = actIndex === ACTS.length - 1;

  return (
    <div className="space-y-6">
      {/* Progress */}
      <div className="flex items-center gap-2">
        {ACTS.map((a, i) => (
          <div
            key={i}
            className={`h-1.5 rounded-full flex-1 transition-all duration-300 ${
              i < actIndex ? "bg-primary" : i === actIndex ? "bg-primary/60" : "bg-border"
            }`}
          />
        ))}
        <span className="text-xs text-muted-foreground ml-2 shrink-0">
          {actIndex + 1} / {ACTS.length}
        </span>
      </div>

      {/* Act Header */}
      <AnimatePresence mode="wait">
        <motion.div
          key={actIndex}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.25 }}
          className="space-y-4"
        >
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-primary mb-1">
              {act.type === "spotlight" ? "Feature Spotlight" : "Good vs. Bad"}
            </p>
            <h3 className="text-lg font-semibold text-foreground">{act.title}</h3>
            <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{act.concept}</p>
          </div>

          {/* Panels */}
          {isContrast ? (
            <div className="grid sm:grid-cols-2 gap-3">
              <ChatPanel
                label={(act as ContrastAct).badLabel}
                content={left.content}
                done={left.done}
                error={left.error}
                variant="bad"
                playing={playing}
                userMessage={(act as ContrastAct).badMessages[(act as ContrastAct).badMessages.length - 1].content}
              />
              <ChatPanel
                label={(act as ContrastAct).goodLabel}
                content={right.content}
                done={right.done}
                error={right.error}
                variant="good"
                playing={playing}
                userMessage={(act as ContrastAct).goodMessages[(act as ContrastAct).goodMessages.length - 1].content}
              />
            </div>
          ) : (
            <ChatPanel
              label={(act as SpotlightAct).featureLabel}
              content={left.content}
              done={left.done}
              error={left.error}
              variant="spotlight"
              playing={playing}
              userMessage={(act as SpotlightAct).messages[(act as SpotlightAct).messages.length - 1].content}
            />
          )}

          {/* Coach Note */}
          <AnimatePresence>
            {showCoach && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex gap-3 p-4 rounded-2xl bg-primary/8 border border-primary/20"
              >
                <Sparkles className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <p className="text-sm text-foreground/80 leading-relaxed">{act.coachNote}</p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Controls */}
          <div className="flex items-center gap-3">
            {!playing ? (
              <button
                onClick={handlePlay}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 transition-opacity shadow-md shadow-primary/20"
              >
                <Play className="w-4 h-4" /> Play Demo
              </button>
            ) : (
              <button
                onClick={handleReset}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-muted-foreground hover:text-foreground border border-border text-sm transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Reset
              </button>
            )}

            {bothDone && !isLast && (
              <motion.button
                initial={{ opacity: 0, x: 8 }}
                animate={{ opacity: 1, x: 0 }}
                onClick={handleNext}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-surface-highest text-foreground font-semibold text-sm hover:bg-surface-high transition-colors ml-auto"
              >
                Next Act <ChevronRight className="w-4 h-4" />
              </motion.button>
            )}

            {bothDone && isLast && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="ml-auto flex items-center gap-2 text-sm text-primary font-semibold"
              >
                <CheckCircle2 className="w-4 h-4" />
                Tour complete!
              </motion.div>
            )}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

function ChatPanel({
  label,
  content,
  done,
  error,
  variant,
  playing,
  userMessage,
}: {
  label: string;
  content: string;
  done: boolean;
  error: boolean;
  variant: "bad" | "good" | "spotlight";
  playing: boolean;
  userMessage: string;
}) {
  const variantStyles = {
    bad: {
      border: "border-destructive/20",
      bg: "bg-destructive/5",
      label: "text-destructive",
      bubble: "bg-destructive/10",
    },
    good: {
      border: "border-emerald-500/25",
      bg: "bg-emerald-500/5",
      label: "text-emerald-600 dark:text-emerald-400",
      bubble: "bg-emerald-500/10",
    },
    spotlight: {
      border: "border-primary/20",
      bg: "bg-primary/5",
      label: "text-primary",
      bubble: "bg-primary/10",
    },
  }[variant];

  return (
    <div className={`rounded-2xl border ${variantStyles.border} ${variantStyles.bg} overflow-hidden`}>
      <div className={`px-4 py-2.5 border-b ${variantStyles.border}`}>
        <p className={`text-xs font-bold uppercase tracking-wider ${variantStyles.label}`}>{label}</p>
      </div>
      <div className="p-4 space-y-3 min-h-[160px]">
        {/* User bubble */}
        <div className="flex justify-end">
          <div className={`${variantStyles.bubble} rounded-2xl rounded-tr-sm px-3 py-2 max-w-[90%]`}>
            <p className="text-xs text-foreground/70 leading-relaxed">{userMessage}</p>
          </div>
        </div>

        {/* AI response */}
        {playing && !content && !error && (
          <div className="flex gap-1.5 items-center py-2">
            {[0, 1, 2].map(i => (
              <motion.div
                key={i}
                className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40"
                animate={{ scale: [1, 1.4, 1], opacity: [0.4, 1, 0.4] }}
                transition={{ duration: 0.8, delay: i * 0.15, repeat: Infinity }}
              />
            ))}
          </div>
        )}

        {content && (
          <div className="text-xs text-foreground/80 leading-relaxed prose prose-sm dark:prose-invert max-w-none">
            <ReactMarkdown>{content}</ReactMarkdown>
            {!done && <span className="inline-block w-0.5 h-3 bg-primary/60 ml-0.5 animate-pulse align-middle" />}
          </div>
        )}

        {error && (
          <p className="text-xs text-destructive">Couldn&apos;t load response. Make sure you&apos;re logged in.</p>
        )}
      </div>
    </div>
  );
}
