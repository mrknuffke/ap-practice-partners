"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  AlignLeft,
  HelpCircle,
  TrendingUp,
  MessageCircle,
  ExternalLink,
  Target,
  CheckCircle2,
  XCircle,
  Clock,
  Shield,
  GraduationCap,
  RotateCcw,
} from "lucide-react";
import { motion } from "framer-motion";
import { storageClear } from "@/lib/utils";

const GUARDRAILS = [
  {
    icon: AlignLeft,
    title: "1-Paragraph Response Limit",
    body: "Every AI explanation is capped at 3–5 sentences. The AI cannot deliver a lecture even if a student requests one. This forces students to process each chunk before receiving more.",
  },
  {
    icon: HelpCircle,
    title: "Mandatory Questions After Every Explanation",
    body: "The AI must ask one substantive question after every paragraph of explanation before it can continue. Questions are prohibited from simply repeating information just stated — they must require application, analysis, prediction, or connection to prior knowledge.",
  },
  {
    icon: TrendingUp,
    title: "Bloom's Taxonomy Progression",
    body: "The AI begins each new topic at the recall level and ratchets upward as the student demonstrates mastery — moving through application, analysis, and evaluation/synthesis. If a student struggles, it steps back one level. The student's own responses drive the pacing.",
  },
  {
    icon: MessageCircle,
    title: "Socratic Misconception Handling",
    body: "When a student answers incorrectly, the AI does not lecture or correct directly. It asks a targeted Socratic question that guides the student toward self-correction. After they correct themselves, it briefly contextualizes why the misconception is common.",
  },
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
    scaffolding: "\"Explain mode on osmosis.\" — AI gives one paragraph, then asks what the student predicts will happen if the concentration gradient reverses.",
  },
];

const DEPLOYMENT = [
  {
    step: "1",
    title: "Pre-class activation",
    body: "Students use the tool the night before or morning of class to prime prior knowledge on the upcoming topic. Assign a specific mode and topic for consistency.",
  },
  {
    step: "2",
    title: "Post-class consolidation",
    body: "After instruction, students use Review or Explanation Partner mode to test whether they can explain concepts they just learned. The AI's Socratic pressure surfaces gaps that re-reading notes would not.",
  },
  {
    step: "3",
    title: "Independent exam prep",
    body: "Practice mode generates AP-style MCQ and FRQ scoped exactly to the College Board CED. Students self-assess against real exam formats and receive targeted feedback.",
  },
  {
    step: "4",
    title: "Not recommended during direct instruction",
    body: "The tool is designed for independent student thinking. Projecting AI responses as a class resource risks substituting AI exposition for student sense-making — the opposite of its intended use.",
    warn: true,
  },
];

const USE_GUIDELINES = [
  {
    icon: Target,
    title: "Purpose of Use",
    body: "Position the tool as a practice partner for thinking, not a source of answers. AI is used to support learning, not replace it.",
    variant: "default" as const,
  },
  {
    icon: CheckCircle2,
    title: "Appropriate Use Cases",
    body: "Concept reinforcement and review · Practice through questioning and dialogue · Identifying gaps in understanding · Independent or homework-based learning. These align with AI use for inquiry and clarification rather than content generation.",
    variant: "positive" as const,
  },
  {
    icon: XCircle,
    title: "Not Appropriate For",
    body: "Generating complete AP-style responses for submission · Simulating exam conditions with AI support · Replacing productive struggle or independent reasoning. AI should not be used to produce assessed work or reduce cognitive demand.",
    variant: "negative" as const,
  },
  {
    icon: Clock,
    title: "Timing of Use",
    body: "Recommended: outside of class, review, or guided practice contexts. Not recommended: during direct instruction or any assessment conditions.",
    variant: "warn" as const,
  },
  {
    icon: Shield,
    title: "Student Expectations",
    body: "Students should be able to explain their thinking independently of the tool. Use of the tool should include reflection on how it supported their learning. Teachers should set clear expectations for transparency and appropriate use.",
    variant: "default" as const,
  },
  {
    icon: GraduationCap,
    title: "AP-Specific Consideration",
    body: "AI-supported practice should not mirror the cognitive conditions of the AP exam. Students should continue to engage in AI-free timed practice to ensure readiness.",
    variant: "warn" as const,
  },
];

