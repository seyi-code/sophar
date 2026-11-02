import { randomBytes } from "crypto";

/** Generate a URL-safe random id */
export function generateId(length = 16): string {
  return randomBytes(length).toString("hex").slice(0, length);
}
