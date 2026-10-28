"use client";

import { useState } from "react";
import { User, ShieldCheck, CheckCircle2, Trash2, LogOut, Volume2, Play, Square, Sparkles, GraduationCap, Brain } from "lucide-react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { storageGet, storageSet, storageClear } from "@/lib/utils";
import { signOutAndForgetName } from "@/lib/sign-out";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useTutorSpeech } from "@/lib/useTutorSpeech";

export default function SettingsPage() {
  const { data: session } = useSession();
  const [name, setName] = useState(() => storageGet("student_name") ?? session?.user?.name?.split(" ")[0] ?? "");
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    if (name.trim()) {
      storageSet("student_name", name.trim());
      window.dispatchEvent(new Event("student-name-updated"));
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const handleClearSession = () => {
    if (confirm("This will clear ALL your saved session history and wins data. Are you sure?")) {
      const keys: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith("ap_tutor_")) keys.push(k);
      }
      keys.forEach(k => storageClear(k));
      alert("Session history cleared.");
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground font-sans px-8 py-10 relative">
      <div className="fixed top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-primary/5 blur-[160px] pointer-events-none" />

      <header className="mb-12 relative z-10">
        <h1 className="text-4xl font-heading font-semibold italic text-foreground mb-2">Settings</h1>
        <p className="text-muted-foreground text-sm">Manage your preferences and account details.</p>
      </header>

      <div className="max-w-xl relative z-10 space-y-8">

        {/* Profile Section */}
        <section className="bg-surface-high rounded-3xl p-8 shadow-sm space-y-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
              <User className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="font-heading italic font-semibold text-foreground text-lg">Preferred Name</h2>
              <p className="text-muted-foreground text-xs">This is how the app greets you.</p>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">First / Preferred Name</label>
            <Input
              type="text"
              placeholder="Enter your preferred name"
              value={name}
              onChange={e => setName(e.target.value)}
              className="bg-surface border-border h-12 text-base rounded-xl"
            />
          </div>

          <Button
            onClick={handleSave}
            className="w-full h-12 rounded-xl bg-primary text-primary-foreground font-bold hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
          >
            {saved ? (
              <>
                <CheckCircle2 className="w-5 h-5" />
                Saved!
              </>
            ) : (
              "Save Profile"
            )}
          </Button>
        </section>

        <RoleSection />

        {/* Appearance Section */}
        <section className="bg-surface-high rounded-3xl p-8 shadow-sm">
          <h2 className="font-heading italic font-semibold text-foreground text-lg mb-1">Appearance</h2>
          <p className="text-muted-foreground text-xs mb-6">Switch between light and dark mode.</p>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-foreground">Color Theme</span>
            <ThemeToggle />
          </div>
        </section>

        {/* Voice & Audio Section */}
        <VoiceSettingsSection />

        {/* Account Section */}
        <section className="bg-surface-high rounded-3xl p-8 shadow-sm space-y-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-accent-foreground" />
            </div>
            <div>
              <h2 className="font-heading italic font-semibold text-foreground text-lg">Google Account</h2>
              <p className="text-muted-foreground text-xs">Your authenticated school account.</p>
            </div>
          </div>

          <p className="text-muted-foreground text-xs">
            Sign out when you finish on a shared computer. Your preferred name is cleared; your history stays on this computer.
          </p>

          <div className="bg-surface rounded-xl px-5 py-4 text-sm text-foreground border border-border/30 space-y-1">
            <div className="font-medium">{session?.user?.name || "Signed In"}</div>
            <div className="text-muted-foreground text-xs font-mono">{session?.user?.email || "—"}</div>
          </div>

          <Button
            onClick={() => signOutAndForgetName()}
            variant="outline"
            className="w-full flex items-center justify-center gap-2 border-border text-muted-foreground hover:text-foreground hover:bg-surface rounded-xl h-11"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </Button>
        </section>

        {/* Danger Zone */}
        <section className="bg-surface-high rounded-3xl p-8 shadow-sm space-y-4 border border-destructive/20">
          <h2 className="font-heading italic font-semibold text-destructive text-lg">Danger Zone</h2>
          <p className="text-muted-foreground text-sm">Clear all your saved session history and wins. This cannot be undone.</p>
          <Button
            onClick={handleClearSession}
            variant="outline"
            className="flex items-center gap-2 border-destructive/50 text-destructive hover:bg-destructive/10 rounded-xl h-11"
          >
            <Trash2 className="w-4 h-4" />
            Clear All Session History
          </Button>
        </section>
      </div>
    </div>
  );
}

