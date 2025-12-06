import { describe, expect, it, vi } from "vitest";

// Mock dependencies before importing the module
vi.mock("@pagehaven/client", () => ({
  createClient: vi.fn(() => ({})),
  createLink: vi.fn(() => ({})),
}));

vi.mock("@orpc/tanstack-query", () => ({
  createTanstackQueryUtils: vi.fn(() => ({})),
}));

vi.mock("sonner", () => ({
  toast: {
    error: vi.fn(),
  },
}));

describe("orpc", () => {
  it("exports queryClient", async () => {
    const { queryClient } = await import("./orpc");
    expect(queryClient).toBeDefined();
    expect(typeof queryClient.invalidateQueries).toBe("function");
  });

  it("exports link", async () => {
    const { link } = await import("./orpc");
    expect(link).toBeDefined();
  });

  it("exports client", async () => {
    const { client } = await import("./orpc");
    expect(client).toBeDefined();
  });

  it("exports orpc utils", async () => {
    const { orpc } = await import("./orpc");
    expect(orpc).toBeDefined();
  });

  describe("queryClient error handling", () => {
    it("shows toast on query error", async () => {
      const { toast } = await import("sonner");
      const { queryClient } = await import("./orpc");

      // Get the query cache and trigger an error
      const queryCache = queryClient.getQueryCache();
      const onError = queryCache.config.onError;

      if (onError) {
        onError(new Error("Test error"), {} as never);
        expect(toast.error).toHaveBeenCalledWith(
          "Error: Test error",
          expect.any(Object)
        );
      }
    });
  });
});
