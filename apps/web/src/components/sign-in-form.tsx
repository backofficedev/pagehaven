import { useForm } from "@tanstack/react-form";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import z from "zod";
import { authClient } from "@/lib/auth-client";
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
        {
          onSuccess: () => {
            navigate({ to: "/dashboard" });
            toast.success("Sign in successful");
          },
          onError: (error) => {
            toast.error(error.error.message || error.error.statusText);
          },
        }
      );
    },
    validators: {
      onSubmit: z.object({
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
