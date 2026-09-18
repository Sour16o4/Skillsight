import { eq } from "drizzle-orm";
import { db, schema } from "../db/index.js";
import { randomUUID } from "node:crypto";

const MAX_FAILED_ATTEMPTS = 5;
const LOCK_DURATION_MS = 15 * 60 * 1000;

// Consecutive-failure lockout for the email/password step. Mirrors Better
// Auth's own two-factor lockout mechanics (see src/db/schema.js) so both
// steps behave the same way.

export async function isLockedOut(rawIdentifier) {
  const identifier = rawIdentifier.toLowerCase();
  const [row] = await db
    .select()
    .from(schema.loginLockouts)
    .where(eq(schema.loginLockouts.identifier, identifier))
    .limit(1);

  if (!row?.lockedUntil) return false;

  if (new Date(row.lockedUntil).getTime() > Date.now()) {
    return true;
  }

  // Lock has expired — clear it lazily.
  await db
    .update(schema.loginLockouts)
    .set({ failedCount: 0, lockedUntil: null, updatedAt: new Date() })
    .where(eq(schema.loginLockouts.identifier, identifier));

  return false;
}

export async function recordLoginAttempt(rawIdentifier, _ip, success) {
  const identifier = rawIdentifier.toLowerCase();

  const [row] = await db
    .select()
    .from(schema.loginLockouts)
    .where(eq(schema.loginLockouts.identifier, identifier))
    .limit(1);

  if (success) {
    if (row) {
      await db
        .update(schema.loginLockouts)
        .set({ failedCount: 0, lockedUntil: null, updatedAt: new Date() })
        .where(eq(schema.loginLockouts.identifier, identifier));
    }
    return;
  }

  const nextCount = (row?.failedCount ?? 0) + 1;
  const lockedUntil =
    nextCount >= MAX_FAILED_ATTEMPTS ? new Date(Date.now() + LOCK_DURATION_MS) : null;

  if (row) {
    await db
      .update(schema.loginLockouts)
      .set({ failedCount: nextCount, lockedUntil, updatedAt: new Date() })
      .where(eq(schema.loginLockouts.identifier, identifier));
  } else {
    await db.insert(schema.loginLockouts).values({
      id: randomUUID(),
      identifier,
      failedCount: nextCount,
      lockedUntil,
    });
  }
}
