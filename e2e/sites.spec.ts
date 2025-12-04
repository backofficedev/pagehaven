import { expect, test } from "@playwright/test";
import {
  createSite,
  generateSubdomain,
  generateTestUser,
  signUp,
} from "./fixtures";

// Regex patterns at module level for performance
const YOUR_SITES_REGEX = /your sites/i;
const NEW_SITE_REGEX = /new site/i;
const CREATE_NEW_SITE_REGEX = /create new site/i;
const CREATE_SITE_REGEX = /create site/i;
const CANCEL_REGEX = /cancel/i;
const NO_SITES_REGEX = /no sites yet/i;
const SITES_URL_REGEX = /sites/;
const SITE_DETAIL_URL_REGEX = /sites\/[a-f0-9-]+/;
const BACK_TO_SITES_REGEX = /back to sites/i;
const DEPLOY_REGEX = /deploy/i;
const SETTINGS_REGEX = /settings/i;
const ANALYTICS_REGEX = /analytics/i;
const NO_DEPLOYMENT_REGEX = /no deployment/i;
const SUBDOMAIN_TAKEN_REGEX = /subdomain.*taken|already.*taken/i;

test.describe("Sites Management", () => {
  test.beforeEach(async ({ page }) => {
    // Sign up a new user before each test
    const user = generateTestUser();
    await signUp(page, user, expect);
  });

  test.describe("Sites List", () => {
    test("shows empty state when no sites exist", async ({ page }) => {
      await page.goto("/sites");

      await expect(
        page.getByRole("heading", { name: YOUR_SITES_REGEX })
      ).toBeVisible();
      await expect(page.getByText(NO_SITES_REGEX)).toBeVisible();
    });

    test("shows new site button", async ({ page }) => {
      await page.goto("/sites");

      await expect(
        page.getByRole("button", { name: NEW_SITE_REGEX })
      ).toBeVisible();
    });

    test("can open create site form", async ({ page }) => {
      await page.goto("/sites");

      await page.getByRole("button", { name: NEW_SITE_REGEX }).click();

      await expect(
        page.getByRole("heading", { name: CREATE_NEW_SITE_REGEX })
      ).toBeVisible();
      await expect(page.locator("form #name")).toBeVisible();
      await expect(page.locator("form #subdomain")).toBeVisible();
    });

    test("can cancel create site form", async ({ page }) => {
      await page.goto("/sites");

      await page.getByRole("button", { name: NEW_SITE_REGEX }).click();
      await expect(page.locator("form #name")).toBeVisible();

      await page.getByRole("button", { name: CANCEL_REGEX }).click();

      // Form should be hidden
      await expect(page.locator("form #name")).not.toBeVisible();
    });
  });

  test.describe("Create Site", () => {
    test("can create a new site", async ({ page }) => {
      const siteName = "My Test Site";
      const subdomain = generateSubdomain();

      await page.goto("/sites");

      await page.getByRole("button", { name: NEW_SITE_REGEX }).click();

      await page.locator("form #name").fill(siteName);
      await page.locator("form #subdomain").fill(subdomain);

      await page
        .locator("form")
        .getByRole("button", { name: CREATE_SITE_REGEX })
        .click();

      // Should show the new site in the list
      await expect(page.getByText(siteName)).toBeVisible({ timeout: 10_000 });
    });

    test("shows error for duplicate subdomain", async ({ page }) => {
      const siteName1 = "First Site";
      const siteName2 = "Second Site";
      const subdomain = generateSubdomain();

      await page.goto("/sites");

      // Create first site
      await page.getByRole("button", { name: NEW_SITE_REGEX }).click();
      await page.locator("form #name").fill(siteName1);
      await page.locator("form #subdomain").fill(subdomain);
      await page
        .locator("form")
        .getByRole("button", { name: CREATE_SITE_REGEX })
        .click();

      await expect(page.getByText(siteName1)).toBeVisible({ timeout: 10_000 });

      // Try to create second site with same subdomain
      await page.getByRole("button", { name: NEW_SITE_REGEX }).click();
      await page.locator("form #name").fill(siteName2);
      await page.locator("form #subdomain").fill(subdomain);
      await page
        .locator("form")
        .getByRole("button", { name: CREATE_SITE_REGEX })
        .click();

      // Should show error
      await expect(page.getByText(SUBDOMAIN_TAKEN_REGEX)).toBeVisible({
        timeout: 5000,
      });
    });

    test("validates subdomain format", async ({ page }) => {
      await page.goto("/sites");

      await page.getByRole("button", { name: NEW_SITE_REGEX }).click();

      await page.locator("form #name").fill("Test Site");

      // Try invalid subdomain with uppercase
      await page.locator("form #subdomain").fill("Invalid-Subdomain");

      // The input should have pattern validation
      const subdomainInput = page.locator("form #subdomain");
      await expect(subdomainInput).toHaveAttribute(
        "pattern",
        "^[a-z0-9]([a-z0-9-]*[a-z0-9])?$"
      );
    });
  });

  test.describe("Site Detail", () => {
    test("can navigate to site detail page", async ({ page }) => {
      const siteName = "Detail Test Site";
      const subdomain = generateSubdomain();

      await createSite(page, { name: siteName, subdomain }, expect);

      // Click on the site card
      await page.getByText(siteName).click();

      // Should be on site detail page
      await expect(page).toHaveURL(SITE_DETAIL_URL_REGEX);
      await expect(page.getByRole("heading", { name: siteName })).toBeVisible();
    });

    test("shows site status and actions", async ({ page }) => {
      const siteName = "Status Test Site";
      const subdomain = generateSubdomain();

      await createSite(page, { name: siteName, subdomain }, expect);
      await page.getByText(siteName).click();

      // Should show status (no deployment for new site)
      await expect(page.getByText(NO_DEPLOYMENT_REGEX)).toBeVisible();

      // Should show action buttons
      await expect(
        page.getByRole("button", { name: DEPLOY_REGEX })
      ).toBeVisible();
      await expect(
        page.getByRole("button", { name: ANALYTICS_REGEX })
      ).toBeVisible();
      await expect(
        page.getByRole("button", { name: SETTINGS_REGEX })
      ).toBeVisible();
    });

    test("can navigate back to sites list", async ({ page }) => {
      const siteName = "Back Nav Test Site";
      const subdomain = generateSubdomain();

      await createSite(page, { name: siteName, subdomain }, expect);
      await page.getByText(siteName).click();

      // Click back link
      await page.getByRole("link", { name: BACK_TO_SITES_REGEX }).click();

      // Should be back on sites list
      await expect(page).toHaveURL(SITES_URL_REGEX);
      await expect(
        page.getByRole("heading", { name: YOUR_SITES_REGEX })
      ).toBeVisible();
    });

    test("shows subdomain in site detail", async ({ page }) => {
      const siteName = "Subdomain Display Test";
      const subdomain = generateSubdomain();

      await createSite(page, { name: siteName, subdomain }, expect);
      await page.getByText(siteName).click();

      // Should show the subdomain
      await expect(page.getByText(subdomain)).toBeVisible();
    });
  });

  test.describe("Multiple Sites", () => {
    test("can create and list multiple sites", async ({ page }) => {
      const sites = [
        { name: "Site One", subdomain: generateSubdomain() },
        { name: "Site Two", subdomain: generateSubdomain() },
        { name: "Site Three", subdomain: generateSubdomain() },
      ];

      for (const site of sites) {
        await createSite(page, site, expect);
      }

      // All sites should be visible
      for (const site of sites) {
        await expect(page.getByText(site.name)).toBeVisible();
      }
    });
  });
});
