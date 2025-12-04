import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Skeleton } from "./skeleton";

describe("Skeleton", () => {
  describe("smoke tests", () => {
    it("renders without crashing", () => {
      render(<Skeleton data-testid="skeleton" />);
      expect(screen.getByTestId("skeleton")).toBeInTheDocument();
    });

    it("has correct data-slot attribute", () => {
      render(<Skeleton data-testid="skeleton" />);
      expect(screen.getByTestId("skeleton")).toHaveAttribute(
        "data-slot",
        "skeleton"
      );
    });
  });

  describe("styling", () => {
    it("has animation class", () => {
      render(<Skeleton data-testid="skeleton" />);
      expect(screen.getByTestId("skeleton")).toHaveClass("animate-pulse");
    });

    it("has rounded styling", () => {
      render(<Skeleton data-testid="skeleton" />);
      expect(screen.getByTestId("skeleton")).toHaveClass("rounded-md");
    });

    it("has background color", () => {
      render(<Skeleton data-testid="skeleton" />);
      expect(screen.getByTestId("skeleton")).toHaveClass("bg-accent");
    });

    it("merges custom className", () => {
      render(<Skeleton className="h-4 w-full" data-testid="skeleton" />);
      const skeleton = screen.getByTestId("skeleton");
      expect(skeleton).toHaveClass("h-4");
      expect(skeleton).toHaveClass("w-full");
      expect(skeleton).toHaveClass("animate-pulse");
    });
  });

  describe("dimensions", () => {
    it("accepts width class", () => {
      render(<Skeleton className="w-32" data-testid="skeleton" />);
      expect(screen.getByTestId("skeleton")).toHaveClass("w-32");
    });

    it("accepts height class", () => {
      render(<Skeleton className="h-8" data-testid="skeleton" />);
      expect(screen.getByTestId("skeleton")).toHaveClass("h-8");
    });

    it("accepts combined dimensions", () => {
      render(<Skeleton className="h-12 w-48" data-testid="skeleton" />);
      const skeleton = screen.getByTestId("skeleton");
      expect(skeleton).toHaveClass("h-12");
      expect(skeleton).toHaveClass("w-48");
    });
  });

  describe("common use cases", () => {
    it("renders text skeleton", () => {
      render(
        <Skeleton className="h-4 w-[200px]" data-testid="text-skeleton" />
      );
      expect(screen.getByTestId("text-skeleton")).toBeInTheDocument();
    });

    it("renders avatar skeleton", () => {
      render(
        <Skeleton
          className="h-12 w-12 rounded-full"
          data-testid="avatar-skeleton"
        />
      );
      const skeleton = screen.getByTestId("avatar-skeleton");
      expect(skeleton).toHaveClass("rounded-full");
    });

    it("renders card skeleton", () => {
      render(
        <div data-testid="card-skeleton">
          <Skeleton className="h-[125px] w-[250px] rounded-xl" />
          <Skeleton className="mt-4 h-4 w-[250px]" />
          <Skeleton className="mt-2 h-4 w-[200px]" />
        </div>
      );
      expect(screen.getByTestId("card-skeleton")).toBeInTheDocument();
    });
  });

  describe("HTML attributes", () => {
    it("passes through additional props", () => {
      render(
        <Skeleton
          aria-label="Loading content"
          data-testid="skeleton"
          role="status"
        />
      );
      const skeleton = screen.getByTestId("skeleton");
      expect(skeleton).toHaveAttribute("role", "status");
      expect(skeleton).toHaveAttribute("aria-label", "Loading content");
    });
  });
});
