"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { BookOpen, BarChart3, Info, Book, GraduationCap, MessageSquare, Settings } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { storageGet } from "@/lib/utils";
import { useState, useEffect } from "react";

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [studentName, setStudentName] = useState("Scholar");

  useEffect(() => {
    const refresh = () => {
      const saved = storageGet("student_name");
      setStudentName(saved || "Scholar");
    };
    refresh();
    window.addEventListener("student-name-updated", refresh);
    return () => window.removeEventListener("student-name-updated", refresh);
  }, []);

  const navItems = [
    { name: "Study Room", href: "/", icon: BookOpen },
    { name: "Progress", href: "/progress", icon: BarChart3 },
  ];

  return (
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
        <button
          onClick={() => router.push("/")}
          className="w-full bg-primary text-primary-foreground py-4 rounded-xl font-bold mb-4 shadow-lg shadow-primary/20 hover:opacity-90 transition-opacity"
        >
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
        <Link
          href="/about"
          className="flex items-center gap-4 text-muted-foreground px-6 py-3 hover:bg-surface-high hover:text-foreground rounded-full transition-all"
        >
          <Info className="w-5 h-5" />
          <span className="font-medium">About</span>
        </Link>
        <Link
          href="/educator-guide"
          className="flex items-center gap-4 text-muted-foreground px-6 py-3 hover:bg-surface-high hover:text-foreground rounded-full transition-all"
        >
          <Book className="w-5 h-5" />
          <span className="font-medium">Educator Guide</span>
        </Link>
        <Link
          href="/tutorial"
          className="flex items-center gap-4 text-muted-foreground px-6 py-3 hover:bg-surface-high hover:text-foreground rounded-full transition-all"
        >
          <GraduationCap className="w-5 h-5" />
          <span className="font-medium">Tutorial</span>
        </Link>
        <Link
          href="/feedback"
          className="flex items-center gap-4 text-muted-foreground px-6 py-3 hover:bg-surface-high hover:text-foreground rounded-full transition-all"
        >
          <MessageSquare className="w-5 h-5" />
          <span className="font-medium">Feedback</span>
        </Link>
      </div>
    </aside>
  );
}
