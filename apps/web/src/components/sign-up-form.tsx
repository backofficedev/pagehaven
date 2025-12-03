import { useForm } from "@tanstack/react-form";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import z from "zod";
import { authClient } from "@/lib/auth-client";
import { FormField } from "./form-field";
import Loader from "./loader";
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
        {
          onSuccess: () => {
            navigate({ to: "/dashboard" });
            toast.success("Sign up successful");
          },
          onError: (error) => {
            toast.error(error.error.message || error.error.statusText);
          },
        }
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
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          form.handleSubmit();
        }}
      >
        <form.Field name="name">
          {(field) => (
            <FormField
              errors={field.state.meta.errors}
              label="Name"
              name={field.name}
              onBlur={field.handleBlur}
              onChange={field.handleChange}
              value={field.state.value}
            />
          )}
        </form.Field>

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

        <form.Field name="password">
          {(field) => (
            <FormField
              errors={field.state.meta.errors}
              label="Password"
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
              {state.isSubmitting ? "Submitting..." : "Sign Up"}
            </Button>
          )}
        </form.Subscribe>
      </form>

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
