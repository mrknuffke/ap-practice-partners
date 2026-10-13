"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Brain, BookOpen, Clock, Target } from "lucide-react";
import { LOADING_QUIPS } from "@/constants/loadingQuips";

interface PracticeQuestionLoadingStateProps {
  title: string;
  subtitle: string;
  courseName?: string;
  badge?: string;
  className?: string;
}

const GENERATION_PHASES = [
  {
    step: 1,
    title: "Analyzing Curriculum Scope",
    detail: "Cross-referencing official CED unit objectives, skills, and exam weightings...",
  },
  {
    step: 2,
    title: "Synthesizing Authentic Stimulus",
    detail: "Crafting realistic experimental data tables, diagrams, and scenario context...",
  },
  {
    step: 3,
    title: "Calibrating AP Task Verbs & Distractors",
    detail: "Targeting common student misconceptions and rigorous AP scoring standards...",
  },
  {
    step: 4,
    title: "Finalizing Explanations & Rubrics",
    detail: "Reviewing rationale and formatting clean answer criteria...",
  },
];

export function PracticeQuestionLoadingState({
  title,
  subtitle,
  courseName,
  badge,
  className = "",
}: PracticeQuestionLoadingStateProps) {
  const [phaseIndex, setPhaseIndex] = useState(0);
  const [quipIndex, setQuipIndex] = useState(() => Math.floor(Math.random() * LOADING_QUIPS.length));
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // Timer for elapsed seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedSeconds(prev => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Progression through phases (advances every 4 seconds)
  useEffect(() => {
    const phaseTimer = setInterval(() => {
      setPhaseIndex(prev => (prev < GENERATION_PHASES.length - 1 ? prev + 1 : prev));
    }, 4200);
    return () => clearInterval(phaseTimer);
  }, []);

  // Rotate study quips every 4.8 seconds
  useEffect(() => {
    const quipTimer = setInterval(() => {
      setQuipIndex(prev => (prev + 1) % LOADING_QUIPS.length);
    }, 4800);
    return () => clearInterval(quipTimer);
  }, []);

  const currentPhase = GENERATION_PHASES[phaseIndex];

  return (
    <div
      className={`flex flex-col items-center justify-center min-h-[460px] h-full p-6 sm:p-8 max-w-xl mx-auto w-full text-center ${className}`}
    >
      {/* Top Context Badges */}
      <div className="flex items-center justify-center gap-2 mb-6 flex-wrap">
        {courseName && (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
            <BookOpen className="w-3.5 h-3.5" />
            {courseName}
          </span>
        )}
        {badge && (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-surface-high text-muted-foreground border border-border/40">
            <Target className="w-3.5 h-3.5 text-primary" />
            {badge}
          </span>
        )}
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-mono text-muted-foreground bg-surface border border-border/30">
          <Clock className="w-3 h-3 text-primary animate-spin" />
          {elapsedSeconds}s
        </span>
      </div>

      {/* Modern Center Orbital Visual */}
      <div className="relative mb-6 flex items-center justify-center">
        {/* Outer glowing pulsing aura */}
        <div className="absolute w-28 h-28 rounded-full bg-primary/15 blur-xl animate-pulse" />

        {/* Orbit track ring */}
        <div className="w-24 h-24 rounded-full border-2 border-primary/20 relative flex items-center justify-center">
          {/* Rotating gradient satellite border */}
          <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-primary border-r-primary/40 animate-spin" />

          {/* Inner core card */}
          <div className="w-16 h-16 rounded-2xl bg-surface-high border border-border shadow-inner flex items-center justify-center relative z-10">
            <motion.div
              animate={{ rotate: [0, 10, -10, 0], scale: [1, 1.08, 1] }}
              transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
            >
              {phaseIndex % 2 === 0 ? (
                <Sparkles className="w-7 h-7 text-primary" />
              ) : (
                <Brain className="w-7 h-7 text-primary" />
              )}
            </motion.div>
          </div>
        </div>
      </div>

      {/* Title & Subtitle */}
      <div className="space-y-1 mb-6">
        <h2 className="text-xl sm:text-2xl font-heading font-bold text-foreground">
          {title}
        </h2>
        <p className="text-sm text-muted-foreground max-w-md mx-auto">{subtitle}</p>
      </div>

      {/* Multi-Step Pedagogical Generation Progress */}
      <div className="w-full bg-surface-high/60 backdrop-blur-sm border border-border/50 rounded-2xl p-4 sm:p-5 mb-5 shadow-sm space-y-3">
        {/* Step Indicators Bar */}
        <div className="grid grid-cols-4 gap-2">
          {GENERATION_PHASES.map((p, idx) => (
            <div key={p.step} className="flex flex-col gap-1">
              <div
                className={`h-1.5 rounded-full transition-all duration-500 ${
                  idx < phaseIndex
                    ? "bg-primary"
                    : idx === phaseIndex
                    ? "bg-primary animate-pulse"
                    : "bg-muted"
                }`}
              />
              <span
                className={`text-[10px] hidden sm:block truncate transition-colors ${
                  idx === phaseIndex
                    ? "text-primary font-bold"
                    : idx < phaseIndex
                    ? "text-muted-foreground"
                    : "text-muted-foreground/40"
                }`}
              >
                Step {p.step}
              </span>
            </div>
          ))}
        </div>

        {/* Active Phase Details */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentPhase.step}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.25 }}
            className="text-left pt-1"
          >
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-primary animate-ping" />
              <h3 className="text-xs sm:text-sm font-semibold text-foreground">
                {currentPhase.title}
              </h3>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed pl-4">
              {currentPhase.detail}
            </p>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Dynamic Cycling Study Tip / Quip Card */}
      <div className="w-full relative overflow-hidden bg-surface/80 border border-border/30 rounded-xl px-4 py-3 min-h-[58px] flex items-center justify-center">
        <AnimatePresence mode="wait">
          <motion.p
            key={quipIndex}
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.02 }}
            transition={{ duration: 0.3 }}
            className="text-xs text-muted-foreground italic text-center leading-normal"
          >
            &ldquo;{LOADING_QUIPS[quipIndex]}&rdquo;
          </motion.p>
        </AnimatePresence>

        {/* Tip cycle progress line */}
        <motion.div
          key={`bar-${quipIndex}`}
          initial={{ width: "0%" }}
          animate={{ width: "100%" }}
          transition={{ duration: 4.8, ease: "linear" }}
          className="absolute bottom-0 left-0 h-[2px] bg-primary/30"
        />
      </div>
    </div>
  );
}
