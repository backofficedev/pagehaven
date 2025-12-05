import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./tabs";

/** Renders a standard two-tab component for testing */
function renderTwoTabComponent() {
  return render(
    <Tabs defaultValue="tab1">
      <TabsList>
        <TabsTrigger value="tab1">Tab 1</TabsTrigger>
        <TabsTrigger value="tab2">Tab 2</TabsTrigger>
      </TabsList>
      <TabsContent value="tab1">Content 1</TabsContent>
      <TabsContent value="tab2">Content 2</TabsContent>
    </Tabs>
  );
}

describe("Tabs", () => {
  describe("smoke tests", () => {
    it("renders without crashing", () => {
      render(
        <Tabs defaultValue="tab1">
          <TabsList>
            <TabsTrigger value="tab1">Tab 1</TabsTrigger>
          </TabsList>
          <TabsContent value="tab1">Content 1</TabsContent>
        </Tabs>
      );
      expect(screen.getByRole("tablist")).toBeInTheDocument();
    });

    it("renders tab triggers", () => {
      renderTwoTabComponent();
      expect(screen.getByRole("tab", { name: "Tab 1" })).toBeInTheDocument();
      expect(screen.getByRole("tab", { name: "Tab 2" })).toBeInTheDocument();
    });

    it("renders default tab content", () => {
      renderTwoTabComponent();
      expect(screen.getByText("Content 1")).toBeInTheDocument();
    });
  });

  describe("tab switching", () => {
    it("switches content when clicking tabs", async () => {
      const user = userEvent.setup();
      renderTwoTabComponent();

      await user.click(screen.getByRole("tab", { name: "Tab 2" }));
      expect(screen.getByText("Content 2")).toBeInTheDocument();
    });

    it("marks active tab correctly", async () => {
      const user = userEvent.setup();
      renderTwoTabComponent();

      const tab1 = screen.getByRole("tab", { name: "Tab 1" });
      const tab2 = screen.getByRole("tab", { name: "Tab 2" });

      expect(tab1).toHaveAttribute("data-state", "active");
      expect(tab2).toHaveAttribute("data-state", "inactive");

      await user.click(tab2);

      expect(tab1).toHaveAttribute("data-state", "inactive");
      expect(tab2).toHaveAttribute("data-state", "active");
    });
  });

  describe("custom className", () => {
    it("applies custom className to TabsList", () => {
      render(
        <Tabs defaultValue="tab1">
          <TabsList className="custom-list-class">
            <TabsTrigger value="tab1">Tab 1</TabsTrigger>
          </TabsList>
          <TabsContent value="tab1">Content 1</TabsContent>
        </Tabs>
      );
      expect(screen.getByRole("tablist")).toHaveClass("custom-list-class");
    });

    it("applies custom className to TabsTrigger", () => {
      render(
        <Tabs defaultValue="tab1">
          <TabsList>
            <TabsTrigger className="custom-trigger-class" value="tab1">
              Tab 1
            </TabsTrigger>
          </TabsList>
          <TabsContent value="tab1">Content 1</TabsContent>
        </Tabs>
      );
      expect(screen.getByRole("tab", { name: "Tab 1" })).toHaveClass(
        "custom-trigger-class"
      );
    });

    it("applies custom className to TabsContent", () => {
      render(
        <Tabs defaultValue="tab1">
          <TabsList>
            <TabsTrigger value="tab1">Tab 1</TabsTrigger>
          </TabsList>
          <TabsContent className="custom-content-class" value="tab1">
            Content 1
          </TabsContent>
        </Tabs>
      );
      expect(screen.getByRole("tabpanel")).toHaveClass("custom-content-class");
    });
  });

  describe("accessibility", () => {
    it("has correct ARIA roles", () => {
      render(
        <Tabs defaultValue="tab1">
          <TabsList>
            <TabsTrigger value="tab1">Tab 1</TabsTrigger>
          </TabsList>
          <TabsContent value="tab1">Content 1</TabsContent>
        </Tabs>
      );
      expect(screen.getByRole("tablist")).toBeInTheDocument();
      expect(screen.getByRole("tab")).toBeInTheDocument();
      expect(screen.getByRole("tabpanel")).toBeInTheDocument();
    });

    it("supports keyboard navigation", async () => {
      const user = userEvent.setup();
      renderTwoTabComponent();

      const tab1 = screen.getByRole("tab", { name: "Tab 1" });
      tab1.focus();

      await user.keyboard("{ArrowRight}");
      expect(screen.getByRole("tab", { name: "Tab 2" })).toHaveFocus();
    });
  });
});
