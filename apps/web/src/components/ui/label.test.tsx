import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Label } from "./label";

describe("Label", () => {
  describe("smoke tests", () => {
    it("renders without crashing", () => {
      render(<Label>Test Label</Label>);
      expect(screen.getByText("Test Label")).toBeInTheDocument();
    });

    it("has correct data-slot attribute", () => {
      render(<Label>Test</Label>);
      expect(screen.getByText("Test")).toHaveAttribute("data-slot", "label");
    });
  });

  describe("content", () => {
    it("renders text content", () => {
      render(<Label>Email Address</Label>);
      expect(screen.getByText("Email Address")).toBeInTheDocument();
    });

    it("renders children elements", () => {
      render(
        <Label>
          <span data-testid="child">Child Element</span>
        </Label>
      );
      expect(screen.getByTestId("child")).toBeInTheDocument();
    });
  });

  describe("htmlFor association", () => {
    it("supports htmlFor prop", () => {
      render(<Label htmlFor="email-input">Email</Label>);
      expect(screen.getByText("Email")).toHaveAttribute("for", "email-input");
    });

    it("associates with input element", () => {
      render(
        <>
          <Label htmlFor="test-input">Test Input</Label>
          <input id="test-input" type="text" />
        </>
      );
      const label = screen.getByText("Test Input");
      expect(label).toHaveAttribute("for", "test-input");
    });
  });

  describe("styling", () => {
    it("has default styling classes", () => {
      render(<Label>Styled Label</Label>);
      const label = screen.getByText("Styled Label");
      expect(label).toHaveClass("flex");
      expect(label).toHaveClass("select-none");
      expect(label).toHaveClass("font-medium");
      expect(label).toHaveClass("text-sm");
    });

    it("merges custom className", () => {
      render(<Label className="custom-class">Custom</Label>);
      const label = screen.getByText("Custom");
      expect(label).toHaveClass("custom-class");
      expect(label).toHaveClass("flex");
    });
  });

  describe("accessibility", () => {
    it("renders as label element", () => {
      render(<Label>Accessible Label</Label>);
      const label = screen.getByText("Accessible Label");
      expect(label.tagName).toBe("LABEL");
    });
  });
});
