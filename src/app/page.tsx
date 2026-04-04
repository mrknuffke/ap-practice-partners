"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, BookOpen, ChevronRight, Info, MessageSquare, HelpCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
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
        <span className="text-2xl leading-none mt-0.5" role="img" aria-label={course.displayName}>
          {course.emoji}
        </span>
        <ChevronRight className={`w-4 h-4 mt-0.5 opacity-0 group-hover:opacity-60 transition-opacity flex-shrink-0 ${colors.text}`} />
      </div>
      <div className="mt-2">
        <p className="text-sm font-semibold text-neutral-100 leading-snug">
          {course.displayName}
        </p>
        <div className="flex flex-wrap gap-1.5 mt-1.5">
          <span className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full ${colors.badge} ${colors.text}`}>
            {SUBJECT_LABELS[course.subjectArea]}
          </span>
          {count && (
            <span className="inline-block text-[10px] font-bold text-neutral-500 uppercase tracking-tight py-0.5">
              {count} Units
            </span>
          )}
        </div>
      </div>
    </>
  );

  const cardClass = `
    w-full text-left p-4 rounded-2xl border bg-neutral-900/60 backdrop-blur-sm
    transition-all duration-200 cursor-pointer group shadow-sm
    ${colors.border} ${colors.hover} ${colors.glow}
  `;

  if (href) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: index * 0.04, ease: "easeOut" }}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <Link href={href} className={cardClass}>
          {inner}
        </Link>
      </motion.div>
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
        className="bg-neutral-900 border border-neutral-700 rounded-3xl p-8 w-full max-w-md shadow-2xl"
      >
        <h2 className="text-xl font-bold text-white mb-2">AP Physics C</h2>
        <p className="text-neutral-400 text-sm mb-6">Which exam are you preparing for?</p>
        <div className="flex flex-col gap-3">
          <Link
            href="/tutor/ap-physics-c?exam=mechanics"
            onClick={() => onSelect('mechanics')}
            className="flex items-center gap-4 p-4 rounded-2xl border border-indigo-500/30 bg-indigo-500/10 hover:bg-indigo-500/20 hover:border-indigo-500/60 transition-all text-left"
          >
            <span className="text-2xl">⚙️</span>
            <div>
              <p className="font-semibold text-white">Mechanics</p>
              <p className="text-xs text-neutral-400">Kinematics, Newton&apos;s Laws, Energy, Rotation</p>
            </div>
          </Link>
          <Link
            href="/tutor/ap-physics-c?exam=em"
            onClick={() => onSelect('em')}
            className="flex items-center gap-4 p-4 rounded-2xl border border-indigo-500/30 bg-indigo-500/10 hover:bg-indigo-500/20 hover:border-indigo-500/60 transition-all text-left"
          >
            <span className="text-2xl">🧲</span>
            <div>
              <p className="font-semibold text-white">Electricity &amp; Magnetism</p>
              <p className="text-xs text-neutral-400">Electrostatics, Circuits, Magnetism, Inductance</p>
            </div>
          </Link>
        </div>
        <button
          onClick={onClose}
          className="mt-4 w-full text-sm text-neutral-500 hover:text-neutral-300 transition-colors"
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
        className="bg-neutral-900 border border-neutral-700 rounded-3xl p-8 w-full max-w-md shadow-2xl"
      >
        <h2 className="text-xl font-bold text-white mb-2">AP Calculus</h2>
        <p className="text-neutral-400 text-sm mb-6">Which exam are you preparing for?</p>
        <div className="flex flex-col gap-3">
          <Link
            href="/tutor/ap-calculus-ab-bc?exam=ab"
            onClick={() => onSelect('ab')}
            className="flex items-center gap-4 p-4 rounded-2xl border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 hover:border-rose-500/60 transition-all text-left"
          >
            <span className="text-2xl">📐</span>
            <div>
              <p className="font-semibold text-white">Calculus AB</p>
              <p className="text-xs text-neutral-400">Limits, Derivatives, Integrals, Applications</p>
            </div>
          </Link>
          <Link
            href="/tutor/ap-calculus-ab-bc?exam=bc"
            onClick={() => onSelect('bc')}
            className="flex items-center gap-4 p-4 rounded-2xl border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 hover:border-rose-500/60 transition-all text-left"
          >
            <span className="text-2xl">📈</span>
            <div>
              <p className="font-semibold text-white">Calculus BC</p>
              <p className="text-xs text-neutral-400">AB topics + Series, Polar, Parametric, Vectors</p>
            </div>
          </Link>
        </div>
        <button
          onClick={onClose}
          className="mt-4 w-full text-sm text-neutral-500 hover:text-neutral-300 transition-colors"
        >
          Cancel
        </button>
      </motion.div>
    </motion.div>
  );
}

export default function Home() {
  const router = useRouter();
  const [filter, setFilter] = useState("");
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
    <div className="min-h-screen bg-neutral-950 text-neutral-100 font-sans relative">
      {/* Background ambient gradients */}
      <div className="fixed top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-blue-600/15 blur-[160px] pointer-events-none" />
      <div className="fixed bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-600/15 blur-[160px] pointer-events-none" />

      {/* Sticky header */}
      <header className="sticky top-0 z-30 bg-neutral-950/80 backdrop-blur-xl border-b border-neutral-800/60">
        <div className="max-w-6xl mx-auto px-4 py-4 flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="flex items-center gap-3 flex-shrink-0">
            <div className="p-2 bg-neutral-900 border border-neutral-700 rounded-xl">
              <BookOpen className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white leading-none">AP Practice Partners</h1>
              <p className="text-xs text-neutral-500 mt-0.5">Strictly aligned with official College Board CEDs</p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:ml-auto">
            <Link href="/tutorial"
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm text-neutral-400 hover:text-white hover:bg-neutral-800 transition-all"
            >
              <HelpCircle className="w-4 h-4" />
              <span className="hidden sm:inline">How to Use</span>
            </Link>
            <Link href="/about"
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm text-neutral-400 hover:text-white hover:bg-neutral-800 transition-all"
            >
              <Info className="w-4 h-4" />
              <span className="hidden sm:inline">About</span>
            </Link>
            <Link href="/feedback"
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm text-neutral-400 hover:text-white hover:bg-neutral-800 transition-all"
            >
              <MessageSquare className="w-4 h-4" />
              <span className="hidden sm:inline">Feedback</span>
            </Link>
          </div>

          <div className="w-full sm:w-64 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500 pointer-events-none" />
            <input
              type="text"
              value={filter}
              onChange={e => setFilter(e.target.value)}
              placeholder="Filter courses..."
              className="w-full bg-neutral-900/80 border border-neutral-700 rounded-xl py-2.5 pl-9 pr-4 text-sm text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/60 transition-all"
            />
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8 relative z-10">
        {filteredCourses ? (
          /* Flat filtered results */
          <div>
            <p className="text-sm text-neutral-400 mb-4">
              {filteredCourses.length} course{filteredCourses.length !== 1 ? 's' : ''} matching &ldquo;{filter}&rdquo;
            </p>
            {filteredCourses.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                {filteredCourses.map((course, i) => (
                  <CourseCard key={course.slug} course={course} index={i} onSelect={handleCourseSelect} />
                ))}
              </div>
            ) : (
              <p className="text-neutral-500 text-sm">No courses match your search.</p>
            )}
          </div>
        ) : (
          /* Grouped by subject */
          <div className="space-y-10">
            {SUBJECT_ORDER.map(subject => {
              const courses = COURSES_BY_SUBJECT[subject];
              if (!courses || courses.length === 0) return null;
              return (
                <section key={subject}>
                  <h2 className="text-xs font-semibold uppercase tracking-widest text-neutral-500 mb-4">
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
