import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
  CardSkeleton,
  FormSkeleton,
  ListSkeleton,
  PageHeaderSkeleton,
  PageSkeleton,
  StatsSkeleton,
  TableSkeleton,
} from "./loading-skeletons";

describe("Loading Skeletons", () => {
  describe("CardSkeleton", () => {
    it("renders skeleton elements", () => {
      render(<CardSkeleton />);
      const skeletons = screen.getAllByTestId("skeleton");
      expect(skeletons.length).toBeGreaterThan(0);
    });
  });

  describe("FormSkeleton", () => {
    it("renders default 3 fields", () => {
      render(<FormSkeleton />);
      const skeletons = screen.getAllByTestId("skeleton");
      // 3 fields * 2 skeletons each + 1 button = 7
      expect(skeletons.length).toBe(7);
    });

    it("renders custom number of fields", () => {
      render(<FormSkeleton fields={5} />);
      const skeletons = screen.getAllByTestId("skeleton");
      // 5 fields * 2 skeletons each + 1 button = 11
      expect(skeletons.length).toBe(11);
    });
  });

  describe("TableSkeleton", () => {
    it("renders default 5 rows and 4 columns", () => {
      render(<TableSkeleton />);
      const skeletons = screen.getAllByTestId("skeleton");
      // 4 header + (5 rows * 4 columns) = 24
      expect(skeletons.length).toBe(24);
    });

    it("renders custom rows and columns", () => {
      render(<TableSkeleton columns={3} rows={2} />);
      const skeletons = screen.getAllByTestId("skeleton");
      // 3 header + (2 rows * 3 columns) = 9
      expect(skeletons.length).toBe(9);
    });
  });

  describe("ListSkeleton", () => {
    it("renders default 3 items", () => {
      render(<ListSkeleton />);
      const skeletons = screen.getAllByTestId("skeleton");
      // 3 items * 4 skeletons each = 12
      expect(skeletons.length).toBe(12);
    });

    it("renders custom number of items", () => {
      render(<ListSkeleton items={5} />);
      const skeletons = screen.getAllByTestId("skeleton");
      // 5 items * 4 skeletons each = 20
      expect(skeletons.length).toBe(20);
    });
  });

  describe("PageHeaderSkeleton", () => {
    it("renders title and description skeletons", () => {
      render(<PageHeaderSkeleton />);
      const skeletons = screen.getAllByTestId("skeleton");
      expect(skeletons.length).toBe(2);
    });
  });

  describe("StatsSkeleton", () => {
    it("renders default 4 stat cards", () => {
      render(<StatsSkeleton />);
      const skeletons = screen.getAllByTestId("skeleton");
      // 4 cards * 2 skeletons each = 8
      expect(skeletons.length).toBe(8);
    });

    it("renders custom number of stat cards", () => {
      render(<StatsSkeleton count={2} />);
      const skeletons = screen.getAllByTestId("skeleton");
      // 2 cards * 2 skeletons each = 4
      expect(skeletons.length).toBe(4);
    });
  });

  describe("PageSkeleton", () => {
    it("renders header and card skeletons", () => {
      render(<PageSkeleton />);
      const skeletons = screen.getAllByTestId("skeleton");
      // PageHeaderSkeleton (2) + CardSkeleton (5) = 7
      expect(skeletons.length).toBe(7);
    });
  });
});
