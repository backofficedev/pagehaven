import type { ReactNode } from "react";

type FormWrapperProps = Readonly<{
  children: ReactNode;
  onSubmit: () => void;
  className?: string;
}>;

/**
 * A wrapper component that handles form submission boilerplate.
 * Prevents default behavior and stops propagation before calling the submit handler.
 */
export function FormWrapper({
  children,
  onSubmit,
  className = "space-y-4",
}: FormWrapperProps) {
  return (
    <form
      className={className}
      onSubmit={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onSubmit();
      }}
    >
      {children}
    </form>
  );
}
