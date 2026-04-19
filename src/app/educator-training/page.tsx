"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlignLeft, HelpCircle, TrendingUp, MessageCircle,
  BookOpen, Target, Sparkles, Brain, Zap, Users,
  CheckCircle2, XCircle, Clock, Shield, GraduationCap,
  ArrowRight, ArrowLeft, ChevronRight,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { storageSet } from "@/lib/utils";

// ─── Content ────────────────────────────────────────────────────────────────

const GUARDRAILS = [
  {
    icon: AlignLeft,
    title: "1-Paragraph Response Limit",
    body: "Every AI explanation is capped at 3–5 sentences. The AI cannot deliver a lecture even if a student requests one.",
  },
  {
    icon: HelpCircle,
    title: "Mandatory Questions After Every Explanation",
    body: "The AI must ask one substantive question after every paragraph of explanation before it can continue — requiring application, analysis, prediction, or connection to prior knowledge.",
  },
  {
    icon: TrendingUp,
    title: "Bloom's Taxonomy Progression",
    body: "The AI begins at the recall level and ratchets upward as the student demonstrates mastery. If a student struggles, it steps back one level. The student's own responses drive the pacing.",
  },
  {
    icon: MessageCircle,
    title: "Socratic Misconception Handling",
    body: "When a student answers incorrectly, the AI does not lecture or correct directly. It asks a targeted Socratic question that guides the student toward self-correction.",
  },
];

const MODES = [
  { icon: BookOpen, name: "Explain", color: "blue", body: "Introduces a concept in short chunks, then asks a question before moving on. Ideal for topics students haven't studied yet." },
  { icon: Target, name: "Practice", color: "violet", body: "Generates AP-style MCQ and FRQ scoped exactly to the CED. Students write their own responses; the AI scores and probes gaps." },
  { icon: Sparkles, name: "Review", color: "cyan", body: "Student names a topic; the AI quizzes systematically using Bloom's progression — recall first, then application and analysis." },
  { icon: Brain, name: "Visualize", color: "emerald", body: "Describes a concept or process as a vivid step-by-step mental model. Good for mechanisms and diagrams that are hard to picture from text." },
  { icon: Zap, name: "Quick Review", color: "amber", body: "Five rapid-fire questions on one topic in succession — best for checking recall before a test or warming up a session." },
  { icon: Users, name: "Explanation Partner", color: "rose", body: "Student explains a concept as if teaching it; the AI listens and asks Socratic follow-ups. The best way to surface what students think they know." },
];

const COMPARISONS = [
  {
    context: "Before a lesson",
    offloading: "\"Explain everything about photosynthesis to me.\" — Student receives information; does no thinking.",
    scaffolding: "\"Review me on photosynthesis — Unit 3.\" — Student answers questions, builds toward analysis.",
  },
  {
    context: "Exam prep",
    offloading: "\"Give me the answer to this FRQ: [pastes question]\" — AI does the cognitive work.",
    scaffolding: "\"Practice FRQ on Unit 5 Heredity.\" — Student writes the response; AI scores and probes gaps.",
  },
  {
    context: "Essay help",
    offloading: "\"Write me a thesis for my rhetorical analysis essay.\"",
    scaffolding: "\"I'm going to explain my thesis to you — give me Socratic feedback.\" (Explanation Partner mode)",
  },
  {
    context: "Stuck on a concept",
    offloading: "\"I don't understand osmosis. Explain it to me completely.\"",
    scaffolding: "\"Explain mode on osmosis.\" — AI gives one paragraph, then asks what the student predicts.",
  },
];

const USE_GUIDELINES = [
  {
    icon: Target,
    title: "Purpose of Use",
    body: "Position the tool as a practice partner for thinking, not a source of answers. AI is used to support learning, not replace it.",
    variant: "default",
  },
  {
    icon: CheckCircle2,
    title: "Appropriate Use Cases",
    body: "Concept reinforcement and review · Practice through questioning and dialogue · Identifying gaps in understanding · Independent or homework-based learning. These align with AI use for inquiry and clarification rather than content generation.",
    variant: "positive",
  },
  {
    icon: XCircle,
    title: "Not Appropriate For",
    body: "Generating complete AP-style responses for submission · Simulating exam conditions with AI support · Replacing productive struggle or independent reasoning. AI should not be used to produce assessed work or reduce cognitive demand.",
    variant: "negative",
  },
  {
    icon: Clock,
    title: "Timing of Use",
    body: "Recommended: outside of class, review, or guided practice contexts. Not recommended: during direct instruction or any assessment conditions.",
    variant: "warn",
  },
  {
    icon: Shield,
    title: "Student Expectations",
    body: "Students should be able to explain their thinking independently of the tool. Use of the tool should include reflection on how it supported their learning. Teachers should set clear expectations for transparency and appropriate use.",
    variant: "default",
  },
  {
    icon: GraduationCap,
    title: "AP-Specific Consideration",
    body: "AI-supported practice should not mirror the cognitive conditions of the AP exam. Students should continue to engage in AI-free timed practice to ensure readiness.",
    variant: "warn",
  },
];

