import z from "zod";

/**
 * Shared schema for expiration days (1-365 days, optional)
 */
export const expiresInDaysSchema = z.number().min(1).max(365).optional();

/**
 * Calculate expiration date from days
 */
export function calculateExpiresAt(
  expiresInDays: number | undefined
): Date | undefined {
  if (!expiresInDays) {
    return;
  }
  return new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000);
}
