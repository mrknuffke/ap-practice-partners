"use client";

/**
 * Intelligent Speech Synthesis & Audio Engine for AP Practice Partners.
 *
 * Provides:
 * 1. Smart neural/natural voice detection and ranking (Apple, Google, Microsoft Natural voices)
 * 2. Pedagogical speech text normalization (cleans Markdown, KaTeX, chemical formulas, and tags)
 * 3. Sentence-chunked utterance coordinator to bypass browser speech synthesis timeouts
 * 4. LocalStorage persistence for user preferences (voice choice, speed, auto-speak)
 */

export interface VoicePreference {
  voiceURI: string;
  rate: number;
  autoSpeak: boolean;
}

const STORAGE_KEY_VOICE = "ap_tutor_voice_uri";
const STORAGE_KEY_RATE = "ap_tutor_voice_rate";
const STORAGE_KEY_AUTOSPEAK = "ap_tutor_auto_speak";

/**
 * Normalizes Markdown, LaTeX equations, chemical formulas, and AP tags
 * into natural, fluent spoken English.
 */
export function cleanTextForSpeech(text: string): string {
  if (!text) return "";

  let cleaned = text;

  // 1. Remove tutor tag blocks (:::tag {json} :::)
  cleaned = cleaned.replace(/:::[\s\S]*?:::/g, " ");

  // 2. Remove code blocks
  cleaned = cleaned.replace(/```[\s\S]*?```/g, " Code block omitted. ");
  cleaned = cleaned.replace(/`([^`]+)`/g, "$1");

  // 3. Remove markdown links, keep text
  cleaned = cleaned.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1");

  // 4. Translate common chemical formulas
  cleaned = cleaned.replace(/\bH[2₂]O\b/g, "H-two-O");
  cleaned = cleaned.replace(/\bCO[2₂]\b/g, "C-O-two");
  cleaned = cleaned.replace(/\bO[2₂]\b/g, "O-two");
  cleaned = cleaned.replace(/\bN[2₂]\b/g, "N-two");
  cleaned = cleaned.replace(/\bCH[4₄]\b/g, "C-H-four");
  cleaned = cleaned.replace(/\bC[6₆]H[1₁][2₂]O[6₆]\b/g, "glucose");

  // 5. Translate common AP science & math symbols
  cleaned = cleaned.replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, "$1 over $2");
  cleaned = cleaned.replace(/\\sqrt\{([^}]+)\}/g, "square root of $1");
  cleaned = cleaned.replace(/\\(?:Delta|delta|Δ)/g, "delta");
  cleaned = cleaned.replace(/\\(?:alpha|α)/g, "alpha");
  cleaned = cleaned.replace(/\\(?:beta|β)/g, "beta");
  cleaned = cleaned.replace(/\\(?:pi|π)/g, "pie");
  cleaned = cleaned.replace(/\\(?:theta|θ)/g, "theta");
  cleaned = cleaned.replace(/\\(?:lambda|λ)/g, "lambda");
  cleaned = cleaned.replace(/\\(?:approx|≈)/g, "approximately");
  cleaned = cleaned.replace(/\\(?:pm|±)/g, "plus or minus");
  cleaned = cleaned.replace(/\\(?:times|×)/g, "times");
  cleaned = cleaned.replace(/\\(?:cdot|·)/g, "times");
  cleaned = cleaned.replace(/\\(?:le|leq|≤)/g, "less than or equal to");
  cleaned = cleaned.replace(/\\(?:ge|geq|≥)/g, "greater than or equal to");
  cleaned = cleaned.replace(/\\(?:ne|neq|≠)/g, "is not equal to");
  cleaned = cleaned.replace(/\\(?:to|rightarrow|->|→)/g, "yields");

  // Superscripts & exponents
  cleaned = cleaned.replace(/([a-zA-Z0-9]+)\^2\b/g, "$1 squared");
  cleaned = cleaned.replace(/([a-zA-Z0-9]+)\^3\b/g, "$1 cubed");
  cleaned = cleaned.replace(/([a-zA-Z0-9]+)\^([0-9]+)/g, "$1 to the power of $2");

  // Subscripts
  cleaned = cleaned.replace(/([A-Za-z]+)_\{?([0-9A-Za-z]+)\}?/g, "$1 sub $2");

  // LaTeX text commands
  cleaned = cleaned.replace(/\\(?:text|mathbf|mathrm|mathit)\{([^}]+)\}/g, "$1");

  // Strip math delimiters: $$...$$, $...$
  cleaned = cleaned.replace(/\$\$([\s\S]*?)\$\$/g, "$1");
  cleaned = cleaned.replace(/\$([^$]+)\$/g, "$1");

  // 6. Clean markdown headers and structural formatting
  cleaned = cleaned.replace(/^#{1,6}\s+/gm, "");
  cleaned = cleaned.replace(/---/g, ". ");
  cleaned = cleaned.replace(/\*\*(.*?)\*\*/g, "$1");
  cleaned = cleaned.replace(/\*(.*?)\*/g, "$1");
  cleaned = cleaned.replace(/__(.*?)__/g, "$1");
  cleaned = cleaned.replace(/_(.*?)_/g, "$1");
  cleaned = cleaned.replace(/~~(.*?)~~/g, "$1");
  cleaned = cleaned.replace(/^>\s+/gm, "");

  // Bullet points and list numbers to natural breath pauses
  cleaned = cleaned.replace(/^[-*•]\s+/gm, ". ");
  cleaned = cleaned.replace(/^\d+\.\s+/gm, ". ");

  // Remove leftover backslashes and braces
  cleaned = cleaned.replace(/[\\{}]/g, " ");

  // Collapse multiple punctuation and whitespace
  cleaned = cleaned.replace(/\.{2,}/g, ".");
  cleaned = cleaned.replace(/\s+/g, " ").trim();

  return cleaned;
}

/**
 * Score a voice for natural conversational quality.
 * Higher score = more natural and human-sounding.
 */
function scoreVoice(voice: SpeechSynthesisVoice): number {
  let score = 0;
  const name = voice.name.toLowerCase();
  const lang = voice.lang.toLowerCase();

  // English preference
  if (lang.startsWith("en-us")) score += 40;
  else if (lang.startsWith("en")) score += 30;
  else return -100; // Skip non-English for standard tutor

  // High-fidelity neural / online indicators
  if (name.includes("natural")) score += 60;
  if (name.includes("neural")) score += 60;
  if (name.includes("online")) score += 30;
  if (name.includes("enhanced")) score += 50;
  if (name.includes("premium")) score += 40;
  if (name.includes("siri")) score += 50;

  // Well-known high quality voices
  if (name.includes("google us english")) score += 45;
  if (name.includes("samantha")) score += 25;
  if (name.includes("ava") || name.includes("zoe") || name.includes("evan")) score += 35;
  if (name.includes("jenny") || name.includes("guy") || name.includes("aria")) score += 35;
  if (name.includes("daniel") || name.includes("karen")) score += 20;

  // Penalize robotic system defaults
  if (name.includes("fred") || name.includes("albert") || name.includes("bad news")) score -= 80;
  if (name.includes("junior") || name.includes("zarvox") || name.includes("whisper")) score -= 80;

  return score;
}

/**
 * Retrieves all available SpeechSynthesis voices.
 */
export function getAvailableVoices(): SpeechSynthesisVoice[] {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) {
    return [];
  }
  return window.speechSynthesis.getVoices();
}

/**
 * Selects the optimal natural voice available on the device,
 * respecting user preference if stored.
 */
export function getBestVoice(preferredURI?: string | null): SpeechSynthesisVoice | null {
  const voices = getAvailableVoices();
  if (voices.length === 0) return null;

  // 1. User preferred voice if found
  if (preferredURI) {
    const matched = voices.find(v => v.voiceURI === preferredURI || v.name === preferredURI);
    if (matched) return matched;
  }

  // 2. Rank available English voices
  const englishVoices = voices
    .filter(v => v.lang.toLowerCase().startsWith("en"))
    .sort((a, b) => scoreVoice(b) - scoreVoice(a));

  if (englishVoices.length > 0 && scoreVoice(englishVoices[0]) > 0) {
    return englishVoices[0];
  }

  // 3. Fallback to default browser voice
  const defaultVoice = voices.find(v => v.default);
  return defaultVoice || voices[0] || null;
}

/**
 * Break long text into sentence chunks (max ~180 chars) to prevent
 * Chromium/WebKit speech engine buffer limits and pause freezes.
 */
function chunkTextIntoSentences(text: string, maxLen = 180): string[] {
  const rawSentences = text.match(/[^.!?\n]+[.!?\n]+|[^.!?\n]+$/g) || [text];
  const chunks: string[] = [];
  let current = "";

  for (const sentence of rawSentences) {
    const trimmed = sentence.trim();
    if (!trimmed) continue;

    if ((current + " " + trimmed).trim().length <= maxLen) {
      current = current ? `${current} ${trimmed}` : trimmed;
    } else {
      if (current) chunks.push(current);
      if (trimmed.length > maxLen) {
        // Break long single sentence by clauses / commas
        const clauses = trimmed.split(/,\s+/);
        let sub = "";
        for (const cl of clauses) {
          if ((sub + ", " + cl).trim().length <= maxLen) {
            sub = sub ? `${sub}, ${cl}` : cl;
          } else {
            if (sub) chunks.push(sub);
            sub = cl;
          }
        }
        if (sub) current = sub;
        else current = "";
      } else {
        current = trimmed;
      }
    }
  }

  if (current) chunks.push(current);
  return chunks;
}

class SpeechController {
  private activeId: string | null = null;
  private isSpeakingState = false;
  private listeners = new Set<(activeId: string | null, isSpeaking: boolean) => void>();
  private currentChunks: string[] = [];
  private chunkIndex = 0;
  private currentVoice: SpeechSynthesisVoice | null = null;
  private currentRate = 1.0;

  constructor() {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      // Ensure voices load
      window.speechSynthesis.onvoiceschanged = () => {
        // Voices loaded
      };
    }
  }

  subscribe(listener: (activeId: string | null, isSpeaking: boolean) => void): () => void {
    this.listeners.add(listener);
    listener(this.activeId, this.isSpeakingState);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    this.listeners.forEach(l => l(this.activeId, this.isSpeakingState));
  }

  public getActiveId(): string | null {
    return this.activeId;
  }

  public isSpeaking(): boolean {
    return this.isSpeakingState;
  }

  public stop() {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    this.activeId = null;
    this.isSpeakingState = false;
    this.currentChunks = [];
    this.chunkIndex = 0;
    this.notify();
  }

  public speak(id: string, rawText: string, options?: { voiceURI?: string; rate?: number }) {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;

    // Toggle off if currently speaking this exact message
    if (this.activeId === id && this.isSpeakingState) {
      this.stop();
      return;
    }

    this.stop();

    const cleaned = cleanTextForSpeech(rawText);
    if (!cleaned.trim()) return;

    this.activeId = id;
    this.isSpeakingState = true;
    this.currentChunks = chunkTextIntoSentences(cleaned);
    this.chunkIndex = 0;

    const savedVoiceURI = options?.voiceURI || localStorage.getItem(STORAGE_KEY_VOICE);
    const savedRateStr = options?.rate?.toString() || localStorage.getItem(STORAGE_KEY_RATE);
    this.currentRate = savedRateStr ? parseFloat(savedRateStr) : 1.0;
    this.currentVoice = getBestVoice(savedVoiceURI);

    this.notify();
    this.playNextChunk();
  }

  private playNextChunk() {
    if (!this.isSpeakingState || this.chunkIndex >= this.currentChunks.length) {
      this.stop();
      return;
    }

    const chunk = this.currentChunks[this.chunkIndex];
    this.chunkIndex++;

    const utterance = new SpeechSynthesisUtterance(chunk);
    if (this.currentVoice) {
      utterance.voice = this.currentVoice;
    }
    utterance.rate = this.currentRate;
    utterance.pitch = 1.0;

    utterance.onend = () => {
      if (this.isSpeakingState) {
        this.playNextChunk();
      }
    };

    utterance.onerror = (e) => {
      // Ignore normal cancel/interrupted
      if (e.error !== "canceled" && e.error !== "interrupted") {
        console.warn("Speech synthesis error:", e.error);
      }
      this.stop();
    };

    try {
      window.speechSynthesis.speak(utterance);
    } catch (err) {
      console.error("Failed to speak utterance", err);
      this.stop();
    }
  }
}

// Global singleton instance
export const speechController = new SpeechController();

export function getStoredAutoSpeak(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(STORAGE_KEY_AUTOSPEAK) === "true";
}

export function setStoredAutoSpeak(enabled: boolean) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY_AUTOSPEAK, enabled ? "true" : "false");
}

export function getStoredVoiceURI(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(STORAGE_KEY_VOICE);
}

export function setStoredVoiceURI(uri: string) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY_VOICE, uri);
}

export function getStoredRate(): number {
  if (typeof window === "undefined") return 1.0;
  const val = localStorage.getItem(STORAGE_KEY_RATE);
  return val ? parseFloat(val) : 1.0;
}

export function setStoredRate(rate: number) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY_RATE, rate.toString());
}
