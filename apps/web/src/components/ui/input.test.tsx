import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Input } from "./input";

describe("Input", () => {
  describe("smoke tests", () => {
    it("renders without crashing", () => {
      render(<Input />);
      expect(screen.getByRole("textbox")).toBeInTheDocument();
    });

    it("has correct data-slot attribute", () => {
      render(<Input />);
      expect(screen.getByRole("textbox")).toHaveAttribute("data-slot", "input");
    });
  });

  describe("input types", () => {
    it("renders text input by default", () => {
      render(<Input />);
      // Input component doesn't set explicit type, browser defaults to text
      expect(screen.getByRole("textbox")).toBeInTheDocument();
    });

    it("renders email input", () => {
      render(<Input type="email" />);
      expect(screen.getByRole("textbox")).toHaveAttribute("type", "email");
    });

    it("renders password input", () => {
      render(<Input aria-label="Password" type="password" />);
      expect(screen.getByLabelText("Password")).toHaveAttribute(
        "type",
        "password"
      );
    });

    it("renders number input", () => {
      render(<Input aria-label="Number" type="number" />);
      expect(screen.getByLabelText("Number")).toHaveAttribute("type", "number");
    });

    it("renders search input", () => {
      render(<Input type="search" />);
      expect(screen.getByRole("searchbox")).toHaveAttribute("type", "search");
    });
  });

  describe("value handling", () => {
    it("displays provided value", () => {
      render(<Input defaultValue="test value" />);
      expect(screen.getByRole("textbox")).toHaveValue("test value");
    });

    it("calls onChange when value changes", async () => {
      const user = userEvent.setup();
      const handleChange = vi.fn();
      render(<Input onChange={handleChange} />);

      await user.type(screen.getByRole("textbox"), "a");
      expect(handleChange).toHaveBeenCalled();
    });

    it("supports controlled value", () => {
      const { rerender } = render(<Input readOnly value="initial" />);
      expect(screen.getByRole("textbox")).toHaveValue("initial");

      rerender(<Input readOnly value="updated" />);
      expect(screen.getByRole("textbox")).toHaveValue("updated");
    });
  });

  describe("placeholder", () => {
    it("displays placeholder text", () => {
      render(<Input placeholder="Enter your email" />);
      expect(
        screen.getByPlaceholderText("Enter your email")
      ).toBeInTheDocument();
    });
  });

  describe("disabled state", () => {
    it("can be disabled", () => {
      render(<Input disabled />);
      expect(screen.getByRole("textbox")).toBeDisabled();
    });

    it("applies disabled styles", () => {
      render(<Input disabled />);
      expect(screen.getByRole("textbox")).toHaveClass("disabled:opacity-50");
    });

    it("prevents input when disabled", async () => {
      const user = userEvent.setup();
      const handleChange = vi.fn();
      render(<Input disabled onChange={handleChange} />);

      await user.type(screen.getByRole("textbox"), "test");
      expect(handleChange).not.toHaveBeenCalled();
    });
  });

  describe("custom className", () => {
    it("merges custom className with default classes", () => {
      render(<Input className="custom-class" />);
      const input = screen.getByRole("textbox");
      expect(input).toHaveClass("custom-class");
      expect(input).toHaveClass("flex");
      expect(input).toHaveClass("h-9");
    });
  });

  describe("accessibility", () => {
    it("supports aria-label", () => {
      render(<Input aria-label="Search" />);
      expect(screen.getByLabelText("Search")).toBeInTheDocument();
    });

    it("supports aria-describedby", () => {
      render(
        <>
          <Input aria-describedby="helper" />
          <span id="helper">Helper text</span>
        </>
      );
      expect(screen.getByRole("textbox")).toHaveAttribute(
        "aria-describedby",
        "helper"
      );
    });

    it("supports aria-invalid", () => {
      render(<Input aria-invalid="true" />);
      expect(screen.getByRole("textbox")).toHaveAttribute(
        "aria-invalid",
        "true"
      );
    });

    it("is focusable", async () => {
      const user = userEvent.setup();
      render(<Input />);

      const input = screen.getByRole("textbox");
      await user.click(input);
      expect(input).toHaveFocus();
    });

    it("supports tabIndex", () => {
      render(<Input tabIndex={-1} />);
      expect(screen.getByRole("textbox")).toHaveAttribute("tabindex", "-1");
    });
  });

  describe("form integration", () => {
    it("supports name attribute", () => {
      render(<Input name="email" />);
      expect(screen.getByRole("textbox")).toHaveAttribute("name", "email");
    });

    it("supports id attribute", () => {
      render(<Input id="email-input" />);
      expect(screen.getByRole("textbox")).toHaveAttribute("id", "email-input");
    });

    it("supports required attribute", () => {
      render(<Input required />);
      expect(screen.getByRole("textbox")).toBeRequired();
    });

    it("supports maxLength attribute", () => {
      render(<Input maxLength={100} />);
      expect(screen.getByRole("textbox")).toHaveAttribute("maxlength", "100");
    });

    it("supports minLength attribute", () => {
      render(<Input minLength={5} />);
      expect(screen.getByRole("textbox")).toHaveAttribute("minlength", "5");
    });

    it("supports pattern attribute", () => {
      render(<Input pattern="[A-Za-z]+" />);
      expect(screen.getByRole("textbox")).toHaveAttribute(
        "pattern",
        "[A-Za-z]+"
      );
    });
  });

  describe("event handlers", () => {
    it("calls onFocus when focused", async () => {
      const user = userEvent.setup();
      const handleFocus = vi.fn();
      render(<Input onFocus={handleFocus} />);

      await user.click(screen.getByRole("textbox"));
      expect(handleFocus).toHaveBeenCalled();
    });

    it("calls onBlur when blurred", async () => {
      const user = userEvent.setup();
      const handleBlur = vi.fn();
      render(<Input onBlur={handleBlur} />);

      const input = screen.getByRole("textbox");
      await user.click(input);
      await user.tab();
      expect(handleBlur).toHaveBeenCalled();
    });

    it("calls onKeyDown when key is pressed", async () => {
      const user = userEvent.setup();
      const handleKeyDown = vi.fn();
      render(<Input onKeyDown={handleKeyDown} />);

      const input = screen.getByRole("textbox");
      await user.click(input);
      await user.keyboard("a");
      expect(handleKeyDown).toHaveBeenCalled();
    });
  });
});
