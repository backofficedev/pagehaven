import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Mock all dependencies
vi.mock("@tanstack/react-query", () => ({
  QueryClientProvider: vi.fn(({ children }) => children),
}));

vi.mock("@tanstack/react-router", () => ({
  createRouter: vi.fn(() => ({})),
  RouterProvider: vi.fn(() => null),
}));

vi.mock("react-dom/client", () => ({
  default: {
    createRoot: vi.fn(() => ({
      render: vi.fn(),
    })),
  },
}));

vi.mock("./components/loader", () => ({
  default: () => null,
}));

vi.mock("./routeTree.gen", () => ({
  routeTree: {},
}));

vi.mock("./utils/orpc", () => ({
  orpc: {},
  queryClient: {},
}));

describe("main", () => {
  let originalGetElementById: typeof document.getElementById;

  beforeEach(() => {
    originalGetElementById = document.getElementById;
    vi.resetModules();
  });

  afterEach(() => {
    document.getElementById = originalGetElementById;
    vi.clearAllMocks();
  });

  it("throws error when root element is not found", async () => {
    document.getElementById = vi.fn(() => null);

    await expect(import("./main")).rejects.toThrow("Root element not found");
  });

  it("renders app when root element exists and is empty", async () => {
    const mockElement = document.createElement("div");
    mockElement.id = "app";
    document.getElementById = vi.fn(() => mockElement);

    const ReactDOM = await import("react-dom/client");

    await import("./main");

    expect(ReactDOM.default.createRoot).toHaveBeenCalledWith(mockElement);
  });

  it("does not render when root element has content", async () => {
    const mockElement = document.createElement("div");
    mockElement.id = "app";
    mockElement.innerHTML = "<div>Existing content</div>";
    document.getElementById = vi.fn(() => mockElement);

    const ReactDOM = await import("react-dom/client");

    await import("./main");

    expect(ReactDOM.default.createRoot).not.toHaveBeenCalled();
  });
});
