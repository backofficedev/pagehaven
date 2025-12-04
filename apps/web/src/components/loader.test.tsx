import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import Loader from "./loader";

describe("Loader", () => {
  describe("smoke tests", () => {
    it("renders without crashing", () => {
      render(<Loader />);
      expect(document.querySelector(".animate-spin")).toBeInTheDocument();
    });
  });

  describe("structure", () => {
    it("renders a container div", () => {
      const { container } = render(<Loader />);
      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper.tagName).toBe("DIV");
    });

    it("has centering classes", () => {
      const { container } = render(<Loader />);
      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper).toHaveClass("flex");
      expect(wrapper).toHaveClass("items-center");
      expect(wrapper).toHaveClass("justify-center");
    });

    it("has height and padding classes", () => {
      const { container } = render(<Loader />);
      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper).toHaveClass("h-full");
      expect(wrapper).toHaveClass("pt-8");
    });
  });

  describe("spinner", () => {
    it("renders spinner with animation", () => {
      render(<Loader />);
      const spinner = document.querySelector(".animate-spin");
      expect(spinner).toBeInTheDocument();
    });

    it("renders Loader2 icon from lucide-react", () => {
      render(<Loader />);
      // Lucide icons render as SVG
      const svg = document.querySelector("svg");
      expect(svg).toBeInTheDocument();
    });
  });
});
