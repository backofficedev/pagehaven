import { useForm } from "@tanstack/react-form";
import { z } from "zod";
import { BackToSignInLink } from "@/components/auth/back-to-sign-in-link";
import { AuthPageLayout } from "@/components/auth-page-layout";
import { ConnectedFormField } from "@/components/connected-form-field";
import { FormWrapper } from "@/components/form-wrapper";
import { SubmitButton } from "@/components/submit-button";
import { createAuthCallbacks } from "@/lib/auth-callbacks";
import { authClient } from "@/lib/auth-client";

export default function ForgotPasswordPage() {
  const form = useForm({
    defaultValues: { email: "" },
    validators: {
      onSubmit: z.object({
        email: z.email("Invalid email address"),
      }),
    },
    onSubmit: async ({ value }) => {
      await authClient.requestPasswordReset(
        {
          email: value.email,
          redirectTo: `${globalThis.location.origin}/reset-password`,
        },
        createAuthCallbacks({
          successMessage: "Password reset link sent to your email",
          onSuccess: () => form.reset(),
          errorFallback: "Failed to send reset link",
        })
      );
    },
  });

  return (
    <AuthPageLayout
      description="Enter your email address and we'll send you a link to reset your password."
      footer={<BackToSignInLink />}
      title="Reset Password"
    >
      <FormWrapper onSubmit={form.handleSubmit}>
        <ConnectedFormField
          form={form}
          label="Email"
          name="email"
          type="email"
        />

        <SubmitButton form={form}>Send Reset Link</SubmitButton>
      </FormWrapper>
    </AuthPageLayout>
  );
}
