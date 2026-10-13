"use client";

import { useEffect } from "react";
import "./globals.css";
import { RefreshCw, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function GlobalError({
  error,
}: {
  error: Error & { digest?: string };
  reset?: () => void;
}) {
  useEffect(() => {
    // Attempt an automatic reload once to resolve stale chunk / cache mismatches
    const key = "ap_crash_auto_reload";
    try {
      const lastAttempt = sessionStorage.getItem(key);
      const now = Date.now();
      // Allow at most one auto-reload every 60 seconds to prevent infinite reload loops
      if (!lastAttempt || now - parseInt(lastAttempt, 10) > 60000) {
        sessionStorage.setItem(key, now.toString());
        window.location.reload();
      }
    } catch {
      // Safe fallback if sessionStorage is inaccessible
    }
  }, [error]);

  const handleHardReset = () => {
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith("ap_tutor_")) {
          localStorage.removeItem(k);
        }
      }
      sessionStorage.clear();
    } catch {}
    window.location.reload();
  };

  return (
    <html lang="en">
      <body className="min-h-screen bg-background text-foreground flex items-center justify-center p-4 font-sans">
        <div className="bg-card border border-border p-8 rounded-3xl max-w-md w-full shadow-2xl text-center space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-destructive/10 text-destructive flex items-center justify-center mx-auto">
            <AlertTriangle className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-xl font-bold font-heading mb-2">Something went wrong</h1>
            <p className="text-sm text-muted-foreground">
              A new app version or temporary connection issue occurred. Reloading usually fixes this immediately.
            </p>
          </div>
          <div className="flex flex-col gap-3">
            <Button
              onClick={() => window.location.reload()}
              className="w-full h-12 bg-primary text-primary-foreground rounded-xl font-semibold cursor-pointer"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Reload App
            </Button>
            <Button
              onClick={handleHardReset}
              variant="outline"
              className="w-full h-12 rounded-xl text-xs text-muted-foreground border-border hover:bg-surface cursor-pointer"
            >
              Clear Cache & Reset
            </Button>
          </div>
        </div>
      </body>
    </html>
  );
}
