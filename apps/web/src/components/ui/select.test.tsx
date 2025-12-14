import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "./select";

describe("Select", () => {
  it("renders select trigger with placeholder", () => {
    render(
      <Select>
        <SelectTrigger>
          <SelectValue placeholder="Select an option" />
        </SelectTrigger>
      </Select>
    );

    expect(screen.getByRole("combobox")).toBeInTheDocument();
    expect(screen.getByText("Select an option")).toBeInTheDocument();
  });

  it("applies custom className to trigger", () => {
    render(
      <Select>
        <SelectTrigger className="custom-class">
          <SelectValue placeholder="Test" />
        </SelectTrigger>
      </Select>
    );

    expect(screen.getByRole("combobox")).toHaveClass("custom-class");
  });

  it("renders with data-slot attributes", () => {
    render(
      <Select>
        <SelectTrigger>
          <SelectValue placeholder="Test" />
        </SelectTrigger>
      </Select>
    );

    expect(screen.getByRole("combobox")).toHaveAttribute(
      "data-slot",
      "select-trigger"
    );
  });

  it("handles disabled state on trigger", () => {
    render(
      <Select disabled>
        <SelectTrigger>
          <SelectValue placeholder="Disabled" />
        </SelectTrigger>
      </Select>
    );

    expect(screen.getByRole("combobox")).toBeDisabled();
  });

  it("renders with default value", () => {
    render(
      <Select defaultValue="apple">
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="apple">Apple</SelectItem>
          <SelectItem value="banana">Banana</SelectItem>
        </SelectContent>
      </Select>
    );

    expect(screen.getByRole("combobox")).toHaveTextContent("Apple");
  });

  it("renders SelectSeparator with custom className", () => {
    const { container } = render(
      <SelectSeparator className="custom-separator" />
    );
    expect(container.firstChild).toHaveClass("custom-separator");
  });

  it("renders SelectGroup", () => {
    render(
      <SelectGroup data-testid="group">
        <div>Child</div>
      </SelectGroup>
    );
    expect(screen.getByTestId("group")).toBeInTheDocument();
  });

  it("renders SelectItem with custom className", () => {
    render(
      <Select defaultValue="test" open>
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem className="custom-item" value="test">
            Test Item
          </SelectItem>
        </SelectContent>
      </Select>
    );

    const item = screen.getByRole("option");
    expect(item).toHaveClass("custom-item");
  });
});
