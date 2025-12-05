import { redirect } from "@tanstack/react-router";
import { authClient } from "./auth-client";

/**
 * Shared authentication types for the web app
 */
export type SessionData = {
  user: {
    id: string;
    name: string;
    email: string;
    emailVerified: boolean;
    image?: string | null;
    createdAt: Date;
    updatedAt: Date;
  };
  session: {
    id: string;
    userId: string;
    token: string;
    expiresAt: Date;
    createdAt: Date;
    updatedAt: Date;
    ipAddress?: string | null;
    userAgent?: string | null;
  };
};

/**
 * Shared beforeLoad guard that requires authentication.
 * Redirects to /login if no session exists.
 */
export async function requireAuth() {
  const session = await authClient.getSession();
  if (!session.data) {
    redirect({
      to: "/login",
      throw: true,
    });
  }
  return { session };
}
