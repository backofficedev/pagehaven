import { hashSHA256 } from "./crypto";

/**
 * Password hashing utilities
 * Simple SHA-256 hashing (in production, use bcrypt or argon2)
 */

export function hashPassword(password: string): Promise<string> {
  return hashSHA256(password);
}

export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  const inputHash = await hashPassword(password);
  return inputHash === hash;
}
