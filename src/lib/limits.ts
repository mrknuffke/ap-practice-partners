// Input size limits to prevent cost/DoS abuse
export const MAX_MESSAGES = 100;
export const MAX_MESSAGE_CONTENT_LENGTH = 8_000;
export const MAX_ATTACHMENTS_PER_MESSAGE = 3;
export const MAX_ATTACHMENT_BASE64_LENGTH = 10 * 1024 * 1024; // ~7.5MB binary
export const MAX_ESSAY_LENGTH = 50_000;
export const MAX_AUDIO_BASE64_LENGTH = 10 * 1024 * 1024;

export const ALLOWED_IMAGE_MIMES = ["image/jpeg", "image/png", "image/webp", "image/gif"] as const;
export const ALLOWED_AUDIO_MIMES = ["audio/webm", "audio/mpeg", "audio/mp4", "audio/ogg", "audio/wav"] as const;

export function tooLarge(value: string | unknown[], limit: number): boolean {
  return (typeof value === "string" ? value.length : value.length) > limit;
}
