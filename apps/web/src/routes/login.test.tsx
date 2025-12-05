import { describe, expect, it, vi } from "vitest";

// Mock dependencies
vi.mock("@tanstack/react-router", () => ({
  createFileRoute: () => () => ({
    component: vi.fn(),
  }),
  useNavigate: () => vi.fn(),
}));

vi.mock("@/components/sign-in-form", () => ({
  default: ({ onSwitchToSignUp }: { onSwitchToSignUp: () => void }) => (
    <div data-testid="sign-in-form">
      <button onClick={onSwitchToSignUp} type="button">
        Switch to Sign Up
      </button>
    </div>
  ),
}));

vi.mock("@/components/sign-up-form", () => ({
  default: ({ onSwitchToSignIn }: { onSwitchToSignIn: () => void }) => (
    <div data-testid="sign-up-form">
      <button onClick={onSwitchToSignIn} type="button">
        Switch to Sign In
      </button>
    </div>
  ),
}));

describe("login route", () => {
  it("exports Route", async () => {
    const module = await import("./login");
    expect(module.Route).toBeDefined();
  });
});
