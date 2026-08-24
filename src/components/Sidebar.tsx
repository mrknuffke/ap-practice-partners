"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  BookOpen, BarChart3, Info, Book, GraduationCap,
  MessageSquare, Settings, Search, Star, X, Zap,
  PanelLeftClose, PanelLeftOpen, type LucideIcon
} from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { storageGet } from "@/lib/utils";
import { useCollapsiblePanel } from "@/lib/useCollapsiblePanel";
import { useState, useEffect, useRef } from "react";
import { COURSES } from "@/constants/courses";
import { AnimatePresence, motion } from "framer-motion";

function NavRow({ href, icon: Icon, label, active, collapsed, badge, className = "" }: {
  href: string;
  icon: LucideIcon;
  label: string;
  active?: boolean;
  collapsed: boolean;
  badge?: boolean;
  className?: string;
}) {
  return (
    <Link
      href={href}
      title={collapsed ? label : undefined}
      aria-label={collapsed ? label : undefined}
      className={`flex items-center transition-all group ${
        collapsed
          ? "w-10 h-10 mx-auto justify-center rounded-full"
          : `gap-4 px-6 py-3 rounded-full ${className}`
      } ${
        active
          ? "bg-surface-highest text-foreground shadow-sm"
          : "text-muted-foreground hover:bg-surface-high hover:text-foreground"
      }`}
    >
      <span className="relative shrink-0">
        <Icon className={`w-5 h-5 ${active ? "text-primary" : ""}`} />
        {badge && collapsed && (
          <span className="absolute -top-0.5 -right-0.5 flex w-2 h-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
            <span className="relative inline-flex rounded-full w-2 h-2 bg-primary"></span>
          </span>
        )}
      </span>
      {!collapsed && <span className="font-medium flex-1">{label}</span>}
      {!collapsed && badge && (
        <span className="relative flex w-2 h-2 ml-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
          <span className="relative inline-flex rounded-full w-2 h-2 bg-primary"></span>
        </span>
      )}
    </Link>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [studentName, setStudentName] = useState("Scholar");
  const [showModal, setShowModal] = useState(false);
  const [query, setQuery] = useState("");
  const [starredSlugs, setStarredSlugs] = useState<string[]>([]);
  const [hasSeenTutorial, setHasSeenTutorial] = useState(true);
  const searchRef = useRef<HTMLInputElement>(null);
  const { collapsed, toggle, mounted } = useCollapsiblePanel("sidebar_collapsed", { shortcut: "[" });

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
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (raw) setStarredSlugs(JSON.parse(raw));
    } catch { /* ignore */ }
  }, [showModal]); // refresh starred list each time modal opens

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setHasSeenTutorial(!!storageGet("tutorial_seen"));
  }, [pathname]);

  useEffect(() => {
    if (showModal) {
      setTimeout(() => searchRef.current?.focus(), 80);
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
      // eslint-disable-next-line react-hooks/set-state-in-effect
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

  const secondaryItems = [
    { name: "Settings", href: "/settings", icon: Settings },
    { name: "About", href: "/about", icon: Info },
    { name: "Educator Guide", href: "/educator-guide", icon: Book },
    { name: "Interactive Tour", href: "/tutorial", icon: GraduationCap, badge: !hasSeenTutorial },
    { name: "Feedback", href: "/feedback", icon: MessageSquare },
  ];

  return (
    <>
      <aside
        className={`hidden md:flex flex-col h-screen py-8 gap-y-4 bg-sidebar rounded-r-3xl overflow-hidden shadow-2xl shrink-0 z-40 border-r border-sidebar-border/50 ${
          collapsed ? "w-16" : "w-72"
        } ${mounted ? "transition-[width] duration-200 ease-out motion-reduce:transition-none" : ""}`}
      >
        <div className={`mb-6 flex items-center ${collapsed ? "px-2 flex-col gap-3" : "px-8 justify-between"}`}>
          {!collapsed && (
            <span className="font-heading italic text-xl text-primary font-semibold tracking-wide whitespace-nowrap">AP Study Bots</span>
          )}
          <div className={`flex items-center ${collapsed ? "flex-col gap-3" : "gap-1"}`}>
            <ThemeToggle />
            <button
              onClick={toggle}
              aria-expanded={!collapsed}
              aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
              title={`${collapsed ? "Expand" : "Collapse"} sidebar  [`}
              className="w-9 h-9 flex items-center justify-center rounded-full text-muted-foreground hover:bg-surface-high hover:text-foreground transition-colors shrink-0"
            >
              {collapsed ? <PanelLeftOpen className="w-5 h-5" /> : <PanelLeftClose className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* User Profile */}
        <div className={`mb-8 flex items-center ${collapsed ? "px-2 justify-center" : "px-8 gap-4"}`}>
          <div
            title={collapsed ? `Welcome, ${studentName}` : undefined}
            className={`rounded-full overflow-hidden bg-surface-high flex items-center justify-center text-primary font-heading italic font-bold shrink-0 ${
              collapsed ? "w-10 h-10 text-lg" : "w-12 h-12 text-xl"
            }`}
          >
            {studentName.charAt(0).toUpperCase()}
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <p className="font-sans font-semibold tracking-wide text-sidebar-foreground text-sm truncate">Welcome, {studentName}</p>
              <p className="text-muted-foreground text-xs uppercase tracking-widest font-sans">AP Focus</p>
            </div>
          )}
        </div>

        <nav className="flex-1 space-y-1 mt-4">
          {navItems.map((item) => (
            <NavRow
              key={item.name}
              href={item.href}
              icon={item.icon}
              label={item.name}
              active={pathname === item.href}
              collapsed={collapsed}
              className="mx-4"
            />
          ))}
        </nav>

        <div className={`mt-auto space-y-2 ${collapsed ? "px-2" : "px-6"}`}>
          {/* Start Review — opens course picker modal */}
          <button
            onClick={() => setShowModal(true)}
            title={collapsed ? "Start Review" : undefined}
            aria-label={collapsed ? "Start Review" : undefined}
            className={`bg-primary text-primary-foreground font-bold mb-4 shadow-lg shadow-primary/20 hover:opacity-90 transition-opacity flex items-center justify-center gap-2 ${
              collapsed ? "w-10 h-10 mx-auto rounded-full" : "w-full py-4 rounded-xl"
            }`}
          >
            <Zap className="w-4 h-4 shrink-0" />
            {!collapsed && "Start Review"}
          </button>

          {secondaryItems.map((item) => (
            <NavRow
              key={item.name}
              href={item.href}
              icon={item.icon}
              label={item.name}
              active={pathname === item.href}
              collapsed={collapsed}
              badge={item.badge}
            />
          ))}
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
