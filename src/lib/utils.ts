import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Safe localStorage — falls back to sessionStorage, then in-memory for private browsing on iOS
const memoryFallback: Record<string, string> = {};

export function storageGet(key: string): string | null {
  try { return localStorage.getItem(key); } catch {}
  try { return sessionStorage.getItem(key); } catch {}
  return memoryFallback[key] ?? null;
}

export function storageSet(key: string, value: string): void {
  try { localStorage.setItem(key, value); return; } catch {}
  try { sessionStorage.setItem(key, value); return; } catch {}
  memoryFallback[key] = value;
}

export function storageClear(key: string): void {
  try { localStorage.removeItem(key); } catch {}
  try { sessionStorage.removeItem(key); } catch {}
  delete memoryFallback[key];
}
