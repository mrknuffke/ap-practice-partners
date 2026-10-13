"use client";

import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageSquare, RotateCcw, ArrowRight, History } from "lucide-react";
import { COURSE_BY_SLUG } from "@/constants/courses";

interface ResumeSessionModalProps {
  isOpen: boolean;
  courseName: string;
  courseSlug: string;
  messageCount: number;
  lastMessageSnippet?: string;
  onResume: () => void;
  onStartNew: () => void;
}

export function ResumeSessionModal({
  isOpen,
  courseName,
  courseSlug,
  messageCount,
  lastMessageSnippet,
  onResume,
  onStartNew,
}: ResumeSessionModalProps) {
  // Safe default: pressing Escape continues the session rather than destroying it
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onResume();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onResume]);

  if (!isOpen) return null;

  const course = COURSE_BY_SLUG[courseSlug];
  const courseEmoji = course?.emoji || "📚";

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-md p-4"
        onClick={onResume}
      >
        <motion.div
          initial={{ scale: 0.94, opacity: 0, y: 10 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.94, opacity: 0, y: 10 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          onClick={(e) => e.stopPropagation()}
          className="bg-card border border-border rounded-3xl p-6 sm:p-8 w-full max-w-lg shadow-2xl relative overflow-hidden"
          role="dialog"
          aria-modal="true"
          aria-labelledby="resume-modal-title"
        >
          {/* Subtle decorative glow */}
          <div className="absolute -top-16 -right-16 w-36 h-36 rounded-full bg-primary/10 blur-2xl pointer-events-none" />

          {/* Header with Course Badge */}
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-surface-high border border-border flex items-center justify-center text-2xl shadow-sm shrink-0">
              {courseEmoji}
            </div>
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-primary px-2.5 py-0.5 rounded-full bg-primary/10 inline-block mb-1">
                {courseName}
              </span>
              <h2 id="resume-modal-title" className="text-xl sm:text-2xl font-bold font-heading text-foreground leading-tight">
                Resume Previous Session?
              </h2>
            </div>
          </div>

          <p className="text-sm text-muted-foreground mb-5">
            You have an unfinished chat session for this subject. Would you like to pick up where you left off or start fresh?
          </p>

          {/* Session Overview Card */}
          <div className="bg-surface-high/60 border border-border/80 rounded-2xl p-4 mb-6 space-y-2.5">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5 font-semibold text-foreground">
                <History className="w-3.5 h-3.5 text-primary" />
                Previous Chat Details
              </span>
              <span className="px-2 py-0.5 rounded-full bg-surface border border-border/80 font-medium">
                {messageCount} {messageCount === 1 ? "message" : "messages"}
              </span>
            </div>

            {lastMessageSnippet ? (
              <div className="pt-1">
                <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider mb-1">
                  Last active topic:
                </p>
                <p className="text-xs text-foreground/90 italic bg-surface/70 border border-border/60 rounded-xl p-2.5 line-clamp-3 leading-relaxed">
                  &ldquo;{lastMessageSnippet}&rdquo;
                </p>
              </div>
            ) : null}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col gap-3">
            <button
              onClick={onResume}
              className="w-full flex items-center justify-between p-4 rounded-2xl bg-primary text-primary-foreground font-semibold shadow-sm hover:bg-primary/90 hover:shadow-md transition-all group text-left cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                  <MessageSquare className="w-5 h-5 text-primary-foreground" />
                </div>
                <div>
                  <span className="block font-semibold text-sm sm:text-base">Continue Previous Chat</span>
                  <span className="block text-xs text-primary-foreground/80 font-normal">
                    Restore all messages and completed exercises
                  </span>
                </div>
              </div>
              <ArrowRight className="w-5 h-5 text-primary-foreground/70 group-hover:text-primary-foreground group-hover:translate-x-1 transition-all shrink-0 ml-2" />
            </button>

            <button
              onClick={onStartNew}
              className="w-full flex items-center justify-between p-4 rounded-2xl border border-border bg-surface-low hover:bg-surface-high hover:border-border/80 text-foreground transition-all group text-left cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center shrink-0">
                  <RotateCcw className="w-4 h-4 text-muted-foreground group-hover:rotate-45 transition-transform" />
                </div>
                <div>
                  <span className="block font-semibold text-sm sm:text-base text-foreground">Start New Chat</span>
                  <span className="block text-xs text-muted-foreground font-normal">
                    Clear previous chat and get a fresh greeting
                  </span>
                </div>
              </div>
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
