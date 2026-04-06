"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ChevronDown, ChevronUp, BookOpen, Sparkles, Target, Brain, Zap, Users } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const MODES = [
  {
    icon: BookOpen,
    name: "Explain",
    tagline: "Learn a topic step by step",
    color: "blue",
    description: "The tutor introduces a concept in short chunks (max 1 paragraph), then asks you a question before moving on. Great for topics you haven't studied yet or want a fresh take on.",
    example: "Try: \"Explain natural selection\" or \"Explain how the Fed uses monetary policy.\"",
  },
  {
    icon: Target,
    name: "Practice",
    tagline: "AP-style MCQ and FRQ",
    color: "violet",
    description: "The tutor generates exam-style questions: stimulus-based MCQ with realistic distractors, or FRQ with point values and AP task verbs. All questions are scoped to your course's CED.",
    example: "Try: \"Give me an MCQ on Unit 3\" or \"Generate an FRQ on the causes of World War I.\"",
  },
  {
    icon: Sparkles,
    name: "Review",
    tagline: "You pick the topic, the bot quizzes you",
    color: "cyan",
    description: "You name a topic and the tutor quizzes you on it systematically — starting with recall, then pushing toward application and analysis as you demonstrate mastery (Bloom's progression).",
    example: "Try: \"Review me on meiosis\" or \"Quiz me on supply and demand.\"",
  },
  {
    icon: Brain,
    name: "Visualize",
    tagline: "Mental models and process walkthroughs",
    color: "emerald",
    description: "The tutor describes a concept or process as a vivid mental model — step by step, as if you're watching it happen. Good for processes, diagrams, and mechanisms that are hard to picture from text alone.",
    example: "Try: \"Visualize DNA replication\" or \"Walk me through a Newton's third law collision.\"",
  },
  {
    icon: Zap,
    name: "Quick Review",
    tagline: "5 rapid-fire questions on one topic",
    color: "amber",
    description: "A fast, focused drill. The tutor fires 5 questions on a single topic in succession. Best for checking your recall before a test or warming up at the start of a study session.",
    example: "Try: \"Quick review on cell organelles\" or \"Quick review on major AP Calc derivatives.\"",
  },
  {
    icon: Users,
    name: "Explanation Partner",
    tagline: "You explain it — the bot listens and probes",
    color: "rose",
    description: "You explain a concept as if you're teaching it. The tutor listens, asks Socratic follow-up questions, and points out gaps — without lecturing you. The best way to find out what you actually don't know.",
    example: "Try: \"I'll explain osmosis to you\" or \"Let me explain how the Electoral College works.\"",
  },
];

const TIPS = [
  {
    title: "You must respond to every question",
    body: "The tutor will never skip ahead without your answer. This is intentional — passive reading doesn't build exam-ready knowledge. Even a rough answer is fine; the tutor will Socratically guide you toward accuracy.",
  },
  {
    title: "Questions get harder as you improve",
    body: "The tutor tracks your Bloom's Taxonomy level per topic. Early questions are recall (\"What is X?\"). Once you answer those, it moves to application, then analysis, then evaluation/synthesis. If you struggle, it steps back — no judgment.",
  },
  {
    title: "Stick to the course scope",
    body: "Each tutor is scoped to a specific course's CED. If you ask about something outside that scope, it will politely redirect you. This is a feature — it ensures your practice matches actual exam content.",
  },
  {
    title: "Switch modes mid-session",
    body: "You can change modes at any time by telling the tutor. \"Switch to Practice mode\" or \"Actually, let's do a quick review\" both work. The tutor will adapt.",
  },
  {
    title: "Be specific for better questions",
    body: "\"Practice\" is good; \"Practice on Unit 5 — Heredity, specifically Mendelian genetics\" is better. More context = more targeted questions = more efficient studying.",
  },
];

