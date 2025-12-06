import { describe, expect, it, vi } from "vitest";

// Mock @orpc/client
vi.mock("@orpc/client", () => ({
  createORPCClient: vi.fn(() => ({})),
}));

// Mock @orpc/client/fetch
class MockRPCLink {
  config: { url: string; fetch: typeof fetch };
  constructor(config: { url: string; fetch: typeof fetch }) {
    this.config = config;
  }
}

vi.mock("@orpc/client/fetch", () => ({
  RPCLink: MockRPCLink,
}));

describe("client", () => {
  it("exports createClient function", async () => {
    const { createClient } = await import("./index");
    expect(createClient).toBeDefined();
    expect(typeof createClient).toBe("function");
  });

  it("exports createLink function", async () => {
    const { createLink } = await import("./index");
    expect(createLink).toBeDefined();
    expect(typeof createLink).toBe("function");
  });

  it("createLink creates an RPCLink with correct URL", async () => {
    const { createLink } = await import("./index");
    const link = createLink({ baseUrl: "https://api.example.com" });
    expect(link).toBeInstanceOf(MockRPCLink);
    expect((link as unknown as MockRPCLink).config.url).toBe(
      "https://api.example.com/rpc"
    );
  });

  it("createClient returns a client object", async () => {
    const { createClient } = await import("./index");
    const client = createClient({ baseUrl: "https://api.example.com" });
    expect(client).toBeDefined();
  });
});

describe("node client", () => {
  it("exports createNodeClient function", async () => {
    const { createNodeClient } = await import("./node");
    expect(createNodeClient).toBeDefined();
    expect(typeof createNodeClient).toBe("function");
  });

  it("createNodeClient creates a client with token", async () => {
    const { createNodeClient } = await import("./node");
    const client = createNodeClient({
      baseUrl: "https://api.example.com",
      token: "test-token",
    });
    expect(client).toBeDefined();
  });
});
