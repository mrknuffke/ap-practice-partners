import { storageGet } from './utils';

export interface Win {
  id: string;
  courseName: string;
  topic: string;
  type: string; 
  scoreString: string;
  timestamp: number;
}

export interface MetricData {
  totalSessions: number;
  currentFocus: { courseName: string, topic: string } | null;
  recentWins: Win[];
}

function slugToCourseName(key: string): string {
  // key = "ap_tutor_ap-biology_default"
  const withoutPrefix = key.replace("ap_tutor_", "");
  // withoutPrefix = "ap-biology_default" or "ap-calculus-ab-bc_ab"
  // Split on _ then take everything up to the last segment (examParam or "default")
  const parts = withoutPrefix.split("_");
  const slug = parts.slice(0, parts.length - 1).join("_"); // handle slugs with no underscores
  // slug might be "ap-biology"
  return slug
    .replace(/^ap-/, "AP ")
    .split("-")
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function getMessageTimestamp(msg: any): number {
  if (!msg?.id) return 0;
  const ts = parseInt(msg.id, 10);
  return isNaN(ts) ? 0 : ts;
}

export function aggregateDashboardMetrics(): MetricData {
  let totalSessions = 0;
  let currentFocus: { courseName: string, topic: string } | null = null;
  let latestActivityTimestamp = 0;
  const wins: Win[] = [];

  if (typeof window === "undefined") {
    return { totalSessions, currentFocus, recentWins: wins };
  }

  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key || !key.startsWith("ap_tutor_")) continue;

      const raw = localStorage.getItem(key);
      if (!raw) continue;

      let messages: any[];
      try {
        messages = JSON.parse(raw);
        if (!Array.isArray(messages) || messages.length === 0) continue;
      } catch { continue; }

      const courseName = slugToCourseName(key);

      // Track most recent activity across ALL messages (not just completions)
      const lastMsg = messages[messages.length - 1];
      const lastTs = getMessageTimestamp(lastMsg);
      if (lastTs > latestActivityTimestamp) {
        latestActivityTimestamp = lastTs;
        // Find last meaningful user message for the topic label
        const lastUserMsg = [...messages].reverse().find(
          m => m.role === "user" && m.content && !m.content.startsWith("Completed ")
        );
        const topic = lastUserMsg
          ? lastUserMsg.content.slice(0, 60) + (lastUserMsg.content.length > 60 ? "…" : "")
          : "Recent session";
        currentFocus = { courseName, topic };
      }

      // Count completions + wins (existing logic)
      messages.forEach((msg, idx) => {
        if (msg.role !== "user" || !msg.content) return;

        const isMcq    = msg.content.includes("Completed Unit ");
        const isFrq    = msg.content.includes("Completed FRQ on");
        const isSource = msg.content.includes("Completed Source/DBQ on");
        const isOral   = msg.content.includes("Completed Oral Practice on");

        if (!isMcq && !isFrq && !isSource && !isOral) return;

        totalSessions += 1;

        const scoreMatch = msg.content.match(/Score:\s*(\d+)\/(\d+)/i);
        let isWin = false;
        let scoreStr = "";
        if (scoreMatch) {
          const earned = parseInt(scoreMatch[1], 10);
          const max    = parseInt(scoreMatch[2], 10);
          scoreStr = `${earned}/${max}`;
          if (max > 0 && earned / max >= 0.75) isWin = true;
          if (isSource && earned >= 4) isWin = true;
          if (isOral   && earned >= 4) isWin = true;
        }

        let type = "Practice";
        let topic = "General Review";
        if (isMcq) {
          type = "MCQ";
          const m = msg.content.match(/Completed Unit\s+([^\s]+)\s+MCQ/i);
          if (m) topic = "Unit " + m[1];
        } else if (isFrq) {
          type = "FRQ";
          const m = msg.content.match(/Completed FRQ on\s+"([^"]+)"/i);
          if (m) topic = m[1];
        } else if (isSource) {
          type = "Source/DBQ";
          const m = msg.content.match(/Completed Source\/DBQ on\s+"([^"]+)"/i);
          if (m) topic = m[1];
        } else if (isOral) {
          type = "Oral";
          const m = msg.content.match(/Completed Oral Practice on\s+"([^"]+)"/i);
          if (m) topic = m[1];
        }

        if (isWin) {
          wins.push({
            id: msg.id || `${key}-${idx}`,
            courseName,
            topic,
            type,
            scoreString: scoreStr,
            timestamp: getMessageTimestamp(msg),
          });
        }
      });
    }
  } catch (e) {
    console.error("Failed to aggregate metrics", e);
  }

  wins.sort((a, b) => b.timestamp - a.timestamp);
  return { totalSessions, currentFocus, recentWins: wins.slice(0, 5) };
}
