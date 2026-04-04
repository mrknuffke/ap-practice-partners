"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Send, CheckCircle2, Copy, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const FEEDBACK_CATEGORIES = [
  { value: "bug", label: "🐛 Something broke" },
  { value: "wrong", label: "📚 Incorrect or off-CED content" },
  { value: "feature", label: "💡 Feature suggestion" },
  { value: "praise", label: "👏 This is great!" },
  { value: "other", label: "💬 Other" },
];

export default function FeedbackPage() {
  const router = useRouter();
  const [category, setCategory] = useState("");
  const [course, setCourse] = useState("");
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [copied, setCopied] = useState(false);

  const isValid = category && message.trim().length > 10;

  const buildEmailBody = () => {
    const cat = FEEDBACK_CATEGORIES.find(c => c.value === category)?.label ?? category;
    return [
      `Category: ${cat}`,
      course ? `Course: ${course}` : null,
      ``,
      `Feedback:`,
      message.trim(),
    ].filter(l => l !== null).join('\n');
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const subject = encodeURIComponent(`[SAS AP Practice Partners] Feedback: ${category}`);
    const body = encodeURIComponent(buildEmailBody());
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
    setSubmitted(true);
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(buildEmailBody());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 font-sans relative">
      <div className="fixed top-[-20%] right-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-600/10 blur-[160px] pointer-events-none" />

      <header className="sticky top-0 z-30 bg-neutral-950/80 backdrop-blur-xl border-b border-neutral-800/60">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="p-2 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-800 transition-all"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <span className="text-sm font-medium text-neutral-300">Feedback</span>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-10 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-8"
        >
          <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">Share Feedback</h1>
          <p className="text-neutral-400 leading-relaxed">
            Found a bug, spotted off-CED content, or have an idea? Let us know — this tool gets better with your input.
          </p>
        </motion.div>

        <AnimatePresence mode="wait">
          {submitted ? (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="border border-emerald-500/30 bg-emerald-500/10 rounded-2xl p-8 text-center"
            >
              <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-4" />
              <h2 className="text-lg font-semibold text-white mb-2">Thanks for the feedback!</h2>
              <p className="text-sm text-neutral-400 mb-4">
                Your email client should have opened. If it didn&rsquo;t, you can copy the feedback text below and paste it into an email.
              </p>
              <button
                onClick={handleCopy}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-neutral-700 bg-neutral-800 hover:bg-neutral-700 text-sm text-neutral-300 transition-all mr-3"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                {copied ? "Copied!" : "Copy feedback text"}
              </button>
              <button
                onClick={() => { setSubmitted(false); setCategory(""); setCourse(""); setMessage(""); }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-neutral-700 bg-neutral-800 hover:bg-neutral-700 text-sm text-neutral-300 transition-all"
              >
                Submit another
              </button>
            </motion.div>
          ) : (
            <motion.form
              key="form"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: 0.1 }}
              onSubmit={handleSubmit}
              className="space-y-5"
            >
              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-2">
                  What kind of feedback? <span className="text-red-400">*</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {FEEDBACK_CATEGORIES.map(cat => (
                    <button
                      key={cat.value}
                      type="button"
                      onClick={() => setCategory(cat.value)}
                      className={`px-4 py-3 rounded-xl border text-sm text-left transition-all ${
                        category === cat.value
                          ? "border-blue-500/60 bg-blue-500/15 text-white"
                          : "border-neutral-700 bg-neutral-900/60 text-neutral-400 hover:border-neutral-600 hover:text-neutral-200"
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Course (optional) */}
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-2">
                  Which course? <span className="text-neutral-500">(optional)</span>
                </label>
                <input
                  type="text"
                  value={course}
                  onChange={e => setCourse(e.target.value)}
                  placeholder="e.g., AP Biology, AP US History..."
                  className="w-full bg-neutral-900/60 border border-neutral-700 rounded-xl py-3 px-4 text-sm text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/60 transition-all"
                />
              </div>

              {/* Message */}
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-2">
                  Tell us more <span className="text-red-400">*</span>
                </label>
                <textarea
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  placeholder="Describe what happened, what you expected, or your idea..."
                  rows={5}
                  className="w-full bg-neutral-900/60 border border-neutral-700 rounded-xl py-3 px-4 text-sm text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/60 transition-all resize-none"
                />
                <p className="text-xs text-neutral-500 mt-1">{message.trim().length} / 10 characters minimum</p>
              </div>

              <button
                type="submit"
                disabled={!isValid}
                className="w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:bg-neutral-800 disabled:text-neutral-500 text-white font-medium transition-all shadow-lg disabled:cursor-not-allowed"
              >
                <Send className="w-4 h-4" />
                Send Feedback
              </button>

              <p className="text-xs text-center text-neutral-600">
                Clicking &ldquo;Send Feedback&rdquo; will open your email client with this message pre-filled.
              </p>
            </motion.form>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
