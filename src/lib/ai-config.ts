/**
 * Centralized AI model configuration.
 *
 * Change the default model in one place, or override per-environment
 * with the GEMINI_MODEL env var. Every API route imports from here
 * so future model swaps are a single-line change.
 */

const DEFAULT_MODEL = "gemini-3.5-flash";

export const GEMINI_MODEL = process.env.GEMINI_MODEL || DEFAULT_MODEL;
