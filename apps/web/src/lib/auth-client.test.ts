import { describe, expect, it, vi } from "vitest";

// Mock dependencies
vi.mock("better-auth/client/plugins", () => ({
  inferAdditionalFields: vi.fn(() => ({})),
}));

vi.mock("better-auth/react", () => ({
  createAuthClient: vi.fn(() => ({
    signIn: vi.fn(),
    signUp: vi.fn(),
    signOut: vi.fn(),
    useSession: vi.fn(),
  })),
}));

describe("auth-client", () => {
  it("exports authClient", async () => {
    const { authClient } = await import("./auth-client");
    expect(authClient).toBeDefined();
  });

  it("creates auth client with correct baseURL", async () => {
    const { createAuthClient } = await import("better-auth/react");
    await import("./auth-client");

    expect(createAuthClient).toHaveBeenCalledWith(
      expect.objectContaining({
        baseURL: expect.any(String),
        plugins: expect.any(Array),
      })
    );
  });

  it("includes inferAdditionalFields plugin", async () => {
    const { inferAdditionalFields } = await import(
      "better-auth/client/plugins"
    );
    await import("./auth-client");

    expect(inferAdditionalFields).toHaveBeenCalled();
  });
});
