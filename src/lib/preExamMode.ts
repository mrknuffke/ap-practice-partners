import { AP_EXAM_DATES_2026 } from "@/constants/examDates";

function examDateKey(slug: string, examParam?: string | null): string {
  // Physics C has two separate exam dates keyed by variant
  if (slug === "ap-physics-c" && examParam) return `ap-physics-c-${examParam}`;
  return slug;
}

function getExamDate(slug: string, examParam?: string | null): Date | null {
  const key = examDateKey(slug, examParam);
  const dateStr = AP_EXAM_DATES_2026[key];
  if (!dateStr) return null;
  // Parse as local midnight to avoid timezone shifts
  return new Date(`${dateStr}T00:00:00`);
}

// True if now is within the 24h window before the exam (day-before or exam day itself)
export function isPreExamMode(slug: string, examParam?: string | null): boolean {
  const examDate = getExamDate(slug, examParam);
  if (!examDate) return false;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const msPerDay = 24 * 60 * 60 * 1000;
  const diffDays = Math.round((examDate.getTime() - today.getTime()) / msPerDay);

  return diffDays === 0 || diffDays === 1;
}

// Returns a formatted date string for display, e.g. "Monday, May 11"
export function getExamDateLabel(slug: string, examParam?: string | null): string {
  const examDate = getExamDate(slug, examParam);
  if (!examDate) return "";
  return examDate.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
}

function sessionStorageKey(slug: string, examParam?: string | null): string {
  return `ap_preexam_sessions_${slug}_${examParam ?? "default"}`;
}

// Returns the number of sessions opened in the pre-exam window.
// Resets to 0 after the exam date has passed.
export function getPreExamSessionCount(slug: string, examParam?: string | null): number {
  if (typeof window === "undefined") return 0;
  const examDate = getExamDate(slug, examParam);
  if (examDate) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (today > examDate) {
      localStorage.removeItem(sessionStorageKey(slug, examParam));
      return 0;
    }
  }
  const stored = localStorage.getItem(sessionStorageKey(slug, examParam));
  if (!stored) return 0;
  try {
    const { count } = JSON.parse(stored);
    return typeof count === "number" ? count : 0;
  } catch {
    return 0;
  }
}

// Increments the session counter and returns the new count.
export function incrementPreExamSession(slug: string, examParam?: string | null): number {
  if (typeof window === "undefined") return 1;
  const current = getPreExamSessionCount(slug, examParam);
  const newCount = current + 1;
  localStorage.setItem(sessionStorageKey(slug, examParam), JSON.stringify({ count: newCount }));
  return newCount;
}
