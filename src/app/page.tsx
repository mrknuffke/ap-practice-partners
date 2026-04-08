"use client";

import { useState, useMemo, useEffect } from "react";
import { storageGet, storageSet } from "@/lib/utils";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, BookOpen, ChevronRight, Brain, Star, Loader2 } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { aggregateDashboardMetrics, type MetricData } from "@/lib/metrics";
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
  isStarred,
  onToggleStar,
}: {
  course: CourseEntry;
  index: number;
  onSelect: (course: CourseEntry) => void;
  isStarred?: boolean;
  onToggleStar?: (slug: string) => void;
}) {
  const colors = COLOR_CLASSES[course.color] ?? COLOR_CLASSES['blue'];
  const href = courseHref(course);

  const inner = (
    <div className="flex flex-col justify-between h-full relative z-10">
      <div className="flex items-start justify-between gap-2">
        <span className="text-5xl leading-none drop-shadow-sm" role="img" aria-label={course.displayName}>
          {course.emoji}
        </span>
        <div className="flex items-center gap-1">
          <button
            onClick={e => { e.preventDefault(); e.stopPropagation(); onToggleStar?.(course.slug); }}
            className={`p-1 rounded-full transition-all ${isStarred ? 'text-amber-400' : 'opacity-0 group-hover:opacity-60 text-muted-foreground hover:text-amber-400'}`}
            aria-label={isStarred ? "Unpin course" : "Pin course"}
          >
            <Star className={`w-4 h-4 ${isStarred ? 'fill-amber-400' : ''}`} />
          </button>
          <ChevronRight className="w-5 h-5 opacity-0 group-hover:opacity-80 transition-opacity flex-shrink-0 text-foreground/50" />
        </div>
      </div>
      <div className="mt-12">
        <span className={`inline-block text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wide mb-3 ${colors.badge} ${colors.text}`}>
          {SUBJECT_LABELS[course.subjectArea]}
        </span>
        <p className="text-xl font-heading text-foreground font-semibold leading-snug">
          {course.displayName}
        </p>
      </div>
    </div>
  );

  const cardClass = `
    w-full h-full text-left p-6 rounded-[2rem] border-none bg-surface-high
    transition-all duration-200 cursor-pointer group shadow-sm hover:shadow-lg
    relative overflow-hidden before:absolute before:inset-0 before:bg-gradient-to-br before:from-white/5 before:to-transparent before:opacity-0 hover:before:opacity-100
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
  const [studentName, setStudentName] = useState("Scholar");
  const [metrics, setMetrics] = useState<MetricData | null>(null);
  const [mentorTip, setMentorTip] = useState<string | null>(null);
  const [tipLoading, setTipLoading] = useState(true);
  const [starredSlugs, setStarredSlugs] = useState<string[]>([]);

  useEffect(() => {
    const refresh = () => {
      const saved = storageGet("student_name");
      if (saved) setStudentName(saved);
    };
    refresh();
    window.addEventListener("student-name-updated", refresh);
    return () => window.removeEventListener("student-name-updated", refresh);
  }, []);

  useEffect(() => {
    setMetrics(aggregateDashboardMetrics());
  }, []);

  useEffect(() => {
    const stored = storageGet("ap_starred_courses");
    if (stored) {
      try { setStarredSlugs(JSON.parse(stored)); } catch {}
    }
  }, []);

  useEffect(() => {
    const code = storageGet("classroom_code") || "";
    if (!code) { setTipLoading(false); return; }
    fetch("/api/mentor-tip", { headers: { "x-classroom-code": code } })
      .then(r => r.json())
      .then(d => setMentorTip(d.tip ?? null))
      .catch(() => setMentorTip(null))
      .finally(() => setTipLoading(false));
  }, []);

  const handleToggleStar = (slug: string) => {
    setStarredSlugs(prev => {
      const next = prev.includes(slug) ? prev.filter(s => s !== slug) : [...prev, slug];
      storageSet("ap_starred_courses", JSON.stringify(next));
      return next;
    });
  };

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

      {/* Header Area */}
      <header className="px-8 py-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 z-30 relative">
        <div className="flex-1">
          <h1 className="text-4xl font-heading text-foreground font-semibold italic">Hey {studentName}!</h1>
        </div>
        <div className="w-full sm:w-80 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            value={filter}
            onChange={e => setFilter(e.target.value)}
            placeholder="Search curriculum..."
            className="w-full bg-surface-high border-none rounded-full py-3 pl-12 pr-4 text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all font-sans"
          />
        </div>
      </header>

      <main className="max-w-6xl px-8 pb-32 relative z-10 w-full overflow-x-hidden">
        {/* Top Dash Widgets — 3 col */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {/* Study Insights Card */}
          <div className="bg-accent rounded-3xl p-8 flex flex-col justify-between border-transparent overflow-hidden relative shadow-sm">
             <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-white/20 blur-2xl rounded-full" />
             <p className="text-[10px] font-bold text-accent-foreground tracking-widest uppercase mb-4 opacity-80">Study Insights</p>
             <h2 className="text-5xl font-heading text-accent-foreground italic mb-2 leading-tight">
                {metrics?.totalSessions || 0} Sessions
             </h2>
             <p className="text-accent-foreground/80 text-sm font-medium mb-2">Total focused sessions completed.</p>
             {metrics?.currentFocus && (
               <div className="mt-4 p-3 bg-accent-foreground/10 rounded-2xl relative z-10">
                 <p className="text-[10px] font-bold uppercase tracking-wider text-accent-foreground/70">Current Focus</p>
                 <p className="text-sm font-bold text-accent-foreground leading-snug">{metrics.currentFocus.courseName}</p>
                 <p className="text-xs text-accent-foreground/80 italic">{metrics.currentFocus.topic}</p>
               </div>
             )}
          </div>

          {/* Recent Wins */}
          <div className="bg-surface-high rounded-3xl p-8 flex flex-col">
             <div className="mb-6">
               <h2 className="text-3xl font-heading text-foreground italic mb-2">Recent Wins</h2>
               <p className="text-muted-foreground text-sm">Celebrating your mastery and milestones.</p>
             </div>
             <div className="flex flex-col gap-3 flex-1 justify-center">
               {!metrics?.recentWins?.length ? (
                 <div className="bg-surface rounded-2xl flex flex-col items-center justify-center p-8 border border-border/20 text-muted-foreground">
                   <BookOpen className="w-8 h-8 mb-2 opacity-50" />
                   <p className="text-sm font-medium">Your wins will appear here</p>
                 </div>
               ) : (
                 metrics.recentWins.map((win, idx) => (
                   <div key={win.id || idx} className="bg-surface rounded-2xl flex items-center p-4 gap-4 shadow-sm border border-border/20">
                      <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center font-sans">🏆</div>
                      <div className="flex-1 min-w-0">
                         <p className="text-foreground font-bold text-sm truncate">{win.courseName}</p>
                         <p className="text-muted-foreground text-xs truncate">{win.type} — {win.topic} <span className="font-bold">({win.scoreString})</span></p>
                      </div>
                   </div>
                 ))
               )}
             </div>
          </div>

          {/* Mentor Tip — generated fresh each session */}
          <div className="bg-surface-high rounded-3xl p-8 flex flex-col shadow-sm">
            <p className="text-[10px] font-bold text-muted-foreground tracking-widest uppercase mb-4">Mentor Tip</p>
            <div className="flex gap-4 items-start flex-1">
              <div className="w-10 h-10 rounded-full bg-accent/60 flex items-center justify-center shrink-0">
                {tipLoading
                  ? <Loader2 className="w-5 h-5 text-accent-foreground animate-spin" />
                  : <Brain className="w-5 h-5 text-accent-foreground" />}
              </div>
              <p className="text-foreground text-sm italic leading-relaxed flex-1">
                {tipLoading
                  ? "Thinking of something for you..."
                  : (mentorTip ?? "Focus on understanding the why — AP exams reward reasoning over recall.")}
              </p>
            </div>
          </div>
        </div>

        <h2 className="text-3xl font-heading text-foreground font-semibold italic mb-8">Your Courses</h2>

        {/* Starred / Pinned courses */}
        {starredSlugs.length > 0 && !filter && (
          <section className="mb-10">
            <h3 className="text-sm font-bold uppercase tracking-widest text-amber-500 mb-4 flex items-center gap-2">
              <Star className="w-4 h-4 fill-amber-400" /> Pinned
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {COURSES.filter(c => starredSlugs.includes(c.slug)).map((course, i) => (
                <CourseCard key={course.slug} course={course} index={i} onSelect={handleCourseSelect} isStarred={true} onToggleStar={handleToggleStar} />
              ))}
            </div>
          </section>
        )}
        {filteredCourses ? (
          /* Flat filtered results */
          <div>
            <p className="text-sm text-muted-foreground mb-4">
              {filteredCourses.length} course{filteredCourses.length !== 1 ? 's' : ''} matching &ldquo;{filter}&rdquo;
            </p>
            {filteredCourses.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                {filteredCourses.map((course, i) => (
                  <CourseCard key={course.slug} course={course} index={i} onSelect={handleCourseSelect} isStarred={starredSlugs.includes(course.slug)} onToggleStar={handleToggleStar} />
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
                      <CourseCard key={course.slug} course={course} index={i} onSelect={handleCourseSelect} isStarred={starredSlugs.includes(course.slug)} onToggleStar={handleToggleStar} />
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