function ModeCard({ mode }: { mode: typeof MODES[0] }) {
  const [open, setOpen] = useState(false);
  const colorMap: Record<string, string> = {
    blue: "bg-primary/15 border-blue-500/25 text-blue-700 dark:text-primary",
    violet: "bg-violet-500/15 border-violet-500/25 text-violet-700 dark:text-violet-300",
    cyan: "bg-cyan-500/15 border-cyan-500/25 text-cyan-700 dark:text-cyan-300",
    emerald: "bg-emerald-500/15 border-emerald-500/25 text-emerald-700 dark:text-emerald-300",
    amber: "bg-amber-500/15 border-amber-500/25 text-amber-700 dark:text-amber-300",
    rose: "bg-rose-500/15 border-rose-500/25 text-rose-700 dark:text-rose-300",
  };
  const iconColor: Record<string, string> = {
    blue: "text-blue-600 dark:text-blue-400", violet: "text-violet-600 dark:text-violet-400", cyan: "text-cyan-600 dark:text-cyan-400",
    emerald: "text-emerald-600 dark:text-emerald-400", amber: "text-amber-600 dark:text-amber-400", rose: "text-rose-600 dark:text-rose-400",
  };

  return (
    <div className="border border-border rounded-2xl overflow-hidden bg-card/50">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center gap-4 p-4 text-left hover:bg-secondary/40 transition-colors"
      >
        <div className={`flex-shrink-0 w-10 h-10 rounded-xl border flex items-center justify-center ${colorMap[mode.color]}`}>
          <mode.icon className={`w-5 h-5 ${iconColor[mode.color]}`} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-foreground">{mode.name}</p>
          <p className="text-xs text-muted-foreground">{mode.tagline}</p>
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-muted-foreground flex-shrink-0" /> : <ChevronDown className="w-4 h-4 text-muted-foreground flex-shrink-0" />}
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 pt-1 border-t border-border">
              <p className="text-sm text-muted-foreground leading-relaxed mb-3">{mode.description}</p>
              <div className="bg-background/60 rounded-xl px-4 py-3 border border-border">
                <p className="text-xs font-medium text-muted-foreground mb-1">Example prompt</p>
                <p className="text-sm text-muted-foreground italic">{mode.example}</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function TutorialPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-background text-foreground font-sans relative">
      <div className="fixed top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-primary/5 blur-[160px] pointer-events-none" />

      <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-xl border-b border-border/60">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary transition-all"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <span className="text-sm font-medium text-muted-foreground">How to Use</span>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-10 relative z-10 space-y-12">
        {/* Intro */}
        <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-3">How to Use AP Practice Partners</h1>
          <p className="text-muted-foreground leading-relaxed">
            This is not a flashcard app or a search engine. It&rsquo;s a <strong className="text-foreground">conversation</strong> —
            and it&rsquo;s designed to make you think, not just read. Here&rsquo;s how to get the most out of it.
          </p>
        </motion.section>

        {/* Quick start */}
        <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1 }}>
          <h2 className="text-lg font-semibold text-foreground mb-4">Quick Start</h2>
          <div className="space-y-3">
            {[
              { step: "1", text: "Pick your AP course from the home page grid." },
              { step: "2", text: "For AP Physics C, select Mechanics or E&M first." },
              { step: "3", text: "The tutor greets you and offers 6 study modes. Choose one — or just start talking." },
              { step: "4", text: "Answer every question the tutor asks. The tutor won't move on until you do — that's the whole point." },
              { step: "5", text: "Difficulty increases automatically as you answer well. If you get stuck, say so and it'll back up." },
            ].map(({ step, text }) => (
              <div key={step} className="flex gap-3 items-start">
                <span className="flex-shrink-0 w-7 h-7 rounded-full bg-primary/20 text-primary text-sm font-semibold flex items-center justify-center mt-0.5">{step}</span>
                <p className="text-sm text-muted-foreground leading-relaxed">{text}</p>
              </div>
            ))}
          </div>
        </motion.section>

        {/* Modes */}
        <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.2 }}>
          <h2 className="text-lg font-semibold text-foreground mb-1">The 6 Study Modes</h2>
          <p className="text-sm text-muted-foreground mb-4">Tap each mode to see how it works and example prompts.</p>
          <div className="space-y-2">
            {MODES.map(mode => <ModeCard key={mode.name} mode={mode} />)}
          </div>
        </motion.section>

        {/* Tips */}
        <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.3 }}>
          <h2 className="text-lg font-semibold text-foreground mb-4">Tips for Better Sessions</h2>
          <div className="space-y-3">
            {TIPS.map(tip => (
              <div key={tip.title} className="border border-border rounded-2xl p-4 bg-card/50">
                <p className="font-medium text-foreground text-sm mb-1">{tip.title}</p>
                <p className="text-sm text-muted-foreground leading-relaxed">{tip.body}</p>
              </div>
            ))}
          </div>
        </motion.section>

        {/* CTA */}
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.4 }}
          className="border border-primary/20 rounded-2xl p-6 bg-primary/5 text-center"
        >
          <p className="text-muted-foreground mb-4">Ready to study?</p>
          <button
            onClick={() => router.push("/")}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-foreground font-medium transition-all shadow-lg"
          >
            <BookOpen className="w-4 h-4" />
            Choose a Course
          </button>
        </motion.section>
      </main>
    </div>
  );
}
