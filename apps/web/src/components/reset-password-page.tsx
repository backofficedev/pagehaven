import { useForm } from "@tanstack/react-form";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { z } from "zod";
import { AuthPageLayout } from "@/components/auth-page-layout";
import { ConnectedFormField } from "@/components/connected-form-field";
import { FormWrapper } from "@/components/form-wrapper";
import { SubmitButton } from "@/components/submit-button";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";

type ResetPasswordPageProps = {
  token: string;
};

export default function ResetPasswordPage({
  token,
}: Readonly<ResetPasswordPageProps>) {
  const form = useForm({
    defaultValues: {
      newPassword: "",
      confirmPassword: "",
    },
    validators: {
      onSubmit: z
        .object({
          newPassword: z
            .string()
            .min(8, "Password must be at least 8 characters"),
          confirmPassword: z
            .string()
            .min(1, "Please confirm your new password"),
        })
        .refine((data) => data.newPassword === data.confirmPassword, {
          message: "Passwords don't match",
          path: ["confirmPassword"],
        }),
    },
    onSubmit: async ({ value }) => {
      await authClient.resetPassword(
        {
          newPassword: value.newPassword,
          token,
        },
        {
          onSuccess: () => {
            toast.success("Password reset successfully");
            // Redirect to login after successful reset
            globalThis.location.href = "/login";
          },
          onError: (error) => {
            toast.error(error.error.message || "Failed to reset password");
          },
        }
      );
    },
  });

  return (
    <AuthPageLayout
      description="Enter your new password below."
      footer={
        <Link to="/login">
          <Button
            className="text-indigo-600 hover:text-indigo-800"
            variant="link"
          >
            Back to Sign In
          </Button>
        </Link>
      }
      title="Set New Password"
    >
      <FormWrapper onSubmit={form.handleSubmit}>
        <ConnectedFormField
          form={form}
          label="New Password"
          name="newPassword"
          type="password"
        />
        <ConnectedFormField
          form={form}
          label="Confirm New Password"
          name="confirmPassword"
          type="password"
        />

        <SubmitButton form={form}>Reset Password</SubmitButton>
      </FormWrapper>
    </AuthPageLayout>
  );
}
