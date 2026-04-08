"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  BookOpen, BarChart3, Info, Book, GraduationCap,
  MessageSquare, Settings, Search, Star, X, Zap
} from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { storageGet } from "@/lib/utils";
import { useState, useEffect, useRef } from "react";
import { COURSES } from "@/constants/courses";
import { AnimatePresence, motion } from "framer-motion";

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [studentName, setStudentName] = useState("Scholar");
  const [showModal, setShowModal] = useState(false);
  const [query, setQuery] = useState("");
  const [starredSlugs, setStarredSlugs] = useState<string[]>([]);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const refresh = () => {
      const saved = storageGet("student_name");
      setStudentName(saved || "Scholar");
    };
    refresh();
    window.addEventListener("student-name-updated", refresh);
    return () => window.removeEventListener("student-name-updated", refresh);
  }, []);

  useEffect(() => {
    try {
      const raw = storageGet("starred_courses");
      if (raw) setStarredSlugs(JSON.parse(raw));
    } catch { /* ignore */ }
  }, [showModal]); // refresh starred list each time modal opens

  useEffect(() => {
    if (showModal) {
      setTimeout(() => searchRef.current?.focus(), 80);
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
      setQuery("");
    }
    return () => { document.body.style.overflow = ""; };
  }, [showModal]);

  const pinnedCourses = COURSES.filter(c => starredSlugs.includes(c.slug));
  const filteredCourses = query.trim()
    ? COURSES.filter(c => c.displayName.toLowerCase().includes(query.toLowerCase()))
    : COURSES;

  const handleSelect = (slug: string) => {
    setShowModal(false);
    router.push(`/tutor/${slug}`);
  };

  const navItems = [
    { name: "Study Room", href: "/", icon: BookOpen },
    { name: "Progress", href: "/progress", icon: BarChart3 },
  ];

  return (
    <>
      <aside className="hidden md:flex flex-col h-screen py-8 gap-y-4 bg-sidebar w-72 rounded-r-3xl overflow-hidden shadow-2xl shrink-0 z-40 border-r border-sidebar-border/50">
        <div className="px-8 mb-6 flex justify-between items-center">
          <span className="font-heading italic text-xl text-primary font-semibold tracking-wide">AP Study Bots</span>
          <ThemeToggle />
        </div>

        {/* User Profile */}
        <div className="px-8 mb-8 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full overflow-hidden bg-surface-high flex items-center justify-center text-primary font-heading italic text-xl font-bold">
            {studentName.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="font-sans font-semibold tracking-wide text-sidebar-foreground text-sm">Welcome, {studentName}</p>
            <p className="text-muted-foreground text-xs uppercase tracking-widest font-sans">AP Focus</p>
          </div>
        </div>

        <nav className="flex-1 space-y-1 mt-4">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-4 mx-4 px-6 py-3 rounded-full transition-all group ${
                  isActive
                    ? "bg-surface-highest text-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-surface-high hover:text-foreground"
                }`}
              >
                <item.icon className={`w-5 h-5 ${isActive ? "text-primary" : ""}`} />
                <span className="font-medium">{item.name}</span>
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto px-6 space-y-2">
          {/* Start Review — opens course picker modal */}
          <button
            onClick={() => setShowModal(true)}
            className="w-full bg-primary text-primary-foreground py-4 rounded-xl font-bold mb-4 shadow-lg shadow-primary/20 hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
          >
            <Zap className="w-4 h-4" />
            Start Review
          </button>
          <Link
            href="/settings"
            className={`flex items-center gap-4 px-6 py-3 rounded-full transition-all ${
              pathname === "/settings" ? "bg-surface-highest text-foreground" : "text-muted-foreground hover:bg-surface-high hover:text-foreground"
            }`}
          >
            <Settings className="w-5 h-5" />
            <span className="font-medium">Settings</span>
          </Link>
          <Link href="/about" className="flex items-center gap-4 text-muted-foreground px-6 py-3 hover:bg-surface-high hover:text-foreground rounded-full transition-all">
            <Info className="w-5 h-5" />
            <span className="font-medium">About</span>
          </Link>
          <Link href="/educator-guide" className="flex items-center gap-4 text-muted-foreground px-6 py-3 hover:bg-surface-high hover:text-foreground rounded-full transition-all">
            <Book className="w-5 h-5" />
            <span className="font-medium">Educator Guide</span>
          </Link>
          <Link href="/tutorial" className="flex items-center gap-4 text-muted-foreground px-6 py-3 hover:bg-surface-high hover:text-foreground rounded-full transition-all">
            <GraduationCap className="w-5 h-5" />
            <span className="font-medium">Tutorial</span>
          </Link>
          <Link href="/feedback" className="flex items-center gap-4 text-muted-foreground px-6 py-3 hover:bg-surface-high hover:text-foreground rounded-full transition-all">
            <MessageSquare className="w-5 h-5" />
            <span className="font-medium">Feedback</span>
          </Link>
        </div>
      </aside>

      {/* Start Review Modal */}
      <AnimatePresence>
        {showModal && (
          <>
            {/* Backdrop */}
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowModal(false)}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            />

            {/* Modal Panel */}
            <motion.div
              key="modal"
              initial={{ opacity: 0, scale: 0.96, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97, y: 8 }}
              transition={{ type: "spring", damping: 28, stiffness: 320 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
            >
              <div className="bg-surface-high rounded-3xl shadow-2xl w-full max-w-md max-h-[80vh] flex flex-col pointer-events-auto border border-border/20 overflow-hidden">
                {/* Header */}
                <div className="px-6 pt-6 pb-4 border-b border-border/20 shrink-0">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="font-heading italic font-bold text-xl text-foreground">Start Review</h2>
                    <button
                      onClick={() => setShowModal(false)}
                      className="w-8 h-8 rounded-full flex items-center justify-center text-muted-foreground hover:bg-surface hover:text-foreground transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  {/* Search */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                    <input
                      ref={searchRef}
                      type="text"
                      value={query}
                      onChange={e => setQuery(e.target.value)}
                      placeholder="Search any AP course..."
                      className="w-full bg-surface rounded-full py-2.5 pl-10 pr-4 text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 border border-border/30"
                    />
                  </div>
                </div>

                {/* Course List */}
                <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 custom-scrollbar">
                  {/* Pinned Section */}
                  {!query && pinnedCourses.length > 0 && (
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-amber-500 mb-2 px-2 flex items-center gap-1.5">
                        <Star className="w-3 h-3 fill-amber-400" /> Pinned
                      </p>
                      <div className="space-y-1">
                        {pinnedCourses.map(course => (
                          <button
                            key={course.slug}
                            onClick={() => handleSelect(course.slug)}
                            className="w-full text-left flex items-center gap-3 px-4 py-3 rounded-2xl bg-amber-500/5 border border-amber-500/15 hover:bg-amber-500/10 transition-colors group"
                          >
                            <span className="text-lg">{course.emoji}</span>
                            <span className="text-sm font-semibold text-foreground">{course.displayName}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* All / Filtered Courses */}
                  <div>
                    {!query && <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2 px-2">All Courses</p>}
                    {filteredCourses.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-6">No courses match &quot;{query}&quot;</p>
                    ) : (
                      <div className="space-y-1">
                        {filteredCourses.map(course => (
                          <button
                            key={course.slug}
                            onClick={() => handleSelect(course.slug)}
                            className="w-full text-left flex items-center gap-3 px-4 py-3 rounded-2xl hover:bg-surface transition-colors group"
                          >
                            <span className="text-lg">{course.emoji}</span>
                            <span className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">{course.displayName}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
