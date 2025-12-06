import { createFileRoute, useSearch } from "@tanstack/react-router";
import { z } from "zod";
import { BackToSignInLink } from "@/components/auth/back-to-sign-in-link";
import { AuthPageLayout } from "@/components/auth-page-layout";
import ResetPasswordPage from "@/components/reset-password-page";

export const Route = createFileRoute("/reset-password")({
  component: ResetPasswordRoute,
  validateSearch: z.object({
    token: z.string().optional(),
  }),
});

function ResetPasswordRoute() {
  const { token } = useSearch({ from: "/reset-password" });

  if (!token) {
    return (
      <AuthPageLayout
        description="The password reset link is invalid or expired. Please request a new one."
        footer={<BackToSignInLink />}
        title="Invalid Reset Link"
      >
        <p className="text-center text-muted-foreground">
          No reset token provided. Please use the link from your email or
          request a new password reset.
        </p>
      </AuthPageLayout>
    );
  }

  return <ResetPasswordPage token={token} />;
}
