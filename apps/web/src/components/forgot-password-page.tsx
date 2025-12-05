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
        {
          onSuccess: () => {
            toast.success("Password reset link sent to your email");
            form.reset();
          },
          onError: (error) => {
            toast.error(error.error.message || "Failed to send reset link");
          },
        }
      );
    },
  });

  return (
    <AuthPageLayout
      description="Enter your email address and we'll send you a link to reset your password."
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
      title="Reset Password"
    >
      <FormWrapper onSubmit={form.handleSubmit}>
        <form.Field name="email">
          {(field) => (
            <FormField
              errors={field.state.meta.errors}
              label="Email"
              name={field.name}
              onBlur={field.handleBlur}
              onChange={field.handleChange}
              type="email"
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
              {state.isSubmitting ? <Loader /> : "Send Reset Link"}
            </Button>
          )}
        </form.Subscribe>
      </FormWrapper>
    </AuthPageLayout>
  );
}