function VoiceSettingsSection() {
  const {
    voices,
    selectedVoiceURI,
    selectVoice,
    rate,
    changeRate,
    autoSpeak,
    toggleAutoSpeak,
    speak,
    stop,
    isSpeaking,
    activeId,
  } = useTutorSpeech();

  const isTesting = isSpeaking && activeId === "test-voice-preview";

  const handleTestVoice = () => {
    if (isTesting) {
      stop();
    } else {
      speak(
        "test-voice-preview",
        "Hi! I'm your AP practice partner. Let's work together to master your exam topics."
      );
    }
  };

  const englishVoices = voices.filter(v => v.lang.toLowerCase().startsWith("en"));

  return (
    <section className="bg-surface-high rounded-3xl p-8 shadow-sm space-y-6">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
          <Volume2 className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h2 className="font-heading italic font-semibold text-foreground text-lg">Voice & Spoken Audio</h2>
          <p className="text-muted-foreground text-xs">Configure natural spoken voice for tutor responses.</p>
        </div>
      </div>

      {/* Voice Selection */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
            Tutor Voice
          </label>
          <span className="text-[11px] text-primary font-medium flex items-center gap-1">
            <Sparkles className="w-3 h-3" />
            Natural browser voices
          </span>
        </div>

        {englishVoices.length === 0 ? (
          <p className="text-xs text-muted-foreground italic">
            Using system default voice. Your browser is loading voice options.
          </p>
        ) : (
          <select
            value={selectedVoiceURI || ""}
            onChange={e => selectVoice(e.target.value)}
            className="w-full h-12 px-3 rounded-xl bg-surface border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
          >
            <option value="">Recommended Best Natural Voice (Automatic)</option>
            {englishVoices.map(v => {
              const isNatural =
                v.name.toLowerCase().includes("natural") ||
                v.name.toLowerCase().includes("enhanced") ||
                v.name.toLowerCase().includes("siri") ||
                v.name.toLowerCase().includes("neural") ||
                v.name.toLowerCase().includes("google");
              return (
                <option key={v.voiceURI || v.name} value={v.voiceURI || v.name}>
                  {v.name} ({v.lang}) {isNatural ? "⭐ (High Quality)" : ""}
                </option>
              );
            })}
          </select>
        )}
      </div>

      {/* Test Voice and Speaking Speed */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
            Test Voice
          </label>
          <Button
            type="button"
            variant="outline"
            onClick={handleTestVoice}
            className={`w-full h-11 rounded-xl text-sm font-medium flex items-center justify-center gap-2 border-border transition-all ${
              isTesting ? "bg-primary text-primary-foreground border-primary" : "hover:bg-surface"
            }`}
          >
            {isTesting ? (
              <>
                <Square className="w-4 h-4 fill-current" />
                Stop Preview
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-current" />
                Play Sample Voice
              </>
            )}
          </Button>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
              Speech Speed
            </label>
            <span className="text-xs font-mono font-medium text-primary">{rate.toFixed(1)}x</span>
          </div>
          <div className="flex items-center gap-3 h-11">
            <input
              type="range"
              min="0.8"
              max="1.4"
              step="0.1"
              value={rate}
              onChange={e => changeRate(parseFloat(e.target.value))}
              className="w-full accent-primary h-2 bg-surface rounded-lg cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* Hands-Free Auto-Speak Toggle */}
      <div className="pt-2 border-t border-border/40 flex items-center justify-between">
        <div>
          <span className="block text-sm font-medium text-foreground">Hands-Free Auto-Speak</span>
          <span className="block text-xs text-muted-foreground">
            Automatically read AI tutor replies aloud when they finish
          </span>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={autoSpeak}
          onClick={toggleAutoSpeak}
          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
            autoSpeak ? "bg-primary" : "bg-muted"
          }`}
        >
          <span
            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
              autoSpeak ? "translate-x-5" : "translate-x-0"
            }`}
          />
        </button>
      </div>
    </section>
  );
}

type AppRole = "student" | "educator";

const ROLE_OPTIONS: { id: AppRole; label: string; icon: typeof Brain; orientation: string; doneKey: string }[] = [
  { id: "student", label: "Student", icon: Brain, orientation: "/student-orientation", doneKey: "app:student-orientation-complete" },
  { id: "educator", label: "Educator", icon: GraduationCap, orientation: "/educator-training", doneKey: "app:educator-training-complete" },
];

function RoleSection() {
  const router = useRouter();
  const [role, setRole] = useState<AppRole | null>(() => {
    const saved = storageGet("app:role");
    return saved === "student" || saved === "educator" ? saved : null;
  });

  const choose = (option: (typeof ROLE_OPTIONS)[number]) => {
    if (option.id === role) return;
    storageSet("app:role", option.id);
    setRole(option.id);
    // First switch to a role: go straight to its orientation, which the
    // first-visit gate would otherwise force on the next page anyway.
    if (storageGet(option.doneKey) !== "true") router.push(option.orientation);
  };

  return (
    <section className="bg-surface-high rounded-3xl p-8 shadow-sm space-y-6">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
          <GraduationCap className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h2 id="role-heading" className="font-heading italic font-semibold text-foreground text-lg">Role</h2>
          <p className="text-muted-foreground text-xs">Picks the orientation and guide you see.</p>
        </div>
      </div>

      <div role="radiogroup" aria-labelledby="role-heading" className="grid grid-cols-2 gap-3">
        {ROLE_OPTIONS.map(option => {
          const selected = role === option.id;
          const Icon = option.icon;
          return (
            <button
              key={option.id}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => choose(option)}
              className={`h-12 rounded-xl border flex items-center justify-center gap-2 text-sm font-bold transition-colors ${
                selected
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border bg-surface text-muted-foreground hover:text-foreground hover:border-primary/40"
              }`}
            >
              <Icon className="w-4 h-4" />
              {option.label}
            </button>
          );
        })}
      </div>

      <p className="text-muted-foreground text-xs">
        The first time you switch, the short orientation for that role opens.
      </p>
    </section>
  );
}
