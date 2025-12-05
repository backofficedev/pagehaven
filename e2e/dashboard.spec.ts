import { expect, test } from "@playwright/test";
import {
  createSite,
  generateSubdomain,
  generateTestUser,
  signUp,
} from "./fixtures";

// Regex patterns at module level for performance
const DASHBOARD_REGEX = /dashboard/i;
const WELCOME_REGEX = /welcome/i;
const GETTING_STARTED_REGEX = /getting started/i;
const CREATE_SITE_REGEX = /create.*site/i;
const VIEW_ALL_SITES_REGEX = /view all sites/i;
const RECENT_SITES_REGEX = /recent sites/i;
const NO_SITES_REGEX = /no sites yet/i;
const SITES_URL_REGEX = /sites/;
const SITE_DETAIL_URL_REGEX = /sites\/[a-f0-9-]+/;
const DASHBOARD_URL_REGEX = /dashboard/;
const ONE_SITE_REGEX = /1.*site/i;

test.describe("Dashboard", () => {
  test.describe("New User Dashboard", () => {
    test.beforeEach(async ({ page }) => {
      const user = generateTestUser();
      await signUp(page, user, expect);
    });

    test("shows welcome message", async ({ page }) => {
      await page.goto("/dashboard");

      await expect(page.getByText(WELCOME_REGEX)).toBeVisible();
    });

    test("shows getting started section for new users", async ({ page }) => {
      await page.goto("/dashboard");

      await expect(page.getByText(GETTING_STARTED_REGEX)).toBeVisible();
    });

    test("shows create site button", async ({ page }) => {
      await page.goto("/dashboard");

      await expect(
        page.getByRole("link", { name: CREATE_SITE_REGEX })
      ).toBeVisible();
    });

    test("shows empty state when no sites", async ({ page }) => {
      await page.goto("/dashboard");

      await expect(page.getByText(NO_SITES_REGEX)).toBeVisible();
    });

    test("can navigate to sites page", async ({ page }) => {
      await page.goto("/dashboard");

      await page.getByRole("link", { name: VIEW_ALL_SITES_REGEX }).click();

      await expect(page).toHaveURL(SITES_URL_REGEX);
    });
  });

  test.describe("Dashboard with Sites", () => {
    let siteName: string;
    let subdomain: string;

    test.beforeEach(async ({ page }) => {
      const user = generateTestUser();
      await signUp(page, user, expect);

      siteName = "Dashboard Test Site";
      subdomain = generateSubdomain();
      await createSite(page, { name: siteName, subdomain }, expect);
    });

    test("shows recent sites section", async ({ page }) => {
      await page.goto("/dashboard");

      await expect(page.getByText(RECENT_SITES_REGEX)).toBeVisible();
    });

    test("displays created site in recent sites", async ({ page }) => {
      await page.goto("/dashboard");

      await expect(page.getByText(siteName)).toBeVisible();
    });

    test("can click on site to view details", async ({ page }) => {
      await page.goto("/dashboard");

      await page.getByText(siteName).click();

      // Should navigate to site detail page
      await expect(page).toHaveURL(SITE_DETAIL_URL_REGEX);
    });

    test("shows site statistics", async ({ page }) => {
      await page.goto("/dashboard");

      // Should show at least the site count
      await expect(page.getByText(ONE_SITE_REGEX)).toBeVisible();
    });
  });

  test.describe("Dashboard Navigation", () => {
    test.beforeEach(async ({ page }) => {
      const user = generateTestUser();
      await signUp(page, user, expect);
    });

    test("dashboard link in header works", async ({ page }) => {
      await page.goto("/sites");

      await page.getByRole("link", { name: DASHBOARD_REGEX }).click();

      await expect(page).toHaveURL(DASHBOARD_URL_REGEX);
    });

    test("redirects to dashboard after login", async ({ page }) => {
      // Already signed up and redirected in beforeEach
      await expect(page).toHaveURL(DASHBOARD_URL_REGEX);
    });
  });
});
