"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, BookOpen, ChevronRight, Info, MessageSquare, HelpCircle, Brain, School } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { motion, AnimatePresence } from "framer-motion";

const MotionLink = motion.create(Link);
import {
  COURSES,
  COURSES_BY_SUBJECT,
  SUBJECT_ORDER,
  SUBJECT_LABELS,
  COLOR_CLASSES,
  type CourseEntry,
} from "@/constants/courses";
import unitCounts from "@/constants/unitCounts.json";

function courseHref(course: CourseEntry): string | null {
  if (course.isPhysicsC || course.isCalcABBC) return null; // requires modal first
  return `/tutor/${course.slug}`;
}

function CourseCard({
  course,
  index,
  onSelect,
}: {
  course: CourseEntry;
  index: number;
  onSelect: (course: CourseEntry) => void;
}) {
  const colors = COLOR_CLASSES[course.color] ?? COLOR_CLASSES['blue'];
  const stem = Array.isArray(course.cedFile) ? course.cedFile[0] : course.cedFile;
  const count = (unitCounts as Record<string, number>)[stem] ?? null;
  const href = courseHref(course);

  const inner = (
    <>
      <div className="flex items-start justify-between gap-2">
        <span className="text-3xl leading-none mt-0.5" role="img" aria-label={course.displayName}>
          {course.emoji}
        </span>
        <ChevronRight className={`w-4 h-4 mt-0.5 opacity-0 group-hover:opacity-60 transition-opacity flex-shrink-0 ${colors.text}`} />
      </div>
      <div className="mt-3">
        <p className="text-base font-bold text-foreground leading-snug">
          {course.displayName}
        </p>
        <div className="flex flex-wrap gap-1.5 mt-1.5">
          <span className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full ${colors.badge} ${colors.text}`}>
            {SUBJECT_LABELS[course.subjectArea]}
          </span>
          {count && (
            <span className="inline-block text-xs font-bold text-muted-foreground uppercase tracking-tight py-0.5">
              {count} Units
            </span>
          )}
        </div>
      </div>
    </>
  );

  const cardClass = `
    w-full text-left p-5 rounded-2xl border-transparent dark:border bg-card
    transition-all duration-200 cursor-pointer group shadow-sm hover:shadow-md
    ${colors.hover} dark:${colors.border} dark:${colors.glow}
  `;

  if (href) {
    return (
      <MotionLink
        href={href}
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: index * 0.04, ease: "easeOut" }}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className={cardClass}
      >
        {inner}
      </MotionLink>
    );
  }

  return (
    <motion.button
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.04, ease: "easeOut" }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => onSelect(course)}
      className={cardClass}
    >
      {inner}
    </motion.button>
  );
}

function PhysicsCModal({
  onSelect,
  onClose,
}: {
  onSelect: (exam: 'mechanics' | 'em') => void;
  onClose: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.92, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.92, opacity: 0 }}
        onClick={e => e.stopPropagation()}
        className="bg-card border border-border rounded-3xl p-8 w-full max-w-md shadow-2xl"
      >
        <h2 className="text-xl font-bold text-foreground font-heading mb-2">AP Physics C</h2>
        <p className="text-muted-foreground text-sm mb-6">Which exam are you preparing for?</p>
        <div className="flex flex-col gap-3">
          <Link
            href="/tutor/ap-physics-c?exam=mechanics"
            onClick={() => onSelect('mechanics')}
            className="flex items-center gap-4 p-4 rounded-2xl border border-indigo-500/30 bg-indigo-500/10 hover:bg-indigo-500/20 hover:border-indigo-500/60 transition-all text-left"
          >
            <span className="text-2xl">⚙️</span>
            <div>
              <p className="font-semibold text-foreground">Mechanics</p>
              <p className="text-xs text-muted-foreground">Kinematics, Newton&apos;s Laws, Energy, Rotation</p>
            </div>
          </Link>
          <Link
            href="/tutor/ap-physics-c?exam=em"
            onClick={() => onSelect('em')}
            className="flex items-center gap-4 p-4 rounded-2xl border border-indigo-500/30 bg-indigo-500/10 hover:bg-indigo-500/20 hover:border-indigo-500/60 transition-all text-left"
          >
            <span className="text-2xl">🧲</span>
            <div>
              <p className="font-semibold text-foreground">Electricity &amp; Magnetism</p>
              <p className="text-xs text-muted-foreground">Electrostatics, Circuits, Magnetism, Inductance</p>
            </div>
          </Link>
        </div>
        <button
          onClick={onClose}
          className="mt-4 w-full text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          Cancel
        </button>
      </motion.div>
    </motion.div>
  );
}

function CalcModal({
  onSelect,
  onClose,
}: {
  onSelect: (exam: 'ab' | 'bc') => void;
  onClose: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.92, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.92, opacity: 0 }}
        onClick={e => e.stopPropagation()}
        className="bg-card border border-border rounded-3xl p-8 w-full max-w-md shadow-2xl"
      >
        <h2 className="text-xl font-bold text-foreground font-heading mb-2">AP Calculus</h2>
        <p className="text-muted-foreground text-sm mb-6">Which exam are you preparing for?</p>
        <div className="flex flex-col gap-3">
          <Link
            href="/tutor/ap-calculus-ab-bc?exam=ab"
            onClick={() => onSelect('ab')}
            className="flex items-center gap-4 p-4 rounded-2xl border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 hover:border-rose-500/60 transition-all text-left"
          >
            <span className="text-2xl">📐</span>
            <div>
              <p className="font-semibold text-foreground">Calculus AB</p>
              <p className="text-xs text-muted-foreground">Limits, Derivatives, Integrals, Applications</p>
            </div>
          </Link>
          <Link
            href="/tutor/ap-calculus-ab-bc?exam=bc"
            onClick={() => onSelect('bc')}
            className="flex items-center gap-4 p-4 rounded-2xl border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 hover:border-rose-500/60 transition-all text-left"
          >
            <span className="text-2xl">📈</span>
            <div>
              <p className="font-semibold text-foreground">Calculus BC</p>
              <p className="text-xs text-muted-foreground">AB topics + Series, Polar, Parametric, Vectors</p>
            </div>
          </Link>
        </div>
        <button
          onClick={onClose}
          className="mt-4 w-full text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          Cancel
        </button>
      </motion.div>
    </motion.div>
  );
}

const SCAFFOLDING_TAGLINES = [
  "Ask a question. Get a question back.",
  "You bring the topic. The AI makes you think it through.",
  "Every answer comes with a question — that's the whole point.",
  "The AI won't do your thinking for you — but it will help you do it yourself.",
  "Not a search engine. Not a cheat sheet. A thinking partner.",
  "You explain. You analyze. You answer. The AI just keeps pushing.",
  "Bring a topic. Leave with understanding.",
];

export default function Home() {
  const router = useRouter();
  const [filter, setFilter] = useState("");
  const tagline = useMemo(() => SCAFFOLDING_TAGLINES[Math.floor(Math.random() * SCAFFOLDING_TAGLINES.length)], []);
  const [showPhysicsCModal, setShowPhysicsCModal] = useState(false);
  const [showCalcModal, setShowCalcModal] = useState(false);

  const filteredCourses = filter.trim()
    ? COURSES.filter(c => c.displayName.toLowerCase().includes(filter.toLowerCase()))
    : null;

  function handleCourseSelect(course: CourseEntry) {
    if (course.isPhysicsC) {
      setShowPhysicsCModal(true);
      return;
    }
    if (course.isCalcABBC) {
      setShowCalcModal(true);
      return;
    }
    router.push(`/tutor/${course.slug}`);
  }

  function handlePhysicsCExam(exam: 'mechanics' | 'em') {
    setShowPhysicsCModal(false);
    router.push(`/tutor/ap-physics-c?exam=${exam}`);
  }

  function handleCalcExam(exam: 'ab' | 'bc') {
    setShowCalcModal(false);
    router.push(`/tutor/ap-calculus-ab-bc?exam=${exam}`);
  }

  return (
    <div className="min-h-screen bg-background text-foreground font-sans relative">
      {/* Background ambient gradients */}
      <div className="fixed top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-primary/5 blur-[160px] pointer-events-none" />
      <div className="fixed bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-primary/5 blur-[160px] pointer-events-none" />

      {/* Sticky header */}
      <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-xl border-b border-primary/10">
        <div className="max-w-6xl mx-auto px-4 py-5 flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="flex items-center gap-3 flex-shrink-0">
            <div className="p-2 bg-primary/10 rounded-xl">
              <BookOpen className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-foreground font-heading leading-none">AP Practice Partners</h1>
              <p className="text-xs text-muted-foreground mt-0.5">Strictly aligned with official College Board CEDs</p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:ml-auto">
            <Link href="/tutorial"
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm text-muted-foreground hover:text-foreground hover:bg-secondary transition-all"
            >
              <HelpCircle className="w-4 h-4" />
              <span className="hidden sm:inline">How to Use</span>
            </Link>
            <Link href="/about"
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm text-muted-foreground hover:text-foreground hover:bg-secondary transition-all"
            >
              <Info className="w-4 h-4" />
              <span className="hidden sm:inline">About</span>
            </Link>
            <Link href="/educator-guide"
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm text-muted-foreground hover:text-foreground hover:bg-secondary transition-all"
            >
              <School className="w-4 h-4" />
              <span className="hidden sm:inline">For Educators</span>
            </Link>
            <Link href="/feedback"
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm text-muted-foreground hover:text-foreground hover:bg-secondary transition-all"
            >
              <MessageSquare className="w-4 h-4" />
              <span className="hidden sm:inline">Feedback</span>
            </Link>
            <ThemeToggle />
          </div>

          <div className="w-full sm:w-64 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            <input
              type="text"
              value={filter}
              onChange={e => setFilter(e.target.value)}
              placeholder="Filter courses..."
              className="w-full bg-secondary/80 border border-border rounded-xl py-2.5 pl-9 pr-4 text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/60 transition-all"
            />
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-10 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
          className="mb-8 rounded-2xl border border-primary/20 bg-primary/5 px-6 py-5 flex items-start gap-4"
        >
          <Brain className="w-6 h-6 text-primary flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-base font-semibold text-foreground leading-snug">
              {tagline}
            </p>
            <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
              Every session is a conversation. The AI explains in short bursts, then asks you to think, apply, and connect ideas before moving on.{" "}
              <Link href="/tutorial" className="text-primary hover:text-primary/80 underline underline-offset-2">
                How it works →
              </Link>
            </p>
          </div>
        </motion.div>
        {filteredCourses ? (
          /* Flat filtered results */
          <div>
            <p className="text-sm text-muted-foreground mb-4">
              {filteredCourses.length} course{filteredCourses.length !== 1 ? 's' : ''} matching &ldquo;{filter}&rdquo;
            </p>
            {filteredCourses.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                {filteredCourses.map((course, i) => (
                  <CourseCard key={course.slug} course={course} index={i} onSelect={handleCourseSelect} />
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">No courses match your search.</p>
            )}
          </div>
        ) : (
          /* Grouped by subject */
          <div className="space-y-12">
            {SUBJECT_ORDER.map(subject => {
              const courses = COURSES_BY_SUBJECT[subject];
              if (!courses || courses.length === 0) return null;
              return (
                <section key={subject}>
                  <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground mb-4">
                    {SUBJECT_LABELS[subject]}
                  </h2>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                    {courses.map((course, i) => (
                      <CourseCard key={course.slug} course={course} index={i} onSelect={handleCourseSelect} />
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
        )}
      </main>

      <AnimatePresence>
        {showPhysicsCModal && (
          <PhysicsCModal
            onSelect={handlePhysicsCExam}
            onClose={() => setShowPhysicsCModal(false)}
          />
        )}
        {showCalcModal && (
          <CalcModal
            onSelect={handleCalcExam}
            onClose={() => setShowCalcModal(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
