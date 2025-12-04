import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { FormField } from "./form-field";

const ERROR_REGEX = /error/i;

describe("FormField", () => {
  const defaultProps = {
    name: "email",
    label: "Email",
    value: "",
    errors: [],
    onBlur: vi.fn(),
    onChange: vi.fn(),
  };

  describe("smoke tests", () => {
    it("renders without crashing", () => {
      render(<FormField {...defaultProps} />);
      expect(screen.getByLabelText("Email")).toBeInTheDocument();
    });

    it("renders label correctly", () => {
      render(<FormField {...defaultProps} />);
      expect(screen.getByText("Email")).toBeInTheDocument();
    });

    it("renders input with correct name", () => {
      render(<FormField {...defaultProps} />);
      expect(screen.getByRole("textbox")).toHaveAttribute("name", "email");
    });
  });

  describe("input types", () => {
    it("renders text input by default", () => {
      render(<FormField {...defaultProps} />);
      expect(screen.getByRole("textbox")).toHaveAttribute("type", "text");
    });

    it("renders email input when type is email", () => {
      render(<FormField {...defaultProps} type="email" />);
      expect(screen.getByRole("textbox")).toHaveAttribute("type", "email");
    });

    it("renders password input when type is password", () => {
      render(<FormField {...defaultProps} type="password" />);
      // Password inputs don't have textbox role
      expect(screen.getByLabelText("Email")).toHaveAttribute(
        "type",
        "password"
      );
    });
  });

  describe("value handling", () => {
    it("displays the provided value", () => {
      render(<FormField {...defaultProps} value="test@example.com" />);
      expect(screen.getByRole("textbox")).toHaveValue("test@example.com");
    });

    it("calls onChange when input value changes", async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      render(<FormField {...defaultProps} onChange={onChange} />);

      await user.type(screen.getByRole("textbox"), "a");
      expect(onChange).toHaveBeenCalledWith("a");
    });

    it("calls onBlur when input loses focus", async () => {
      const user = userEvent.setup();
      const onBlur = vi.fn();
      render(<FormField {...defaultProps} onBlur={onBlur} />);

      const input = screen.getByRole("textbox");
      await user.click(input);
      await user.tab();
      expect(onBlur).toHaveBeenCalled();
    });
  });

  describe("error handling", () => {
    it("displays no errors when errors array is empty", () => {
      render(<FormField {...defaultProps} errors={[]} />);
      expect(screen.queryByText(ERROR_REGEX)).not.toBeInTheDocument();
    });

    it("displays single error message", () => {
      render(
        <FormField
          {...defaultProps}
          errors={[{ message: "Email is required" }]}
        />
      );
      expect(screen.getByText("Email is required")).toBeInTheDocument();
    });

    it("displays multiple error messages", () => {
      render(
        <FormField
          {...defaultProps}
          errors={[
            { message: "Email is required" },
            { message: "Invalid email format" },
          ]}
        />
      );
      expect(screen.getByText("Email is required")).toBeInTheDocument();
      expect(screen.getByText("Invalid email format")).toBeInTheDocument();
    });

    it("handles undefined errors in array", () => {
      render(
        <FormField
          {...defaultProps}
          errors={[undefined, { message: "Valid error" }]}
        />
      );
      expect(screen.getByText("Valid error")).toBeInTheDocument();
    });

    it("applies error styling to error messages", () => {
      render(
        <FormField {...defaultProps} errors={[{ message: "Error message" }]} />
      );
      const errorElement = screen.getByText("Error message");
      expect(errorElement).toHaveClass("text-red-500");
    });
  });

  describe("accessibility", () => {
    it("associates label with input via htmlFor", () => {
      render(<FormField {...defaultProps} label="Username" name="username" />);
      const input = screen.getByLabelText("Username");
      expect(input).toHaveAttribute("id", "username");
    });

    it("input is focusable", async () => {
      const user = userEvent.setup();
      render(<FormField {...defaultProps} />);

      const input = screen.getByRole("textbox");
      await user.click(input);
      expect(input).toHaveFocus();
    });
  });

  describe("different field configurations", () => {
    it("renders password field correctly", () => {
      render(
        <FormField
          {...defaultProps}
          label="Password"
          name="password"
          type="password"
          value="secret123"
        />
      );
      const input = screen.getByLabelText("Password");
      expect(input).toHaveAttribute("type", "password");
      expect(input).toHaveValue("secret123");
    });

    it("renders email field correctly", () => {
      render(
        <FormField
          {...defaultProps}
          label="Email Address"
          name="email"
          type="email"
          value="user@example.com"
        />
      );
      const input = screen.getByLabelText("Email Address");
      expect(input).toHaveAttribute("type", "email");
      expect(input).toHaveValue("user@example.com");
    });
  });
});
