import { useForm } from "@tanstack/react-form";
import { Link, useNavigate } from "@tanstack/react-router";
import { createAuthCallbacks } from "@/lib/auth-callbacks";
import { authClient } from "@/lib/auth-client";
import { signInSchema } from "@/lib/validation";
import { ConnectedFormField } from "./connected-form-field";
import { FormWrapper } from "./form-wrapper";
import Loader from "./loader";
import { SubmitButton } from "./submit-button";
import { Button } from "./ui/button";

export default function SignInForm({
  onSwitchToSignUp,
}: Readonly<{
  onSwitchToSignUp: () => void;
}>) {
  const navigate = useNavigate({ from: "/" });
  const { isPending } = authClient.useSession();

  const form = useForm({
    defaultValues: { email: "", password: "" },
    onSubmit: async ({ value }) => {
      await authClient.signIn.email(
        { email: value.email, password: value.password },
        createAuthCallbacks({
          successMessage: "Sign in successful",
          onSuccess: () => navigate({ to: "/dashboard" }),
        })
      );
    },
    validators: {
      onSubmit: signInSchema,
    },
  });

  if (isPending) {
    return <Loader />;
  }

  return (
    <div className="mx-auto mt-10 w-full max-w-md p-6">
      <h1 className="mb-6 text-center font-bold text-3xl">Welcome Back</h1>
      <FormWrapper onSubmit={form.handleSubmit}>
        <ConnectedFormField
          form={form}
          label="Email"
          name="email"
          type="email"
        />
        <ConnectedFormField
          form={form}
          label="Password"
          name="password"
          type="password"
        />

        <SubmitButton form={form} loadingText="Submitting...">
          Sign In
        </SubmitButton>

        <div className="text-right">
          <Link
            className="text-indigo-600 text-sm hover:text-indigo-800"
            to="/forgot-password"
          >
            Forgot Password?
          </Link>
        </div>
      </FormWrapper>

      <div className="mt-4 text-center">
        <Button
          className="text-indigo-600 hover:text-indigo-800"
          onClick={onSwitchToSignUp}
          variant="link"
        >
          Need an account? Sign Up
        </Button>
      </div>
    </div>
  );
}
