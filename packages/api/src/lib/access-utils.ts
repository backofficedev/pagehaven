/**
 * Pure access control utility functions
 * No database dependencies - safe for testing
 */

// ============ Types ============

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

export type AccessCheckOptions = {
  siteId: string;
  accessType: string | null;
  passwordHash: string | null;
  passwordCookie: string | undefined;
  userId: string | undefined;
  userEmail: string | undefined;
};

// ============ Password Verification ============

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

// ============ Gate Redirects ============

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

/**
 * Get error response for access denial
 */
export function getAccessDeniedResponse(reason: string): {
  status: 401 | 403;
  error: string;
} {
  switch (reason) {
    case "password_required":
      return { status: 401, error: "Password required" };
    case "login_required":
      return { status: 401, error: "Login required" };
    case "not_member":
      return { status: 403, error: "You are not a member of this site" };
    case "not_invited":
      return { status: 403, error: "You are not invited to this site" };
    default:
      return { status: 403, error: "Access denied" };
  }
}
