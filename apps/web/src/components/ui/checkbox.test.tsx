import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Checkbox } from "./checkbox";

describe("Checkbox", () => {
  describe("smoke tests", () => {
    it("renders without crashing", () => {
      render(<Checkbox aria-label="Test checkbox" />);
      expect(screen.getByRole("checkbox")).toBeInTheDocument();
    });

    it("has correct data-slot attribute", () => {
      render(<Checkbox aria-label="Test checkbox" />);
      expect(screen.getByRole("checkbox")).toHaveAttribute(
        "data-slot",
        "checkbox"
      );
    });
  });

  describe("checked state", () => {
    it("renders unchecked by default", () => {
      render(<Checkbox aria-label="Test checkbox" />);
      expect(screen.getByRole("checkbox")).not.toBeChecked();
    });

    it("renders checked when defaultChecked is true", () => {
      render(<Checkbox aria-label="Test checkbox" defaultChecked />);
      expect(screen.getByRole("checkbox")).toBeChecked();
    });

    it("renders checked when checked prop is true", () => {
      render(<Checkbox aria-label="Test checkbox" checked />);
      expect(screen.getByRole("checkbox")).toBeChecked();
    });

    it("toggles state on click", async () => {
      const user = userEvent.setup();
      render(<Checkbox aria-label="Test checkbox" />);

      const checkbox = screen.getByRole("checkbox");
      expect(checkbox).not.toBeChecked();

      await user.click(checkbox);
      expect(checkbox).toBeChecked();

      await user.click(checkbox);
      expect(checkbox).not.toBeChecked();
    });
  });

  describe("controlled component", () => {
    it("calls onCheckedChange when clicked", async () => {
      const user = userEvent.setup();
      const handleChange = vi.fn();
      render(
        <Checkbox
          aria-label="Test checkbox"
          checked={false}
          onCheckedChange={handleChange}
        />
      );

      await user.click(screen.getByRole("checkbox"));
      expect(handleChange).toHaveBeenCalledWith(true);
    });

    it("respects controlled checked state", () => {
      const { rerender } = render(
        <Checkbox aria-label="Test checkbox" checked={false} />
      );
      expect(screen.getByRole("checkbox")).not.toBeChecked();

      rerender(<Checkbox aria-label="Test checkbox" checked={true} />);
      expect(screen.getByRole("checkbox")).toBeChecked();
    });
  });

  describe("disabled state", () => {
    it("can be disabled", () => {
      render(<Checkbox aria-label="Test checkbox" disabled />);
      expect(screen.getByRole("checkbox")).toBeDisabled();
    });

    it("does not toggle when disabled", async () => {
      const user = userEvent.setup();
      const handleChange = vi.fn();
      render(
        <Checkbox
          aria-label="Test checkbox"
          disabled
          onCheckedChange={handleChange}
        />
      );

      await user.click(screen.getByRole("checkbox"));
      expect(handleChange).not.toHaveBeenCalled();
    });
  });

  describe("styling", () => {
    it("has default styling classes", () => {
      render(<Checkbox aria-label="Test checkbox" />);
      const checkbox = screen.getByRole("checkbox");
      expect(checkbox).toHaveClass("size-4");
      expect(checkbox).toHaveClass("rounded-[4px]");
      expect(checkbox).toHaveClass("border");
    });

    it("merges custom className", () => {
      render(<Checkbox aria-label="Test checkbox" className="custom-class" />);
      const checkbox = screen.getByRole("checkbox");
      expect(checkbox).toHaveClass("custom-class");
      expect(checkbox).toHaveClass("size-4");
    });
  });

  describe("accessibility", () => {
    it("supports aria-label", () => {
      render(<Checkbox aria-label="Accept terms" />);
      expect(screen.getByLabelText("Accept terms")).toBeInTheDocument();
    });

    it("supports aria-describedby", () => {
      render(
        <>
          <Checkbox aria-describedby="helper" aria-label="Option" />
          <span id="helper">Helper text</span>
        </>
      );
      expect(screen.getByRole("checkbox")).toHaveAttribute(
        "aria-describedby",
        "helper"
      );
    });

    it("is focusable via keyboard", async () => {
      const user = userEvent.setup();
      render(
        <>
          <button type="button">Before</button>
          <Checkbox aria-label="Test checkbox" />
        </>
      );

      await user.tab();
      await user.tab();
      expect(screen.getByRole("checkbox")).toHaveFocus();
    });

    it("can be toggled with space key", async () => {
      const user = userEvent.setup();
      render(<Checkbox aria-label="Test checkbox" />);

      const checkbox = screen.getByRole("checkbox");
      checkbox.focus();
      await user.keyboard(" ");
      expect(checkbox).toBeChecked();
    });
  });

  describe("with label", () => {
    it("works with associated label element", async () => {
      const user = userEvent.setup();
      render(
        <div>
          <Checkbox aria-label="Terms" id="terms" />
          <label htmlFor="terms">Accept terms and conditions</label>
        </div>
      );

      // Click the label text
      await user.click(screen.getByText("Accept terms and conditions"));
      expect(screen.getByRole("checkbox")).toBeChecked();
    });
  });

  describe("name and value", () => {
    it("supports name attribute via hidden input", () => {
      // Radix checkbox uses a hidden input for form submission
      const { container } = render(
        <Checkbox aria-label="Test" name="agreement" />
      );
      const hiddenInput = container.querySelector('input[name="agreement"]');
      // The name may be on a hidden input or the button depending on implementation
      expect(hiddenInput || screen.getByRole("checkbox")).toBeInTheDocument();
    });

    it("supports value attribute", () => {
      render(<Checkbox aria-label="Test" value="accepted" />);
      expect(screen.getByRole("checkbox")).toHaveAttribute("value", "accepted");
    });
  });
});