const GUIDELINE_STYLES = {
  default: { card: "border-border bg-card/50", icon: "border-primary/20 bg-primary/10 text-primary" },
  positive: { card: "border-emerald-500/30 bg-emerald-500/5", icon: "border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" },
  negative: { card: "border-destructive/20 bg-destructive/5", icon: "border-destructive/20 bg-destructive/10 text-destructive" },
  warn: { card: "border-amber-500/30 bg-amber-500/5", icon: "border-amber-500/20 bg-amber-500/10 text-amber-600 dark:text-amber-400" },
};

export default function EducatorGuidePage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-background text-foreground font-sans relative">
      <div className="fixed top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-primary/5 blur-[160px] pointer-events-none" />

      <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-xl border-b border-border/60">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary transition-all"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <span className="text-sm font-medium text-muted-foreground">Educator Guide</span>
          </div>
          <button
            onClick={() => {
              storageClear("app:educator-training-complete");
              router.push("/educator-training");
            }}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground px-3 py-1.5 rounded-lg hover:bg-secondary transition-all"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Retake training
          </button>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-10 relative z-10 space-y-12">

        {/* Section 1: What this tool is */}
        <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-3">A Practice Partner, Not an Answer Machine</h1>
          <p className="text-muted-foreground leading-relaxed">
            AP Practice Partners is built around a single pedagogical commitment: <strong className="text-foreground">the student does the cognitive work.</strong> Every AI response is capped at one paragraph, and every explanation is immediately followed by a question that requires the student to apply, analyze, or predict — not just read.
          </p>
          <p className="text-muted-foreground leading-relaxed mt-3">
            The tool cannot be used passively. It will not deliver a lecture. It will not write a student&rsquo;s essay. It will not explain an entire topic in a single response. These are deliberate constraints enforced at the system level — not suggestions the AI may or may not follow.
          </p>
        </motion.section>

        {/* Section 2: Built-in guardrails */}
        <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1 }}>
          <h2 className="text-lg font-semibold text-foreground mb-1">Built-In Guardrails</h2>
          <p className="text-sm text-muted-foreground mb-4">These rules are part of the AI system prompt and apply to every session, across all 21 courses.</p>
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
        </motion.section>

        {/* Section 3: Scaffolding vs. offloading */}
        <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.2 }}>
          <h2 className="text-lg font-semibold text-foreground mb-1">Scaffolding vs. Offloading</h2>
          <p className="text-sm text-muted-foreground mb-4">Concrete examples of how the same intent produces very different outcomes depending on how the tool is used.</p>
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
        </motion.section>

        {/* Section 4: Deployment contexts */}
        <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.3 }}>
          <h2 className="text-lg font-semibold text-foreground mb-4">Recommended Deployment Contexts</h2>
          <div className="space-y-3">
            {DEPLOYMENT.map(({ step, title, body, warn }) => (
              <div
                key={step}
                className={`flex gap-3 items-start border rounded-2xl p-4 ${warn ? "border-amber-500/30 bg-amber-500/5" : "border-border bg-card/50"}`}
              >
                <span className={`flex-shrink-0 w-7 h-7 rounded-full text-sm font-semibold flex items-center justify-center mt-0.5 ${warn ? "bg-amber-500/20 text-amber-600 dark:text-amber-400" : "bg-primary/20 text-primary"}`}>{step}</span>
                <div>
                  <p className={`font-medium text-sm mb-0.5 ${warn ? "text-amber-700 dark:text-amber-300" : "text-foreground"}`}>{title}</p>
                  <p className="text-sm text-muted-foreground leading-relaxed">{body}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.section>

        {/* Section 4b: Recommended Use Guidelines */}
        <motion.section id="recommended-use" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.35 }}>
          <h2 className="text-lg font-semibold text-foreground mb-1">Recommended Use Guidelines</h2>
          <p className="text-sm text-muted-foreground mb-4">The six policy categories educators are expected to understand and communicate to students before deploying this tool.</p>
          <div className="space-y-3">
            {USE_GUIDELINES.map(({ icon: Icon, title, body, variant }) => {
              const styles = GUIDELINE_STYLES[variant];
              return (
                <div key={title} className={`border rounded-2xl p-4 flex gap-4 items-start ${styles.card}`}>
                  <div className={`flex-shrink-0 w-9 h-9 rounded-xl border flex items-center justify-center mt-0.5 ${styles.icon}`}>
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
        </motion.section>

        {/* Section 5: Policy alignment */}
        <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.4 }}>
          <h2 className="text-lg font-semibold text-foreground mb-3">How This Tool Fits an AI-as-Scaffold Position</h2>
          <p className="text-muted-foreground leading-relaxed">
            Educational research distinguishes between <strong className="text-foreground">cognitive scaffolding</strong> — where a tool supports a learner&rsquo;s own thinking process — and <strong className="text-foreground">cognitive offloading</strong> — where a tool performs the thinking so the learner doesn&rsquo;t have to. AP Practice Partners is built to be the former by design. The AI&rsquo;s response constraints, mandatory questioning, Bloom&rsquo;s progression, and Socratic misconception handling are system-level rules enforced on every interaction, in every session, across all 21 courses. They cannot be turned off by the student.
          </p>
          <p className="text-muted-foreground leading-relaxed mt-3">
            That said, no technical constraint eliminates the risk of misuse entirely. Students who are motivated to offload can attempt to do so. The tool addresses this directly: when a student requests a direct answer, complete explanation, or asks the AI to do work for them, the AI is instructed to acknowledge the request, explain why the tool works differently, and redirect with a question. This makes the pedagogical stance legible to the student — not just enforced on them.
          </p>
        </motion.section>

        {/* Section 6: Accuracy warning */}
        <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.5 }}>
          <div className="border border-amber-500/30 rounded-2xl p-5 bg-amber-500/5">
            <p className="font-semibold text-amber-700 dark:text-amber-300 text-sm mb-1">A Note on AI Accuracy</p>
            <p className="text-sm text-muted-foreground leading-relaxed">
              AI tutors can and do produce incorrect information confidently. The College Board CED scope data constrains topics but does not guarantee factual accuracy. Recommend that students treat AI responses as a <em>thinking prompt</em>, not a source of record, and verify key claims against their textbook and official College Board materials.
            </p>
          </div>
        </motion.section>

        {/* Footer links */}
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.6 }}
          className="border border-border rounded-2xl p-6 bg-card/50 flex flex-col sm:flex-row gap-4 items-center justify-between"
        >
          <div className="flex flex-col gap-1">
            <p className="text-sm text-muted-foreground">More resources</p>
            <button
              onClick={() => {
                storageClear("app:role");
                storageClear("app:educator-training-complete");
                storageClear("app:student-orientation-complete");
                router.push("/welcome");
              }}
              className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2 text-left transition-colors"
            >
              Change role
            </button>
          </div>
          <div className="flex gap-3 flex-wrap justify-center">
            <Link
              href="/tutorial"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-border text-sm text-muted-foreground hover:text-foreground hover:bg-secondary transition-all"
            >
              How to Use — Student Guide
            </Link>
            <a
              href="https://github.com/mrknuffke/ap-practice-partners"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-border text-sm text-muted-foreground hover:text-foreground hover:bg-secondary transition-all"
            >
              <ExternalLink className="w-4 h-4" />
              GitHub
            </a>
          </div>
        </motion.section>

      </main>
    </div>
  );
}
