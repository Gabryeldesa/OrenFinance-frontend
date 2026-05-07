import DOMPurify from "dompurify";

export function sanitizeInput(value: string): string {
  if (typeof window === "undefined") return value;
  return DOMPurify.sanitize(value, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] });
}