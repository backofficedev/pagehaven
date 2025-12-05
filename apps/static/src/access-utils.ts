/**
 * Access control utilities for static site serving
 * Exported for use in both the main app and tests
 */

export type AccessCheckResult =
  | { allowed: true }
  | {
      allowed: false;
      reason:
        | "password_required"
        | "login_required"
        | "not_invited"
        | "not_member";
    };

/**
 * Verify a password cookie against a stored hash
 */
export function verifyPasswordCookie(
  passwordCookie: string | undefined,
  storedHash: string | null
): boolean {
  if (!(passwordCookie && storedHash)) {
    return false;
  }
  return passwordCookie === storedHash;
}

/**
 * Check if password access is granted based on cookie
 */
export function checkPasswordAccess(
  passwordCookie: string | undefined,
  passwordHash: string | null
): AccessCheckResult {
  const valid = verifyPasswordCookie(passwordCookie, passwordHash);
  return valid
    ? { allowed: true }
    : { allowed: false, reason: "password_required" };
}

/**
 * Generate a redirect URL for access gates
 */
export function getGateRedirectUrl(
  reason: string,
  siteId: string,
  originalUrl: string,
  webUrl: string
): string {
  const redirectParam = encodeURIComponent(originalUrl);

  switch (reason) {
    case "password_required":
      return `${webUrl}/gate/password?siteId=${siteId}&redirect=${redirectParam}`;
    case "login_required":
      return `${webUrl}/gate/login?redirect=${redirectParam}`;
    case "not_member":
    case "not_invited":
      return `${webUrl}/gate/denied?reason=${reason}&redirect=${redirectParam}`;
    default:
      return `${webUrl}/gate/denied?reason=unknown`;
  }
}
