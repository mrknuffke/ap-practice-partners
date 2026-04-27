"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, BarChart3, Brain, Settings, User } from "lucide-react";

const HIDDEN_ROUTES = ["/welcome", "/student-orientation", "/educator-training"];

export function MobileNav() {
  const pathname = usePathname();

  if (HIDDEN_ROUTES.some((p) => pathname === p || pathname.startsWith(p + "/"))) {
    return null;
  }

  const navItems = [
    { name: "Study", href: "/", icon: BookOpen },
    { name: "Progress", href: "/progress", icon: BarChart3 },
  ];
  const postNavItems = [
    { name: "Settings", href: "/settings", icon: Settings },
    { name: "Profile", href: "/settings", icon: User },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 w-full bg-sidebar/90 backdrop-blur-xl flex justify-around items-end pb-6 pt-3 px-2 z-50 rounded-t-3xl border-t border-border/50 shadow-[0_-10px_40px_rgba(0,0,0,0.1)]">
      {navItems.map((item) => {
        const isActive = pathname === item.href;
        return (
          <Link
            key={item.name}
            href={item.href}
            className={`flex flex-col items-center gap-1.5 transition-colors ${
              isActive ? "text-primary-dim" : "text-muted-foreground"
            }`}
          >
            <item.icon className="w-5 h-5" />
            <span className="text-[10px] font-sans font-medium uppercase tracking-wider">{item.name}</span>
          </Link>
        );
      })}

      {/* Central Coach Action */}
      <Link
        href="/coach"
        className="flex flex-col items-center gap-1.5 text-primary -translate-y-2"
      >
        <div className="p-3 bg-primary-dim/20 rounded-2xl border border-primary-dim/30 shadow-lg shadow-primary-dim/20">
          <Brain className="w-6 h-6 text-primary-dim" />
        </div>
        <span className="text-[10px] font-sans font-bold uppercase tracking-wider text-primary-dim">Coach</span>
      </Link>

      {postNavItems.map((item) => {
        const isActive = pathname === item.href;
        return (
          <Link
            key={item.name}
            href={item.href}
            className={`flex flex-col items-center gap-1.5 transition-colors ${
              isActive ? "text-primary-dim" : "text-muted-foreground"
            }`}
          >
            <item.icon className="w-5 h-5" />
            <span className="text-[10px] font-sans font-medium uppercase tracking-wider">{item.name}</span>
          </Link>
        );
      })}
    </nav>
  );
}
