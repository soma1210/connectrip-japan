// Booking link tokens. The URL carries 32 random bytes (base64url, 43
// characters). The database keeps only their sha256, so a database leak does
// not hand out working booking links.

import { createHash, randomBytes } from "node:crypto";

const TOKEN_PATTERN = /^[A-Za-z0-9_-]{43}$/;

export function newBookingToken(): string {
  return randomBytes(32).toString("base64url");
}

/** True for strings that could be a token. Cheap filter before touching the database. */
export function isWellFormedToken(token: string): boolean {
  return TOKEN_PATTERN.test(token);
}

export function hashBookingToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}
