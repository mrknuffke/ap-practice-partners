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
    const title = encodeURIComponent(`[Feedback]: ${category.toUpperCase()}`);
    const body = encodeURIComponent(buildEmailBody());
    window.open(`https://github.com/mrknuffke/ap-practice-partners/issues/new?title=${title}&body=${body}`, '_blank');
    setSubmitted(true);
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(buildEmailBody());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-background text-foreground font-sans relative">
      <div className="fixed top-[-20%] right-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-600/10 blur-[160px] pointer-events-none" />

      <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-xl border-b border-border/60">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary transition-all"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <span className="text-sm font-medium text-muted-foreground">Feedback</span>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-10 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-8"
        >
          <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">Share Feedback</h1>
          <p className="text-muted-foreground leading-relaxed">
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
              <h2 className="text-lg font-semibold text-foreground mb-2">Thanks for the feedback!</h2>
              <p className="text-sm text-muted-foreground mb-4">
                A new tab should have opened to GitHub Issues. If it didn&rsquo;t, you can copy the feedback text below and create an issue manually.
              </p>
              <button
                onClick={handleCopy}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-border bg-secondary hover:bg-secondary/80 text-sm text-muted-foreground transition-all mr-3"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                {copied ? "Copied!" : "Copy feedback text"}
              </button>
              <button
                onClick={() => { setSubmitted(false); setCategory(""); setCourse(""); setMessage(""); }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-border bg-secondary hover:bg-secondary/80 text-sm text-muted-foreground transition-all"
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
                <label className="block text-sm font-medium text-muted-foreground mb-2">
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
                          ? "border-primary/60 bg-primary/15 text-foreground"
                          : "border-border bg-card/60 text-muted-foreground hover:border-border hover:text-foreground"
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Course (optional) */}
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-2">
                  Which course? <span className="text-muted-foreground">(optional)</span>
                </label>
                <input
                  type="text"
                  value={course}
                  onChange={e => setCourse(e.target.value)}
                  placeholder="e.g., AP Biology, AP US History..."
                  className="w-full bg-card/60 border border-border rounded-xl py-3 px-4 text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/60 transition-all"
                />
              </div>

              {/* Message */}
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-2">
                  Tell us more <span className="text-red-400">*</span>
                </label>
                <textarea
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  placeholder="Describe what happened, what you expected, or your idea..."
                  rows={5}
                  className="w-full bg-card/60 border border-border rounded-xl py-3 px-4 text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/60 transition-all resize-none"
                />
                <p className="text-xs text-muted-foreground mt-1">{message.trim().length} / 10 characters minimum</p>
              </div>

              <button
                type="submit"
                disabled={!isValid}
                className="w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground disabled:bg-muted disabled:text-muted-foreground text-foreground font-medium transition-all shadow-lg disabled:cursor-not-allowed"
              >
                <Send className="w-4 h-4" />
                Submit to GitHub
              </button>

              <p className="text-xs text-center text-muted-foreground">
                Clicking &ldquo;Submit to GitHub&rdquo; will open a new tab to create a GitHub Issue with this text.
              </p>
            </motion.form>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
