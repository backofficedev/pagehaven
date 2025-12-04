import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "./card";

describe("Card", () => {
  describe("smoke tests", () => {
    it("renders without crashing", () => {
      render(<Card>Card Content</Card>);
      expect(screen.getByText("Card Content")).toBeInTheDocument();
    });

    it("has correct data-slot attribute", () => {
      render(<Card data-testid="card">Content</Card>);
      expect(screen.getByTestId("card")).toHaveAttribute("data-slot", "card");
    });
  });

  describe("styling", () => {
    it("has default styling classes", () => {
      render(<Card data-testid="card">Content</Card>);
      const card = screen.getByTestId("card");
      expect(card).toHaveClass("flex");
      expect(card).toHaveClass("flex-col");
      expect(card).toHaveClass("rounded-xl");
      expect(card).toHaveClass("border");
      expect(card).toHaveClass("shadow-sm");
    });

    it("merges custom className", () => {
      render(
        <Card className="custom-class" data-testid="card">
          Content
        </Card>
      );
      const card = screen.getByTestId("card");
      expect(card).toHaveClass("custom-class");
      expect(card).toHaveClass("rounded-xl");
    });
  });

  describe("children", () => {
    it("renders children elements", () => {
      render(
        <Card>
          <span data-testid="child">Child</span>
        </Card>
      );
      expect(screen.getByTestId("child")).toBeInTheDocument();
    });
  });
});

describe("CardHeader", () => {
  describe("smoke tests", () => {
    it("renders without crashing", () => {
      render(<CardHeader>Header Content</CardHeader>);
      expect(screen.getByText("Header Content")).toBeInTheDocument();
    });

    it("has correct data-slot attribute", () => {
      render(<CardHeader data-testid="header">Content</CardHeader>);
      expect(screen.getByTestId("header")).toHaveAttribute(
        "data-slot",
        "card-header"
      );
    });
  });

  describe("styling", () => {
    it("has grid layout classes", () => {
      render(<CardHeader data-testid="header">Content</CardHeader>);
      const header = screen.getByTestId("header");
      expect(header).toHaveClass("grid");
      expect(header).toHaveClass("px-6");
    });

    it("merges custom className", () => {
      render(
        <CardHeader className="custom-header" data-testid="header">
          Content
        </CardHeader>
      );
      expect(screen.getByTestId("header")).toHaveClass("custom-header");
    });
  });
});

describe("CardTitle", () => {
  describe("smoke tests", () => {
    it("renders without crashing", () => {
      render(<CardTitle>Title</CardTitle>);
      expect(screen.getByText("Title")).toBeInTheDocument();
    });

    it("has correct data-slot attribute", () => {
      render(<CardTitle data-testid="title">Title</CardTitle>);
      expect(screen.getByTestId("title")).toHaveAttribute(
        "data-slot",
        "card-title"
      );
    });
  });

  describe("styling", () => {
    it("has font styling classes", () => {
      render(<CardTitle data-testid="title">Title</CardTitle>);
      const title = screen.getByTestId("title");
      expect(title).toHaveClass("font-semibold");
      expect(title).toHaveClass("leading-none");
    });
  });
});

describe("CardDescription", () => {
  describe("smoke tests", () => {
    it("renders without crashing", () => {
      render(<CardDescription>Description text</CardDescription>);
      expect(screen.getByText("Description text")).toBeInTheDocument();
    });

    it("has correct data-slot attribute", () => {
      render(<CardDescription data-testid="desc">Desc</CardDescription>);
      expect(screen.getByTestId("desc")).toHaveAttribute(
        "data-slot",
        "card-description"
      );
    });
  });

  describe("styling", () => {
    it("has muted text styling", () => {
      render(<CardDescription data-testid="desc">Desc</CardDescription>);
      const desc = screen.getByTestId("desc");
      expect(desc).toHaveClass("text-muted-foreground");
      expect(desc).toHaveClass("text-sm");
    });
  });
});

describe("CardAction", () => {
  describe("smoke tests", () => {
    it("renders without crashing", () => {
      render(<CardAction>Action</CardAction>);
      expect(screen.getByText("Action")).toBeInTheDocument();
    });

    it("has correct data-slot attribute", () => {
      render(<CardAction data-testid="action">Action</CardAction>);
      expect(screen.getByTestId("action")).toHaveAttribute(
        "data-slot",
        "card-action"
      );
    });
  });

  describe("styling", () => {
    it("has grid positioning classes", () => {
      render(<CardAction data-testid="action">Action</CardAction>);
      const action = screen.getByTestId("action");
      expect(action).toHaveClass("col-start-2");
      expect(action).toHaveClass("row-span-2");
      expect(action).toHaveClass("self-start");
    });
  });
});

describe("CardContent", () => {
  describe("smoke tests", () => {
    it("renders without crashing", () => {
      render(<CardContent>Content</CardContent>);
      expect(screen.getByText("Content")).toBeInTheDocument();
    });

    it("has correct data-slot attribute", () => {
      render(<CardContent data-testid="content">Content</CardContent>);
      expect(screen.getByTestId("content")).toHaveAttribute(
        "data-slot",
        "card-content"
      );
    });
  });

  describe("styling", () => {
    it("has padding classes", () => {
      render(<CardContent data-testid="content">Content</CardContent>);
      expect(screen.getByTestId("content")).toHaveClass("px-6");
    });
  });
});

describe("CardFooter", () => {
  describe("smoke tests", () => {
    it("renders without crashing", () => {
      render(<CardFooter>Footer</CardFooter>);
      expect(screen.getByText("Footer")).toBeInTheDocument();
    });

    it("has correct data-slot attribute", () => {
      render(<CardFooter data-testid="footer">Footer</CardFooter>);
      expect(screen.getByTestId("footer")).toHaveAttribute(
        "data-slot",
        "card-footer"
      );
    });
  });

  describe("styling", () => {
    it("has flex and padding classes", () => {
      render(<CardFooter data-testid="footer">Footer</CardFooter>);
      const footer = screen.getByTestId("footer");
      expect(footer).toHaveClass("flex");
      expect(footer).toHaveClass("items-center");
      expect(footer).toHaveClass("px-6");
    });
  });
});

describe("Card composition", () => {
  it("renders complete card with all subcomponents", () => {
    render(
      <Card data-testid="card">
        <CardHeader>
          <CardTitle>Card Title</CardTitle>
          <CardDescription>Card description text</CardDescription>
          <CardAction>
            <button type="button">Action</button>
          </CardAction>
        </CardHeader>
        <CardContent>Main content goes here</CardContent>
        <CardFooter>
          <button type="button">Submit</button>
        </CardFooter>
      </Card>
    );

    expect(screen.getByTestId("card")).toBeInTheDocument();
    expect(screen.getByText("Card Title")).toBeInTheDocument();
    expect(screen.getByText("Card description text")).toBeInTheDocument();
    expect(screen.getByText("Main content goes here")).toBeInTheDocument();
    expect(screen.getByText("Submit")).toBeInTheDocument();
  });
});
