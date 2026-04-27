"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, ArrowLeft, BookOpen } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { storageSet } from "@/lib/utils";
import Link from "next/link";

const TOTAL_STEPS = 3;

const WORKS = [
  "Ask about a topic, then actually answer the questions it throws back at you.",
  "Give rough or uncertain answers — the tutor will Socratically work toward accuracy with you.",
  "Use it before a test to find the gaps you didn't know you had.",
  "Use Explanation Partner mode to discover what you think you know but actually don't.",
  "Ask it to generate practice MCQ or FRQ, then do the work yourself.",
];

const DOESNT = [
  "Ask it to explain everything about a topic at once — it won't, and passively reading wouldn't help anyway.",
  "Copy its responses without processing them. Recognition isn't recall.",
  "Use it to write or outline your essays. You won't be able to do that on the exam.",
  "Skip answering the questions it asks. That's the whole mechanism — bypassing it breaks the learning.",
  "Use it as a fact-checker. It can be wrong. Verify important claims against your textbook.",
];

export default function StudentOrientationPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);

  const next = () => setStep((s) => Math.min(s + 1, TOTAL_STEPS - 1));
  const back = () => setStep((s) => Math.max(s - 1, 0));

  const complete = () => {
    storageSet("app:student-orientation-complete", "true");
    router.push("/");
  };

  const stepContent = [
    // Step 0: This isn't a search engine
    <motion.div key="s0" initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} transition={{ duration: 0.3 }} className="space-y-6">
      <div>
        <p className="text-xs font-bold uppercase tracking-widest text-primary mb-2">1 of {TOTAL_STEPS}</p>
        <h2 className="text-2xl font-bold text-foreground mb-3">This isn&rsquo;t a search engine</h2>
        <p className="text-muted-foreground leading-relaxed">
          Every single AI response ends with a question for you to answer. That question isn&rsquo;t optional — it&rsquo;s the whole mechanism. The tutor will not move on until you respond.
        </p>
        <p className="text-muted-foreground leading-relaxed mt-3">
          Rough answers are completely fine. The tutor will Socratically guide you toward accuracy. But you have to try. Passive reading doesn&rsquo;t build exam-ready knowledge — the back-and-forth does.
        </p>
      </div>
      <div className="space-y-3">
        <div className="border border-border rounded-2xl p-5 bg-card/50">
          <p className="font-medium text-foreground text-sm mb-1">It also starts easy and gets harder</p>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Questions begin at the recall level (&ldquo;What is X?&rdquo;) and escalate to application and analysis as you demonstrate mastery. If you struggle, it steps back — no judgment.
          </p>
        </div>
        <div className="border border-border rounded-2xl p-5 bg-card/50">
          <p className="font-medium text-foreground text-sm mb-1">It won&rsquo;t write your essay or give you an answer</p>
          <p className="text-sm text-muted-foreground leading-relaxed">
            If you ask the AI to do your thinking for you, it will acknowledge the request, explain why the tool works differently, and redirect you with a question. This is intentional.
          </p>
        </div>
      </div>
    </motion.div>,

    // Step 1: Use it well
    <motion.div key="s1" initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} transition={{ duration: 0.3 }} className="space-y-6">
      <div>
        <p className="text-xs font-bold uppercase tracking-widest text-primary mb-2">2 of {TOTAL_STEPS}</p>
        <h2 className="text-2xl font-bold text-foreground mb-3">Use it well</h2>
        <p className="text-muted-foreground leading-relaxed">
          This tool is only useful if you&rsquo;re actually thinking. Here&rsquo;s the difference between sessions that build real understanding and sessions that don&rsquo;t.
        </p>
      </div>
      <div className="grid sm:grid-cols-2 gap-3">
        <div className="border border-emerald-500/25 rounded-2xl p-4 bg-emerald-500/5">
          <p className="text-xs font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 mb-3">Works well when you...</p>
          <ul className="space-y-2">
            {WORKS.map((t) => (
              <li key={t} className="flex gap-2 items-start text-sm text-muted-foreground leading-relaxed">
                <span className="text-emerald-500 flex-shrink-0 mt-0.5">✓</span>
                {t}
              </li>
            ))}
          </ul>
        </div>
        <div className="border border-destructive/20 rounded-2xl p-4 bg-destructive/5">
          <p className="text-xs font-semibold uppercase tracking-wider text-destructive mb-3">Doesn&rsquo;t work when you...</p>
          <ul className="space-y-2">
            {DOESNT.map((t) => (
              <li key={t} className="flex gap-2 items-start text-sm text-muted-foreground leading-relaxed">
                <span className="text-destructive flex-shrink-0 mt-0.5">✗</span>
                {t}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </motion.div>,

    // Step 2: Pick a course
    <motion.div key="s2" initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} transition={{ duration: 0.3 }} className="space-y-6 text-center">
      <div>
        <p className="text-xs font-bold uppercase tracking-widest text-primary mb-2">3 of {TOTAL_STEPS}</p>
        <div className="w-16 h-16 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-4">
          <BookOpen className="w-8 h-8 text-primary" />
        </div>
        <h2 className="text-2xl font-bold text-foreground mb-3">You&rsquo;re ready. Pick a course.</h2>
        <p className="text-muted-foreground leading-relaxed max-w-sm mx-auto">
          21 AP courses are waiting. Choose one, pick a study mode, and answer every question it throws at you.
        </p>
      </div>
      <button
        onClick={complete}
        className="inline-flex items-center gap-2 px-8 py-3 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-medium transition-all shadow-lg"
      >
        Take me to my courses
        <ArrowRight className="w-4 h-4" />
      </button>
      <p className="text-xs text-muted-foreground">
        Want the full breakdown of modes and tips?{" "}
        <Link href="/tutorial" className="text-primary hover:underline">Full tutorial →</Link>
      </p>
    </motion.div>,
  ];

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

      <main className="max-w-2xl mx-auto px-4 pt-10 pb-32 relative z-10">
        <div className="mb-8">
          <p className="font-heading italic text-primary text-sm font-semibold">Quick Orientation</p>
          <p className="text-xs text-muted-foreground mt-0.5">AP Practice Partners · ~90 seconds</p>
        </div>

        <AnimatePresence mode="wait">
          {stepContent[step]}
        </AnimatePresence>

        {/* Navigation */}
        <div className="fixed bottom-0 left-0 right-0 bg-background/90 backdrop-blur-xl border-t border-border z-20">
          <div className="max-w-2xl mx-auto px-4 py-4 pb-[calc(env(safe-area-inset-bottom)+1rem)] flex items-center justify-between gap-4">
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
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-medium transition-all shadow-sm"
              >
                Continue
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
