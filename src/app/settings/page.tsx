"use client";

import { useState } from "react";
import { User, KeyRound, CheckCircle2, Trash2, LogOut } from "lucide-react";
import { storageGet, storageSet, storageClear } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";

export default function SettingsPage() {
  const [name, setName] = useState(() => storageGet("student_name") ?? "");
  const code = storageGet("classroom_code") ?? "";
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
              <h2 className="font-heading italic font-semibold text-foreground text-lg">Your Profile</h2>
              <p className="text-muted-foreground text-xs">This is how the app greets you.</p>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">First Name</label>
            <Input
              type="text"
              placeholder="Enter your first name"
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

        {/* Appearance Section */}
        <section className="bg-surface-high rounded-3xl p-8 shadow-sm">
          <h2 className="font-heading italic font-semibold text-foreground text-lg mb-1">Appearance</h2>
          <p className="text-muted-foreground text-xs mb-6">Switch between light and dark mode.</p>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-foreground">Color Theme</span>
            <ThemeToggle />
          </div>
        </section>

        {/* Classroom Code Section */}
        <section className="bg-surface-high rounded-3xl p-8 shadow-sm space-y-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center">
              <KeyRound className="w-5 h-5 text-accent-foreground" />
            </div>
            <div>
              <h2 className="font-heading italic font-semibold text-foreground text-lg">Classroom Access</h2>
              <p className="text-muted-foreground text-xs">Your current classroom code.</p>
            </div>
          </div>
          <div className="bg-surface rounded-xl px-5 py-4 text-sm font-mono text-foreground border border-border/30 tracking-widest">
            {code || "—"}
          </div>
          <Button
            onClick={() => { storageClear("classroom_code"); window.location.reload(); }}
            variant="outline"
            className="w-full flex items-center justify-center gap-2 border-border text-muted-foreground hover:text-foreground hover:bg-surface rounded-xl h-11"
          >
            <LogOut className="w-4 h-4" />
            Log Out
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
