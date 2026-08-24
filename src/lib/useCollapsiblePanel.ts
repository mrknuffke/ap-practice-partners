"use client";

import { useCallback, useEffect, useState } from "react";
import { storageGet, storageSet } from "@/lib/utils";

type Options = {
  /** Collapsed state used for the server render and before storage is read. */
  defaultCollapsed?: boolean;
  /** Bare key (no modifiers) that toggles the panel, e.g. "[" or "]". */
  shortcut?: string;
};

/**
 * Collapse state for a layout panel, persisted across sessions.
 *
 * `mounted` is false until the stored value has been read — hold off width
 * transitions until then so a collapsed panel doesn't animate open on load.
 */
export function useCollapsiblePanel(key: string, { defaultCollapsed = false, shortcut }: Options = {}) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const saved = storageGet(key);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (saved !== null) setCollapsed(saved === "1");
    setMounted(true);
  }, [key]);

  const toggle = useCallback(() => {
    setCollapsed(prev => {
      storageSet(key, prev ? "0" : "1");
      return !prev;
    });
  }, [key]);

  useEffect(() => {
    if (!shortcut) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== shortcut || e.metaKey || e.ctrlKey || e.altKey) return;
      const el = e.target as HTMLElement | null;
      const tag = el?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || el?.isContentEditable) return;
      e.preventDefault();
      toggle();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [shortcut, toggle]);

  return { collapsed, toggle, mounted };
}
