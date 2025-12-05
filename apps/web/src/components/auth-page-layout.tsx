import type * as React from "react";

type AuthPageLayoutProps = {
  title: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
};

/**
 * A shared layout component for authentication pages (login, signup, forgot password, etc.)
 * Provides consistent styling and structure across auth flows.
 */
export function AuthPageLayout({
  title,
  description,
  children,
  footer,
}: Readonly<AuthPageLayoutProps>) {
  return (
    <div className="mx-auto mt-10 w-full max-w-md p-6">
      <h1 className="mb-6 text-center font-bold text-3xl">{title}</h1>
      {description ? (
        <p className="mb-6 text-center text-muted-foreground">{description}</p>
      ) : null}
      {children}
      {footer ? <div className="mt-4 text-center">{footer}</div> : null}
    </div>
  );
}
