"use client";

import { useState } from "react";
import { Trophy, BookOpen, Mic, FileText, FileSearch, Star } from "lucide-react";
import { aggregateDashboardMetrics, type MetricData, type Win } from "@/lib/metrics";

const TYPE_ICONS: Record<string, React.ReactNode> = {
  MCQ:        <BookOpen className="w-5 h-5" />,
  FRQ:        <FileText className="w-5 h-5" />,
  "Source/DBQ": <FileSearch className="w-5 h-5" />,
  Oral:       <Mic className="w-5 h-5" />,
};

const TYPE_COLORS: Record<string, string> = {
  MCQ:          "bg-blue-500/20 text-blue-600 dark:text-blue-300",
  FRQ:          "bg-violet-500/20 text-violet-600 dark:text-violet-300",
  "Source/DBQ": "bg-amber-500/20 text-amber-600 dark:text-amber-300",
  Oral:         "bg-red-500/20 text-red-500 dark:text-red-300",
};

function WinCard({ win }: { win: Win }) {
  const icon = TYPE_ICONS[win.type] ?? <Star className="w-5 h-5" />;
  const color = TYPE_COLORS[win.type] ?? "bg-primary/20 text-primary";

  return (
    <div className="bg-surface-high rounded-2xl flex items-center gap-5 p-5 border border-transparent shadow-sm hover:shadow-md transition-shadow">
      <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${color}`}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-foreground text-sm truncate">{win.courseName}</p>
        <p className="text-muted-foreground text-xs truncate">{win.type} — {win.topic}</p>
      </div>
      {win.scoreString && (
        <span className="shrink-0 text-sm font-bold text-foreground bg-surface rounded-full px-3 py-1">
          {win.scoreString}
        </span>
      )}
    </div>
  );
}

export default function ProgressPage() {
  const [metrics] = useState<MetricData | null>(() =>
    typeof window !== "undefined" ? aggregateDashboardMetrics() : null
  );

  const wins = metrics?.recentWins ?? [];
  const totalSessions = metrics?.totalSessions ?? 0;
  const currentFocus = metrics?.currentFocus;

  const byType = wins.reduce<Record<string, number>>((acc, w) => {
    acc[w.type] = (acc[w.type] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-background text-foreground font-sans px-8 py-10 relative">
      {/* Ambient background */}
      <div className="fixed top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-primary/5 blur-[160px] pointer-events-none" />

      <header className="mb-12 relative z-10">
        <h1 className="text-4xl font-heading font-semibold italic text-foreground mb-2">Your Progress</h1>
        <p className="text-muted-foreground text-sm">A record of your accomplishments — every practice counts.</p>
      </header>

      {/* Stats Row */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-12 relative z-10">
        <div className="bg-accent rounded-3xl p-8 flex flex-col gap-2 relative overflow-hidden shadow-sm">
          <div className="absolute -bottom-8 -right-8 w-32 h-32 bg-white/20 blur-2xl rounded-full" />
          <p className="text-[10px] font-bold uppercase tracking-widest text-accent-foreground/70">Total Sessions</p>
          <p className="text-5xl font-heading italic text-accent-foreground font-bold">{totalSessions}</p>
          <p className="text-accent-foreground/70 text-xs">focused practice sessions completed</p>
        </div>

        <div className="bg-surface-high rounded-3xl p-8 flex flex-col gap-2 shadow-sm">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Wins Earned</p>
          <p className="text-5xl font-heading italic text-foreground font-bold">{wins.length}</p>
          <p className="text-muted-foreground text-xs">high-scoring completions</p>
        </div>

        <div className="bg-surface-high rounded-3xl p-8 flex flex-col gap-2 shadow-sm">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Current Focus</p>
          {currentFocus ? (
            <>
              <p className="text-lg font-heading italic text-foreground font-semibold leading-snug">{currentFocus.courseName}</p>
              <p className="text-muted-foreground text-xs">{currentFocus.topic}</p>
            </>
          ) : (
            <p className="text-muted-foreground text-sm italic">No sessions yet — pick a course to begin!</p>
          )}
        </div>
      </section>

      {/* Breakdown by type */}
      {Object.keys(byType).length > 0 && (
        <section className="mb-12 relative z-10">
          <h2 className="text-xl font-heading italic font-semibold text-foreground mb-4">Wins by Practice Type</h2>
          <div className="flex flex-wrap gap-3">
            {Object.entries(byType).map(([type, count]) => (
              <div key={type} className={`flex items-center gap-3 px-5 py-3 rounded-full text-sm font-bold shadow-sm ${TYPE_COLORS[type] ?? "bg-primary/10 text-primary"}`}>
                {TYPE_ICONS[type]}
                <span>{type}: {count}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Full wins list */}
      <section className="relative z-10">
        <h2 className="text-xl font-heading italic font-semibold text-foreground mb-6">All Wins</h2>
        {wins.length === 0 ? (
          <div className="bg-surface-high rounded-3xl flex flex-col items-center justify-center py-20 text-muted-foreground text-center border border-transparent">
            <Trophy className="w-12 h-12 mb-4 opacity-30" />
            <p className="font-semibold text-base mb-1">No wins yet</p>
            <p className="text-sm">Complete MCQ, FRQ, DBQ, or Oral practice sessions with a score above 75% to earn wins.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {wins.map((win, idx) => (
              <WinCard key={win.id || idx} win={win} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