type CheckQuestion = {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  stepRef: number;
};

const CHECKS: CheckQuestion[] = [
  {
    question: "A student types: \"Just give me the answer to this FRQ.\" What does the AP Practice Partners AI do?",
    options: [
      "Generates a complete model answer for the student to copy.",
      "Refuses and redirects with a Socratic question to guide the student's own thinking.",
      "Ignores the request and moves to the next topic.",
      "Asks the student to rephrase their request more politely.",
    ],
    correctIndex: 1,
    explanation: "The AI is instructed to acknowledge the request, explain why the tool works differently, and redirect with a question. It will not produce a complete answer — making the pedagogical stance legible to the student, not just enforced on them.",
    stepRef: 3,
  },
  {
    question: "When is AP Practice Partners NOT recommended for use?",
    options: [
      "The night before a major exam for gap-finding review.",
      "After class for Explanation Partner practice on that day's topic.",
      "During live direct instruction projected for the whole class.",
      "During independent homework-based study.",
    ],
    correctIndex: 2,
    explanation: "The tool is designed for independent student thinking. Projecting AI responses as a class resource risks substituting AI exposition for student sense-making — the opposite of its intended use.",
    stepRef: 4,
  },
  {
    question: "Does using AP Practice Partners replace the need for AI-free timed practice before the AP exam?",
    options: [
      "Yes — the Practice mode FRQs fully replicate exam conditions.",
      "No — students should continue AI-free timed practice to ensure they can perform independently.",
      "Only if students use Practice mode at least 10 times.",
      "It depends on the course.",
    ],
    correctIndex: 1,
    explanation: "AI-supported practice should not mirror the cognitive conditions of the AP exam. Students need AI-free timed practice to build the independent performance the exam requires.",
    stepRef: 4,
  },
  {
    question: "What best describes the Bloom's Taxonomy Progression guardrail?",
    options: [
      "The AI randomly selects question difficulty for variety.",
      "The AI starts every session with synthesis-level questions.",
      "The AI begins at recall and increases difficulty as the student demonstrates mastery — stepping back if they struggle.",
      "Students manually choose their Bloom's level at the start of each session.",
    ],
    correctIndex: 2,
    explanation: "The AI is calibrated to the student's actual responses — starting at recall and ratcheting up as mastery is demonstrated. This ensures no student is left behind and no student is under-challenged.",
    stepRef: 2,
  },
];

// ─── Steps ───────────────────────────────────────────────────────────────────

const TOTAL_STEPS = 7;

// ─── Component ───────────────────────────────────────────────────────────────

