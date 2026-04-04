"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft, BookOpen, Shield, Brain, GraduationCap, Zap, Code2, AlertTriangle } from "lucide-react";
import { motion } from "framer-motion";

const features = [
  {
    icon: BookOpen,
    title: "CED-Aligned by Design",
    body: "Every tutor is built directly from the official College Board Course and Exam Description (CED). Topics, weightings, exam formats, and assessment styles all come straight from the source — not generic AI guesses.",
  },
  {
    icon: Brain,
    title: "Active Learning, Not Passive Reading",
    body: "The tutors enforce a strict active-learning protocol: short explanations (max 1 paragraph), then a question. You're never just reading — you're always thinking, applying, and connecting ideas.",
  },
  {
    icon: GraduationCap,
    title: "AP Exam Assessment Style",
    body: "Practice questions mirror real AP exam style: stimulus-based MCQ with realistic distractors, FRQ with point values and AP task verbs (Explain, Justify, Calculate, Predict & Justify). No trivial recall questions.",
  },
  {
    icon: Zap,
    title: "6 Interaction Modes",
    body: "Choose how you learn: Explain (step-by-step with questions), Practice (AP-style MCQ/FRQ), Review (you pick the topic), Visualize (mental models), Quick Review (5 rapid-fire questions), or Explanation Partner (you teach, the bot follows up).",
  },
  {
    icon: Shield,
    title: "Private & No-Account Required",
    body: "No sign-up, no email, no personal data stored. Access is gated by your class code — that's it. Everything stays in your browser session.",
  },
];

function FeatureCard({ icon: Icon, title, body, index }: {
  icon: typeof BookOpen;
  title: string;
  body: string;
  index: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: 0.1 + index * 0.07, ease: "easeOut" }}
      className="flex gap-4 p-5 rounded-2xl border border-neutral-800 bg-neutral-900/50"
    >
      <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-blue-500/15 border border-blue-500/20 flex items-center justify-center">
        <Icon className="w-5 h-5 text-blue-400" />
      </div>
      <div>
        <h3 className="font-semibold text-white mb-1">{title}</h3>
        <p className="text-sm text-neutral-400 leading-relaxed">{body}</p>
      </div>
    </motion.div>
  );
}

