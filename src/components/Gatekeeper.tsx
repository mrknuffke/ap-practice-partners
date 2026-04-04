"use client";

import { useState } from "react";
import { Lock, ArrowRight } from "lucide-react";
import { Input } from "./ui/input";
import { Button } from "./ui/button";

type GatekeeperState = "loading" | "locked" | "unlocked";

export function Gatekeeper({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<GatekeeperState>(() => {
    if (typeof window === "undefined") return "loading";
    return localStorage.getItem("classroom_code") ? "unlocked" : "locked";
  });
  const [code, setCode] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (code.trim()) {
      localStorage.setItem("classroom_code", code.trim());
      setState("unlocked");
    }
  };

  if (state === "loading") return null;

  if (state === "unlocked") {
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

        <form onSubmit={handleSubmit} className="w-full flex gap-2">
          <Input
            type="text"
            placeholder="Classroom Code"
            className="bg-neutral-950 border-neutral-700 text-lg h-12"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            autoFocus
          />
          <Button type="submit" className="h-12 bg-blue-600 hover:bg-blue-500 rounded-lg">
            <ArrowRight className="w-5 h-5" />
          </Button>
        </form>
      </div>
    </div>
  );
}
