import { expect, test } from "@playwright/test";
import {
  createSite,
  generateSubdomain,
  generateTestUser,
  signUp,
} from "./fixtures";

// Regex patterns at module level for performance
const ANALYTICS_REGEX = /analytics/i;
const TOTAL_VIEWS_REGEX = /total views/i;
const BANDWIDTH_REGEX = /bandwidth/i;
const UNIQUE_PAGES_REGEX = /unique pages/i;
const TOP_PAGES_REGEX = /top pages/i;
const DAILY_VIEWS_REGEX = /daily views/i;
const LAST_30_DAYS_REGEX = /last 30 days/i;
const BACK_REGEX = /back to/i;

test.describe("Site Analytics", () => {
  let siteName: string;
  let subdomain: string;

  test.beforeEach(async ({ page }) => {
    // Sign up a new user and create a site before each test
    const user = generateTestUser();
    await signUp(page, user, expect);

    siteName = "Analytics Test Site";
    subdomain = generateSubdomain();
    await createSite(page, { name: siteName, subdomain }, expect);
  });

  test.describe("Navigation", () => {
    test("can navigate to analytics page from site detail", async ({
      page,
    }) => {
      // Click on the site to go to detail page
      await page.getByText(siteName).click();

      // Click analytics button
      await page.getByRole("button", { name: ANALYTICS_REGEX }).click();

      // Should be on analytics page
      await expect(
        page.getByRole("heading", { name: ANALYTICS_REGEX })
      ).toBeVisible();
    });

    test("can navigate back from analytics", async ({ page }) => {
      await page.getByText(siteName).click();
      await page.getByRole("button", { name: ANALYTICS_REGEX }).click();

      // Click back link
      await page.getByText(BACK_REGEX).click();

      // Should be back on site detail
      await expect(page.getByText(siteName)).toBeVisible();
    });
  });

  test.describe("Analytics Display", () => {
    test("shows analytics summary section", async ({ page }) => {
      await page.getByText(siteName).click();
      await page.getByRole("button", { name: ANALYTICS_REGEX }).click();

      // Should show summary stats
      await expect(page.getByText(TOTAL_VIEWS_REGEX)).toBeVisible();
      await expect(page.getByText(BANDWIDTH_REGEX)).toBeVisible();
      await expect(page.getByText(UNIQUE_PAGES_REGEX)).toBeVisible();
    });

    test("shows time period indicator", async ({ page }) => {
      await page.getByText(siteName).click();
      await page.getByRole("button", { name: ANALYTICS_REGEX }).click();

      // Use first() to handle multiple matching elements
      await expect(page.getByText(LAST_30_DAYS_REGEX).first()).toBeVisible();
    });

    test("shows top pages section", async ({ page }) => {
      await page.getByText(siteName).click();
      await page.getByRole("button", { name: ANALYTICS_REGEX }).click();

      await expect(page.getByText(TOP_PAGES_REGEX)).toBeVisible();
    });

    test("shows daily views section", async ({ page }) => {
      await page.getByText(siteName).click();
      await page.getByRole("button", { name: ANALYTICS_REGEX }).click();

      await expect(page.getByText(DAILY_VIEWS_REGEX)).toBeVisible();
    });
  });

  test.describe("Empty State", () => {
    test("shows empty state for new site with no views", async ({ page }) => {
      await page.getByText(siteName).click();
      await page.getByRole("button", { name: ANALYTICS_REGEX }).click();

      // New site should show zero views in the Total Views card
      await expect(page.getByText("Total Views")).toBeVisible();
      // The value should be 0 for a new site - find the card containing "Total Views" and check for 0
      const totalViewsCard = page
        .locator('[data-slot="card"]')
        .filter({ hasText: "Total Views" });
      await expect(totalViewsCard.locator(".font-bold")).toContainText("0");
    });
  });
});
