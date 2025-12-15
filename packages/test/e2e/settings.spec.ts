import { expect, test } from "@playwright/test";
import {
  createSite,
  generateSubdomain,
  generateTestUser,
  navigateToSiteSettings,
  signUp,
} from "./fixtures";

// Regex patterns at module level for performance
const GENERAL_REGEX = /general/i;
const ACCESS_CONTROL_REGEX = /access control/i;
const DANGER_ZONE_REGEX = /danger zone/i;
const SAVE_CHANGES_REGEX = /save changes/i;
const DELETE_SITE_REGEX = /delete site/i;
const SITE_NAME_REGEX = /site name/i;
const DESCRIPTION_REGEX = /description/i;
const PUBLIC_REGEX = /public/i;
const PASSWORD_PROTECTED_REGEX = /password protected/i;
const PRIVATE_REGEX = /private/i;
const OWNER_ONLY_REGEX = /owner only/i;
const BACK_REGEX = /back to/i;
const ARE_YOU_SURE_REGEX = /are you sure/i;
const CANCEL_REGEX = /cancel/i;
const SITE_UPDATED_REGEX = /site updated successfully/i;

test.describe("Site Settings", () => {
  let siteName: string;
  let subdomain: string;

  test.beforeEach(async ({ page }) => {
    // Sign up a new user and create a site before each test
    const user = generateTestUser();
    await signUp(page, user, expect);

    siteName = "Settings Test Site";
    subdomain = generateSubdomain();
    await createSite(page, { name: siteName, subdomain }, expect);
  });

  test.describe("Navigation", () => {
    test("can navigate to settings page from site detail", async ({ page }) => {
      await navigateToSiteSettings(page, siteName, expect);
    });

    test("can navigate back from settings", async ({ page }) => {
      await navigateToSiteSettings(page, siteName, expect);

      // Click back link
      await page.getByText(BACK_REGEX).click();

      // Should be back on site detail
      await expect(page.getByText(siteName)).toBeVisible();
    });
  });

  test.describe("General Settings", () => {
    test("displays general settings section", async ({ page }) => {
      await navigateToSiteSettings(page, siteName, expect);

      await expect(page.getByText(GENERAL_REGEX)).toBeVisible();
      await expect(page.getByLabel(SITE_NAME_REGEX)).toBeVisible();
      await expect(page.getByLabel(DESCRIPTION_REGEX)).toBeVisible();
    });

    test("can update site name", async ({ page }) => {
      await navigateToSiteSettings(page, siteName, expect);

      const newName = "Updated Site Name";
      const siteNameInput = page.getByLabel(SITE_NAME_REGEX);

      // Clear and fill - use fill('') first for reliable clearing
      await siteNameInput.fill("");
      await siteNameInput.fill(newName);

      await page.getByRole("button", { name: SAVE_CHANGES_REGEX }).click();

      // Wait for success toast to confirm mutation completed
      await expect(page.getByText(SITE_UPDATED_REGEX)).toBeVisible();

      // Verify the input still has the new value
      await expect(siteNameInput).toHaveValue(newName);
    });
  });

  test.describe("Access Control", () => {
    test("displays access control section", async ({ page }) => {
      await navigateToSiteSettings(page, siteName, expect);

      await expect(page.getByText(ACCESS_CONTROL_REGEX)).toBeVisible();
    });

    test("shows all access type options", async ({ page }) => {
      await navigateToSiteSettings(page, siteName, expect);

      await expect(page.getByText(PUBLIC_REGEX)).toBeVisible();
      await expect(page.getByText(PASSWORD_PROTECTED_REGEX)).toBeVisible();
      await expect(page.getByText(PRIVATE_REGEX)).toBeVisible();
      await expect(page.getByText(OWNER_ONLY_REGEX)).toBeVisible();
    });

    test("can select different access types", async ({ page }) => {
      await navigateToSiteSettings(page, siteName, expect);

      // Click on Password Protected option
      await page.getByText(PASSWORD_PROTECTED_REGEX).click();

      // Should show password input - use specific ID selector
      await expect(page.locator("#password")).toBeVisible();
    });
  });

  test.describe("Danger Zone", () => {
    test("displays danger zone section", async ({ page }) => {
      await navigateToSiteSettings(page, siteName, expect);

      await expect(page.getByText(DANGER_ZONE_REGEX)).toBeVisible();
      await expect(
        page.getByRole("button", { name: DELETE_SITE_REGEX })
      ).toBeVisible();
    });

    test("shows confirmation when delete is clicked", async ({ page }) => {
      await navigateToSiteSettings(page, siteName, expect);

      await page.getByRole("button", { name: DELETE_SITE_REGEX }).click();

      // Should show confirmation
      await expect(page.getByText(ARE_YOU_SURE_REGEX)).toBeVisible();
      await expect(
        page.getByRole("button", { name: CANCEL_REGEX })
      ).toBeVisible();
    });

    test("can cancel delete confirmation", async ({ page }) => {
      await navigateToSiteSettings(page, siteName, expect);

      await page.getByRole("button", { name: DELETE_SITE_REGEX }).click();
      await page.getByRole("button", { name: CANCEL_REGEX }).click();

      // Confirmation should be hidden
      await expect(page.getByText(ARE_YOU_SURE_REGEX)).not.toBeVisible();
    });
  });
});
