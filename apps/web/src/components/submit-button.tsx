import type { ReactNode } from "react";
import Loader from "./loader";
import { Button } from "./ui/button";

type FormState = {
  canSubmit: boolean;
  isSubmitting: boolean;
};

type SubmitButtonProps = {
  form: unknown;
  children: ReactNode;
  loadingText?: ReactNode;
  className?: string;
  variant?:
    | "default"
    | "destructive"
    | "outline"
    | "secondary"
    | "ghost"
    | "link";
  disabled?: boolean;
};

/**
 * A submit button that integrates with TanStack Form.
 * Handles the Subscribe pattern and disabled state automatically.
 */
export function SubmitButton({
  form,
  children,
  loadingText,
  className = "w-full",
  variant = "default",
  disabled = false,
}: Readonly<SubmitButtonProps>) {
  const typedForm = form as {
    Subscribe: React.ComponentType<{
      children: (state: FormState) => React.ReactNode;
    }>;
  };
  const FormSubscribe = typedForm.Subscribe;

  return (
    <FormSubscribe>
      {(state) => (
        <Button
          className={className}
          disabled={!state.canSubmit || state.isSubmitting || disabled}
          type="submit"
          variant={variant}
        >
          {state.isSubmitting === true
            ? (loadingText ?? <Loader />)
            : (children ?? null)}
        </Button>
      )}
    </FormSubscribe>
  );
}
