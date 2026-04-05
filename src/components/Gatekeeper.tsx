"use client";

import React, { useState } from "react";
import { Lock, ArrowRight, Loader2 } from "lucide-react";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { storageGet, storageSet, storageClear } from "@/lib/utils";

async function validateCode(code: string): Promise<boolean> {
  try {
    const res = await fetch("/api/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export function Gatekeeper({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<"loading" | "locked" | "unlocked">("loading");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // On mount, check if a saved code is still valid
  React.useEffect(() => {
    const saved = storageGet("classroom_code");
    if (!saved) {
      setStatus("locked");
      return;
    }
    validateCode(saved).then((valid) => {
      if (valid) {
        setStatus("unlocked");
      } else {
        storageClear("classroom_code");
        setStatus("locked");
      }
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = code.trim();
    if (!trimmed) return;

    setSubmitting(true);
    setError("");

    const valid = await validateCode(trimmed);
    if (valid) {
      storageSet("classroom_code", trimmed);
      setStatus("unlocked");
    } else {
      setError("Invalid classroom code. Please try again.");
    }
    setSubmitting(false);
  };

  if (status === "loading") return null;

  if (status === "unlocked") {
    return <>{children}</>;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-950 font-sans">
      <div className="absolute top-0 left-[-10%] w-[40%] h-[40%] rounded-full bg-blue-600/10 blur-[120px]" />
      <div className="absolute bottom-0 right-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-600/10 blur-[120px]" />

      <div className="z-10 bg-neutral-900/60 backdrop-blur-xl border border-neutral-800 p-8 rounded-3xl shadow-2xl w-full max-w-md flex flex-col items-center">
        <div className="w-16 h-16 bg-neutral-800 rounded-2xl flex items-center justify-center mb-6 border border-neutral-700 shadow-inner">
          <Lock className="w-8 h-8 text-blue-400" />
        </div>

        <h2 className="text-2xl font-bold text-white mb-2">Classroom Access</h2>
        <p className="text-neutral-400 text-center mb-8">
          Please enter your classroom code to access the AP Review Bots.
        </p>

        <form onSubmit={handleSubmit} className="w-full flex flex-col gap-2">
          <div className="flex gap-2">
            <Input
              type="text"
              placeholder="Classroom Code"
              className="bg-neutral-950 border-neutral-700 text-lg h-12"
              value={code}
              onChange={(e) => { setCode(e.target.value); setError(""); }}
              autoFocus
              disabled={submitting}
            />
            <Button type="submit" className="h-12 bg-blue-600 hover:bg-blue-500 rounded-lg" disabled={submitting}>
              {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <ArrowRight className="w-5 h-5" />}
            </Button>
          </div>
          {error && <p className="text-red-400 text-sm text-center">{error}</p>}
        </form>
      </div>
    </div>
  );
}