export default function AboutPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 font-sans relative">
      <div className="fixed top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-blue-600/10 blur-[160px] pointer-events-none" />

      <header className="sticky top-0 z-30 bg-neutral-950/80 backdrop-blur-xl border-b border-neutral-800/60">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="p-2 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-800 transition-all"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <span className="text-sm font-medium text-neutral-300">About</span>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-10 relative z-10 space-y-8">

        {/* Vibe-coded banner — front and center */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="border border-amber-500/30 bg-amber-500/10 rounded-2xl p-5 flex gap-4"
        >
          <Code2 className="w-6 h-6 text-amber-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-amber-300 mb-1">Vibe-Coded Software</p>
            <p className="text-sm text-amber-200/70 leading-relaxed">
              This app was built primarily through conversation with AI coding assistants (Claude Code + Gemini),
              with a human teacher directing the work rather than writing most of the code by hand.
              It works well — but it has not been through rigorous QA, professional security auditing,
              or the testing a commercial product normally receives. Use it accordingly, and always verify
              important concepts against the official College Board CED.
            </p>
            <a
              href="https://github.com/mrknuffke/ap-practice-partners"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block mt-2 text-xs text-amber-400 hover:text-amber-300 underline underline-offset-2"
            >
              Open source on GitHub →
            </a>
          </div>
        </motion.div>

        {/* AI accuracy warning */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.05 }}
          className="border border-red-500/20 bg-red-500/8 rounded-2xl p-5 flex gap-4"
        >
          <AlertTriangle className="w-6 h-6 text-red-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-red-300 mb-1">AI Can Be Wrong</p>
            <p className="text-sm text-red-200/70 leading-relaxed">
              AI tutors can confabulate — produce confident, plausible-sounding, but incorrect answers.
              The CED data constrains scope, but does not guarantee accuracy.
              This tool is a study aid, not an authority. Always verify against official College Board materials.
              This app is not affiliated with or endorsed by College Board.
            </p>
          </div>
        </motion.div>

        {/* Title + tagline */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <h1 className="text-3xl md:text-4xl font-bold text-white mt-3 mb-4 leading-tight">
            AP Practice Partners
          </h1>
          <p className="text-lg text-neutral-400 leading-relaxed max-w-2xl">
            An AI-powered study tool for students preparing for AP exams. Each tutor is tightly
            scoped to the official College Board CED for its course — so you study exactly what&rsquo;s on the exam.
          </p>
        </motion.div>

        {/* Features */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.15 }}
          className="flex flex-col gap-3"
        >
          {features.map((f, i) => (
            <FeatureCard key={f.title} {...f} index={i} />
          ))}
        </motion.div>

        {/* Courses */}
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.5 }}
          className="border border-neutral-800 rounded-2xl p-6 bg-neutral-900/40"
        >
          <h2 className="font-semibold text-white text-lg mb-3">Courses Available</h2>
          <p className="text-sm text-neutral-400 leading-relaxed mb-3">
            AP Practice Partners covers AP courses with CED-structured tutors:
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-1 text-sm text-neutral-300">
            {[
              "AP Biology", "AP Chemistry", "AP Environmental Science",
              "AP Physics 1", "AP Physics 2", "AP Physics C",
              "AP Calculus AB/BC", "AP Statistics", "AP Computer Science A",
              "AP US History", "AP US Gov & Politics", "AP Comparative Gov",
              "AP English Language", "AP English Literature", "AP Macroeconomics",
              "AP Microeconomics", "AP Spanish", "AP French",
              "AP Chinese", "AP African American Studies",
            ].map(c => (
              <span key={c} className="flex items-center gap-1.5 py-0.5">
                <span className="w-1 h-1 rounded-full bg-blue-400 flex-shrink-0" />
                {c}
              </span>
            ))}
          </div>
        </motion.section>

        {/* How it works */}
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.6 }}
          className="border border-neutral-800 rounded-2xl p-6 bg-neutral-900/40"
        >
          <h2 className="font-semibold text-white text-lg mb-3">How It Works</h2>
          <ol className="space-y-2 text-sm text-neutral-400">
            {[
              "Enter your class code to access the app.",
              "Pick your AP course from the grid on the home page.",
              "The tutor greets you and offers 6 ways to study. Choose one and get started.",
              "Every response ends with a question — answer it to keep progressing through Bloom\u2019s levels.",
            ].map((step, i) => (
              <li key={i} className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-500/20 text-blue-300 text-xs flex items-center justify-center font-semibold">{i + 1}</span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
        </motion.section>

        {/* Open source + feedback */}
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.7 }}
          className="border border-neutral-800 rounded-2xl p-6 bg-neutral-900/40"
        >
          <h2 className="font-semibold text-white text-lg mb-2">Open Source & Free</h2>
          <p className="text-sm text-neutral-400 leading-relaxed mb-3">
            This project is open source under the MIT license. The source code, CED extraction scripts,
            and all pedagogy prompts are publicly available. If you&rsquo;re a teacher who wants to run this
            for your own school, or a developer who wants to improve it, you&rsquo;re welcome to.
          </p>
          <p className="text-sm text-neutral-400 leading-relaxed">
            Bug reports, feature requests, and feedback go to{" "}
            <a
              href="https://github.com/mrknuffke/ap-practice-partners/issues"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:text-blue-300 underline underline-offset-2"
            >
              GitHub Issues
            </a>
            . This app is not affiliated with or endorsed by College Board.
            &ldquo;AP&rdquo; and &ldquo;Advanced Placement&rdquo; are trademarks of College Board.
          </p>
        </motion.section>

      </main>
    </div>
  );
}