export default function EducatorTrainingPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [checkAnswers, setCheckAnswers] = useState<Record<number, number | null>>({});
  const [checkSubmitted, setCheckSubmitted] = useState<Record<number, boolean>>({});

  const next = () => setStep((s) => Math.min(s + 1, TOTAL_STEPS - 1));
  const back = () => setStep((s) => Math.max(s - 1, 0));

  const allChecksAnswered = CHECKS.every((_, i) => checkSubmitted[i]);

  const complete = () => {
    storageSet("app:educator-training-complete", "true");
    router.push("/");
  };

  const answerCheck = (qi: number, oi: number) => {
    if (checkSubmitted[qi]) return;
    setCheckAnswers((prev) => ({ ...prev, [qi]: oi }));
    setCheckSubmitted((prev) => ({ ...prev, [qi]: true }));
  };

  const stepContent = [
    // Step 0: Welcome & purpose
    <motion.div key="s0" initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} transition={{ duration: 0.3 }} className="space-y-6">
      <div>
        <p className="text-xs font-bold uppercase tracking-widest text-primary mb-2">Step 1 of {TOTAL_STEPS}</p>
        <h2 className="text-2xl font-bold text-foreground mb-3">A Practice Partner, Not an Answer Machine</h2>
        <p className="text-muted-foreground leading-relaxed">
          AP Practice Partners is built around a single pedagogical commitment: <strong className="text-foreground">the student does the cognitive work.</strong> Every AI response is capped at one paragraph, and every explanation is immediately followed by a question that requires the student to apply, analyze, or predict — not just read.
        </p>
        <p className="text-muted-foreground leading-relaxed mt-3">
          The tool cannot be used passively. It will not deliver a lecture. It will not write a student&rsquo;s essay. It will not explain an entire topic in a single response. These are deliberate constraints enforced at the system level — not suggestions the AI may or may not follow.
        </p>
        <p className="text-muted-foreground leading-relaxed mt-3">
          This training walks you through how the site works, what the built-in guardrails do, how to frame appropriate vs. inappropriate use for your students, and what educators are expected to understand before deploying the tool.
        </p>
      </div>
      <div className="border border-primary/20 rounded-2xl p-5 bg-primary/5">
        <p className="font-semibold text-foreground text-sm mb-1">What you&rsquo;ll cover</p>
        <ul className="space-y-1.5 mt-2">
          {[
            "How the site works and its 6 study modes",
            "4 built-in AI guardrails that enforce active learning",
            "Scaffolding vs. offloading — what good and bad use look like",
            "The Recommended Use Guidelines (6 policy categories)",
            "4 scenario-based knowledge checks",
          ].map((item) => (
            <li key={item} className="flex gap-2 items-start text-sm text-muted-foreground">
              <ChevronRight className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
              {item}
            </li>
          ))}
        </ul>
      </div>
    </motion.div>,

    // Step 1: How the site works
    <motion.div key="s1" initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} transition={{ duration: 0.3 }} className="space-y-6">
      <div>
        <p className="text-xs font-bold uppercase tracking-widest text-primary mb-2">Step 2 of {TOTAL_STEPS}</p>
        <h2 className="text-2xl font-bold text-foreground mb-3">How the Site Works</h2>
        <p className="text-muted-foreground leading-relaxed">
          The home page shows 21 AP course cards — one AI tutor per course, each scoped to its official College Board Course and Exam Description (CED). Students select a course and enter a chat interface where they can choose one of 6 study modes.
        </p>
        <p className="text-muted-foreground leading-relaxed mt-3">
          In Practice mode, the AI can generate full AP-style MCQ and FRQ questions in a breakout panel. Students write their own responses and receive scored feedback. There is also a session summary students can review at the end.
        </p>
      </div>
      <div>
        <p className="text-sm font-semibold text-foreground mb-3">The 6 Study Modes</p>
        <div className="space-y-2">
          {MODES.map((mode) => (
            <div key={mode.name} className="border border-border rounded-2xl p-4 bg-card/50 flex gap-4 items-start">
              <div className="flex-shrink-0 w-9 h-9 rounded-xl border border-primary/20 bg-primary/10 flex items-center justify-center mt-0.5">
                <mode.icon className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="font-medium text-foreground text-sm mb-0.5">{mode.name}</p>
                <p className="text-sm text-muted-foreground leading-relaxed">{mode.body}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </motion.div>,

    // Step 2: Built-in guardrails
    <motion.div key="s2" initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} transition={{ duration: 0.3 }} className="space-y-6">
      <div>
        <p className="text-xs font-bold uppercase tracking-widest text-primary mb-2">Step 3 of {TOTAL_STEPS}</p>
        <h2 className="text-2xl font-bold text-foreground mb-3">Built-In Guardrails</h2>
        <p className="text-muted-foreground leading-relaxed">
          These rules are part of the AI system prompt and apply to every session, across all 21 courses. They cannot be disabled by the student.
        </p>
      </div>
      <div className="space-y-3">
        {GUARDRAILS.map(({ icon: Icon, title, body }) => (
          <div key={title} className="border border-border rounded-2xl p-4 bg-card/50 flex gap-4 items-start">
            <div className="flex-shrink-0 w-9 h-9 rounded-xl border border-primary/20 bg-primary/10 flex items-center justify-center mt-0.5">
              <Icon className="w-4 h-4 text-primary" />
            </div>
            <div>
              <p className="font-medium text-foreground text-sm mb-1">{title}</p>
              <p className="text-sm text-muted-foreground leading-relaxed">{body}</p>
            </div>
          </div>
        ))}
      </div>
    </motion.div>,

    // Step 3: Scaffolding vs. offloading
    <motion.div key="s3" initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} transition={{ duration: 0.3 }} className="space-y-6">
      <div>
        <p className="text-xs font-bold uppercase tracking-widest text-primary mb-2">Step 4 of {TOTAL_STEPS}</p>
        <h2 className="text-2xl font-bold text-foreground mb-3">Scaffolding vs. Offloading</h2>
        <p className="text-muted-foreground leading-relaxed">
          The same student intent can produce very different outcomes depending on how the tool is used. Here are four concrete examples of the difference between productive scaffolding and cognitive offloading.
        </p>
      </div>
      <div className="space-y-4">
        {COMPARISONS.map(({ context, offloading, scaffolding }) => (
          <div key={context} className="border border-border rounded-2xl overflow-hidden bg-card/50">
            <div className="px-4 py-2.5 border-b border-border bg-secondary/30">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{context}</p>
            </div>
            <div className="grid sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-border">
              <div className="p-4">
                <span className="inline-block text-xs font-semibold px-2 py-0.5 rounded-full bg-destructive/10 text-destructive mb-2">Offloading</span>
                <p className="text-sm text-muted-foreground leading-relaxed">{offloading}</p>
              </div>
              <div className="p-4">
                <span className="inline-block text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 mb-2">Scaffolding</span>
                <p className="text-sm text-muted-foreground leading-relaxed">{scaffolding}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </motion.div>,

    // Step 4: Recommended Use Guidelines
    <motion.div key="s4" initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} transition={{ duration: 0.3 }} className="space-y-6">
      <div>
        <p className="text-xs font-bold uppercase tracking-widest text-primary mb-2">Step 5 of {TOTAL_STEPS}</p>
        <h2 className="text-2xl font-bold text-foreground mb-3">Recommended Use Guidelines</h2>
        <p className="text-muted-foreground leading-relaxed">
          These guidelines define how the tool is intended to be positioned for students. You are expected to understand and communicate these expectations before deploying the tool in your course.
        </p>
      </div>
      <div className="space-y-3">
        {USE_GUIDELINES.map(({ icon: Icon, title, body, variant }) => {
          const styles = {
            default: "border-border bg-card/50",
            positive: "border-emerald-500/30 bg-emerald-500/5",
            negative: "border-destructive/20 bg-destructive/5",
            warn: "border-amber-500/30 bg-amber-500/5",
          }[variant];
          const iconStyles = {
            default: "border-primary/20 bg-primary/10 text-primary",
            positive: "border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
            negative: "border-destructive/20 bg-destructive/10 text-destructive",
            warn: "border-amber-500/20 bg-amber-500/10 text-amber-600 dark:text-amber-400",
          }[variant];
          return (
            <div key={title} className={`border rounded-2xl p-4 flex gap-4 items-start ${styles}`}>
              <div className={`flex-shrink-0 w-9 h-9 rounded-xl border flex items-center justify-center mt-0.5 ${iconStyles}`}>
                <Icon className="w-4 h-4" />
              </div>
              <div>
                <p className="font-medium text-foreground text-sm mb-1">{title}</p>
                <p className="text-sm text-muted-foreground leading-relaxed">{body}</p>
              </div>
            </div>
          );
        })}
      </div>
    </motion.div>,

    // Step 5: Knowledge checks
    <motion.div key="s5" initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} transition={{ duration: 0.3 }} className="space-y-6">
      <div>
        <p className="text-xs font-bold uppercase tracking-widest text-primary mb-2">Step 6 of {TOTAL_STEPS}</p>
        <h2 className="text-2xl font-bold text-foreground mb-3">Knowledge Checks</h2>
        <p className="text-muted-foreground leading-relaxed">
          Answer the four questions below. You can review any prior step using the back button before submitting.
        </p>
      </div>
      <div className="space-y-8">
        {CHECKS.map((check, qi) => {
          const selected = checkAnswers[qi] ?? null;
          const submitted = checkSubmitted[qi] ?? false;
          const isCorrect = submitted && selected === check.correctIndex;
          return (
            <div key={qi} className="border border-border rounded-2xl p-5 bg-card/50">
              <p className="font-medium text-foreground text-sm mb-4">{qi + 1}. {check.question}</p>
              <div className="space-y-2">
                {check.options.map((opt, oi) => {
                  let cls = "border border-border rounded-xl px-4 py-3 text-sm text-left w-full transition-colors ";
                  if (!submitted) {
                    cls += selected === oi ? "bg-primary/10 border-primary/40 text-foreground" : "bg-card/30 hover:bg-secondary text-muted-foreground hover:text-foreground";
                  } else {
                    if (oi === check.correctIndex) cls += "bg-emerald-500/10 border-emerald-500/40 text-emerald-700 dark:text-emerald-400 font-medium";
                    else if (oi === selected && selected !== check.correctIndex) cls += "bg-destructive/10 border-destructive/30 text-destructive";
                    else cls += "bg-card/20 text-muted-foreground opacity-50";
                  }
                  return (
                    <button key={oi} className={cls} onClick={() => submitted ? undefined : setCheckAnswers(prev => ({ ...prev, [qi]: oi }))} disabled={submitted}>
                      {opt}
                    </button>
                  );
                })}
              </div>
              {!submitted && selected !== null && (
                <button
                  onClick={() => answerCheck(qi, selected)}
                  className="mt-3 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
                >
                  Submit answer
                </button>
              )}
              {submitted && (
                <div className={`mt-4 rounded-xl px-4 py-3 text-sm leading-relaxed ${isCorrect ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400" : "bg-amber-500/10 text-amber-700 dark:text-amber-300"}`}>
                  <span className="font-semibold">{isCorrect ? "Correct. " : "Not quite. "}</span>
                  {check.explanation}
                </div>
              )}
            </div>
          );
        })}
      </div>
      {!allChecksAnswered && (
        <p className="text-sm text-muted-foreground text-center">Answer all four questions to continue.</p>
      )}
    </motion.div>,

    // Step 6: Completion
    <motion.div key="s6" initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} transition={{ duration: 0.3 }} className="space-y-6 text-center">
      <div>
        <p className="text-xs font-bold uppercase tracking-widest text-primary mb-2">Step 7 of {TOTAL_STEPS}</p>
        <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 className="w-8 h-8 text-emerald-500" />
        </div>
        <h2 className="text-2xl font-bold text-foreground mb-3">Training Complete</h2>
        <p className="text-muted-foreground leading-relaxed max-w-md mx-auto">
          You&rsquo;ve reviewed how the tool works, its built-in guardrails, and the recommended use guidelines. You&rsquo;re ready to deploy AP Practice Partners with your students.
        </p>
      </div>
      <div className="border border-border rounded-2xl p-5 bg-card/50 text-left space-y-2 max-w-md mx-auto">
        <p className="text-sm font-semibold text-foreground mb-2">Quick reminders</p>
        {[
          "Set clear expectations with students about appropriate use before they log in.",
          "The tool is for independent practice — not during direct instruction or assessment.",
          "Students should still do AI-free timed practice before the AP exam.",
          "You can retake this training anytime from the Educator Guide.",
        ].map((r) => (
          <div key={r} className="flex gap-2 items-start text-sm text-muted-foreground">
            <ChevronRight className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
            {r}
          </div>
        ))}
      </div>
      <button
        onClick={complete}
        className="inline-flex items-center gap-2 px-8 py-3 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-medium transition-all shadow-lg"
      >
        Go to AP Practice Partners
        <ArrowRight className="w-4 h-4" />
      </button>
      <p className="text-xs text-muted-foreground">You can retake this training anytime from the Educator Guide.</p>
    </motion.div>,
  ];

  const canGoNext = step < TOTAL_STEPS - 1 && (step !== 5 || allChecksAnswered);

  return (
    <div className="min-h-screen bg-background text-foreground font-sans relative">
      <div className="fixed top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-primary/5 blur-[160px] pointer-events-none" />

      {/* Progress bar */}
      <div className="fixed top-0 left-0 right-0 h-1 bg-border z-30">
        <motion.div
          className="h-full bg-primary"
          animate={{ width: `${((step + 1) / TOTAL_STEPS) * 100}%` }}
          transition={{ duration: 0.4 }}
        />
      </div>

      <main className="max-w-2xl mx-auto px-4 pt-10 pb-24 relative z-10">
        <div className="mb-8">
          <p className="font-heading italic text-primary text-sm font-semibold">Educator Training</p>
          <p className="text-xs text-muted-foreground mt-0.5">AP Practice Partners · Singapore American School</p>
        </div>

        <AnimatePresence mode="wait">
          {stepContent[step]}
        </AnimatePresence>

        {/* Navigation */}
        <div className="fixed bottom-0 left-0 right-0 bg-background/90 backdrop-blur-xl border-t border-border z-20">
          <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between gap-4">
            <button
              onClick={back}
              disabled={step === 0}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border text-sm text-muted-foreground hover:text-foreground hover:bg-secondary transition-all disabled:opacity-30 disabled:pointer-events-none"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>

            {/* Step dots */}
            <div className="flex gap-1.5">
              {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
                <div
                  key={i}
                  className={`rounded-full transition-all ${i === step ? "w-5 h-2 bg-primary" : i < step ? "w-2 h-2 bg-primary/40" : "w-2 h-2 bg-border"}`}
                />
              ))}
            </div>

            {step < TOTAL_STEPS - 1 ? (
              <button
                onClick={next}
                disabled={!canGoNext}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-medium transition-all disabled:opacity-40 disabled:pointer-events-none shadow-sm"
              >
                {step === 5 && !allChecksAnswered ? "Answer all checks" : "Continue"}
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <div className="w-24" />
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
