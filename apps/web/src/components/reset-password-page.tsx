import { useForm } from "@tanstack/react-form";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { z } from "zod";
import { AuthPageLayout } from "@/components/auth-page-layout";
import { FormField } from "@/components/form-field";
import { FormWrapper } from "@/components/form-wrapper";
import Loader from "@/components/loader";
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
        <form.Field name="newPassword">
          {(field) => (
            <FormField
              errors={field.state.meta.errors}
              label="New Password"
              name={field.name}
              onBlur={field.handleBlur}
              onChange={field.handleChange}
              type="password"
              value={field.state.value}
            />
          )}
        </form.Field>

        <form.Field name="confirmPassword">
          {(field) => (
            <FormField
              errors={field.state.meta.errors}
              label="Confirm New Password"
              name={field.name}
              onBlur={field.handleBlur}
              onChange={field.handleChange}
              type="password"
              value={field.state.value}
            />
          )}
        </form.Field>

        <form.Subscribe>
          {(state) => (
            <Button
              className="w-full"
              disabled={!state.canSubmit || state.isSubmitting}
              type="submit"
            >
              {state.isSubmitting ? <Loader /> : "Reset Password"}
            </Button>
          )}
        </form.Subscribe>
      </FormWrapper>
    </AuthPageLayout>
  );
}
