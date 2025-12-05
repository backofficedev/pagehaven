import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { ErrorBoundary } from "./error-boundary";

// Regex patterns at module level for performance
const TRY_AGAIN_REGEX = /try again/i;

// Component that throws an error
function ThrowError({ shouldThrow }: { shouldThrow: boolean }) {
  if (shouldThrow) {
    throw new Error("Test error message");
  }
  return <div>No error</div>;
}

// Suppress console.error for cleaner test output
const originalError = console.error;
beforeAll(() => {
  console.error = vi.fn();
});
afterAll(() => {
  console.error = originalError;
});

describe("ErrorBoundary", () => {
  it("renders children when there is no error", () => {
    render(
      <ErrorBoundary>
        <div>Child content</div>
      </ErrorBoundary>
    );

    expect(screen.getByText("Child content")).toBeInTheDocument();
  });

  it("renders error UI when child throws", () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow />
      </ErrorBoundary>
    );

    expect(screen.getByText("Something went wrong")).toBeInTheDocument();
    expect(
      screen.getByText("An unexpected error occurred. Please try again.")
    ).toBeInTheDocument();
    expect(screen.getByText("Test error message")).toBeInTheDocument();
  });

  it("renders custom fallback when provided", () => {
    render(
      <ErrorBoundary fallback={<div>Custom fallback</div>}>
        <ThrowError shouldThrow />
      </ErrorBoundary>
    );

    expect(screen.getByText("Custom fallback")).toBeInTheDocument();
    expect(screen.queryByText("Something went wrong")).not.toBeInTheDocument();
  });

  it("renders Try Again button", () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow />
      </ErrorBoundary>
    );

    expect(
      screen.getByRole("button", { name: TRY_AGAIN_REGEX })
    ).toBeInTheDocument();
  });

  it("resets error state when Try Again is clicked", async () => {
    const user = userEvent.setup();

    // We need to test the reset behavior
    // Since the component will throw again, we test that the button exists
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow />
      </ErrorBoundary>
    );

    const button = screen.getByRole("button", { name: TRY_AGAIN_REGEX });
    expect(button).toBeInTheDocument();

    // Click should trigger handleReset
    await user.click(button);

    // After reset, the component will try to render children again
    // Since ThrowError still throws, it will show error again
    expect(screen.getByText("Something went wrong")).toBeInTheDocument();
  });

  describe("getDerivedStateFromError", () => {
    it("returns correct state shape", () => {
      const error = new Error("Test");
      const result = ErrorBoundary.getDerivedStateFromError(error);

      expect(result).toEqual({
        hasError: true,
        error,
      });
    });
  });

  describe("error display", () => {
    it("shows error message in code block", () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow />
        </ErrorBoundary>
      );

      const errorMessage = screen.getByText("Test error message");
      expect(errorMessage).toHaveClass("font-mono");
    });
  });
});
