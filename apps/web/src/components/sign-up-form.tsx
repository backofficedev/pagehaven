import { useForm } from "@tanstack/react-form";
import { useNavigate } from "@tanstack/react-router";
import z from "zod";
import { createAuthCallbacks } from "@/lib/auth-callbacks";
import { authClient } from "@/lib/auth-client";
import { ConnectedFormField } from "./connected-form-field";
import { FormWrapper } from "./form-wrapper";
import Loader from "./loader";
import { SubmitButton } from "./submit-button";
import { Button } from "./ui/button";

export default function SignUpForm({
  onSwitchToSignIn,
}: Readonly<{
  onSwitchToSignIn: () => void;
}>) {
  const navigate = useNavigate({ from: "/" });
  const { isPending } = authClient.useSession();

  const form = useForm({
    defaultValues: { email: "", password: "", name: "" },
    onSubmit: async ({ value }) => {
      await authClient.signUp.email(
        { email: value.email, password: value.password, name: value.name },
        createAuthCallbacks({
          successMessage: "Sign up successful",
          onSuccess: () => navigate({ to: "/dashboard" }),
        })
      );
    },
    validators: {
      onSubmit: z.object({
        name: z.string().min(2, "Name must be at least 2 characters"),
        email: z.email("Invalid email address"),
        password: z.string().min(8, "Password must be at least 8 characters"),
      }),
    },
  });

  if (isPending) {
    return <Loader />;
  }

  return (
    <div className="mx-auto mt-10 w-full max-w-md p-6">
      <h1 className="mb-6 text-center font-bold text-3xl">Create Account</h1>
      <FormWrapper onSubmit={form.handleSubmit}>
        <ConnectedFormField form={form} label="Name" name="name" />
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
          Sign Up
        </SubmitButton>
      </FormWrapper>

      <div className="mt-4 text-center">
        <Button
          className="text-indigo-600 hover:text-indigo-800"
          onClick={onSwitchToSignIn}
          variant="link"
        >
          Already have an account? Sign In
        </Button>
      </div>
    </div>
  );
}
