"use client";

import { useEffect } from "react";

/**
 * Ensures all connected clients run the latest deployed bundle.
 *
 * When a student reopens the app or switches back from a suspended tab,
 * this component checks the deployment marker. If it detects an older bundle,
 * it performs a one-time clean reload to fetch fresh code and purge stale chunks.
 */
const CURRENT_DEPLOY_ID = "2026-10-14-v2-resilience";

export function AppVersionManager() {
  useEffect(() => {
    try {
      const lastDeploy = localStorage.getItem("app_last_deploy_id");
      if (lastDeploy && lastDeploy !== CURRENT_DEPLOY_ID) {
        localStorage.setItem("app_last_deploy_id", CURRENT_DEPLOY_ID);
        // Student had an older bundle in memory/cache — reload once to sync with latest production deploy
        window.location.reload();
        return;
      }
      if (!lastDeploy) {
        localStorage.setItem("app_last_deploy_id", CURRENT_DEPLOY_ID);
      }
    } catch {
      // Safe fallback if storage is restricted
    }

    // Auto-reload if an outdated chunk hash on Vercel triggers a script load error
    const handleChunkError = (event: ErrorEvent) => {
      const msg = event?.message || "";
      if (
        msg.includes("ChunkLoadError") ||
        msg.includes("Loading chunk") ||
        msg.includes("Failed to fetch dynamically imported module")
      ) {
        window.location.reload();
      }
    };

    window.addEventListener("error", handleChunkError);
    return () => window.removeEventListener("error", handleChunkError);
  }, []);

  return null;
}
