import { expect, test } from "@playwright/test";
import {
  createSite,
  generateSubdomain,
  generateTestUser,
  signUp,
} from "./fixtures";

// Regex patterns at module level for performance
const SETTINGS_REGEX = /settings/i;
const ACCESS_CONTROL_REGEX = /access control/i;
const UPDATE_ACCESS_REGEX = /update access/i;
const PUBLIC_REGEX = /public/i;
const PASSWORD_PROTECTED_REGEX = /password protected/i;
const PRIVATE_REGEX = /private/i;
const OWNER_ONLY_REGEX = /owner only/i;
const INVITE_REGEX = /^invite$/i;
const SUCCESS_REGEX = /success|updated/i;
const NO_INVITES_REGEX = /no invites yet/i;

test.describe("Site Access Control", () => {
  let siteName: string;
  let subdomain: string;

  test.beforeEach(async ({ page }) => {
    const user = generateTestUser();
    await signUp(page, user, expect);

    siteName = "Access Control Test Site";
    subdomain = generateSubdomain();
    await createSite(page, { name: siteName, subdomain }, expect);

    // Navigate to settings
    await page.getByText(siteName).click();
    await page.getByRole("button", { name: SETTINGS_REGEX }).click();
  });

  test.describe("Access Type Changes", () => {
    test("can change from public to password protected", async ({ page }) => {
      // Verify we're on settings page
      await expect(page.getByText(ACCESS_CONTROL_REGEX)).toBeVisible();

      // Select password protected
      await page.getByText(PASSWORD_PROTECTED_REGEX).click();

      // Password input should appear - use ID selector
      await expect(page.locator("#password")).toBeVisible();

      // Enter password
      await page.locator("#password").fill("testpassword123");

      // Update access
      await page.getByRole("button", { name: UPDATE_ACCESS_REGEX }).click();

      // Wait for success
      await expect(page.getByText(SUCCESS_REGEX)).toBeVisible({
        timeout: 10_000,
      });
    });

    test("can change from public to private", async ({ page }) => {
      await expect(page.getByText(ACCESS_CONTROL_REGEX)).toBeVisible();

      // Select private
      await page.getByText(PRIVATE_REGEX).click();

      // Update access
      await page.getByRole("button", { name: UPDATE_ACCESS_REGEX }).click();

      // Wait for success
      await expect(page.getByText(SUCCESS_REGEX)).toBeVisible({
        timeout: 10_000,
      });

      // Invite section should now be visible
      await expect(
        page.getByText("Invited Users", { exact: true })
      ).toBeVisible();
    });

    test("can change from public to owner only", async ({ page }) => {
      await expect(page.getByText(ACCESS_CONTROL_REGEX)).toBeVisible();

      // Select owner only
      await page.getByText(OWNER_ONLY_REGEX).click();

      // Update access
      await page.getByRole("button", { name: UPDATE_ACCESS_REGEX }).click();

      // Wait for success
      await expect(page.getByText(SUCCESS_REGEX)).toBeVisible({
        timeout: 10_000,
      });
    });

    test("password field hidden when not password protected", async ({
      page,
    }) => {
      // Initially public, password field should not be visible
      await expect(page.locator("#password")).not.toBeVisible();

      // Select password protected
      await page.getByText(PASSWORD_PROTECTED_REGEX).click();
      await expect(page.locator("#password")).toBeVisible();

      // Switch back to public
      await page.getByText(PUBLIC_REGEX).click();
      await expect(page.locator("#password")).not.toBeVisible();
    });
  });

  test.describe("Private Site Invites", () => {
    test.beforeEach(async ({ page }) => {
      // Set site to private first
      await page.getByText(PRIVATE_REGEX).click();
      await page.getByRole("button", { name: UPDATE_ACCESS_REGEX }).click();
      await expect(page.getByText(SUCCESS_REGEX)).toBeVisible({
        timeout: 10_000,
      });
    });

    test("shows invite section for private sites", async ({ page }) => {
      // Use exact match to avoid matching description text
      await expect(
        page.getByText("Invited Users", { exact: true })
      ).toBeVisible();
      await expect(page.getByPlaceholder("user@example.com")).toBeVisible();
      await expect(
        page.getByRole("button", { name: INVITE_REGEX })
      ).toBeVisible();
    });

    test("can invite a user to private site", async ({ page }) => {
      const inviteEmail = "invited@example.com";

      await page.getByPlaceholder("user@example.com").fill(inviteEmail);
      await page.getByRole("button", { name: INVITE_REGEX }).click();

      // Wait for success
      await expect(page.getByText(SUCCESS_REGEX)).toBeVisible({
        timeout: 10_000,
      });

      // Invited email should appear in list
      await expect(page.getByText(inviteEmail)).toBeVisible();
    });

    test("can remove an invited user", async ({ page }) => {
      const inviteEmail = "toremove@example.com";

      // First invite a user
      await page.getByPlaceholder("user@example.com").fill(inviteEmail);
      await page.getByRole("button", { name: INVITE_REGEX }).click();
      await expect(page.getByText(inviteEmail)).toBeVisible({
        timeout: 10_000,
      });

      // Find and click the remove button (X icon) for this invite
      const inviteRow = page.locator("div").filter({ hasText: inviteEmail });
      const removeButton = inviteRow.getByRole("button");
      await removeButton.click();

      // Wait for success
      await expect(page.getByText(SUCCESS_REGEX)).toBeVisible({
        timeout: 10_000,
      });

      // Email should no longer be visible
      await expect(page.getByText(inviteEmail)).not.toBeVisible();
    });

    test("invite button disabled without email", async ({ page }) => {
      const inviteButton = page.getByRole("button", { name: INVITE_REGEX });

      // Button should be disabled when email is empty
      await expect(inviteButton).toBeDisabled();

      // Enter email
      await page.getByPlaceholder("user@example.com").fill("test@example.com");

      // Button should now be enabled
      await expect(inviteButton).toBeEnabled();
    });

    test("shows no invites message when empty", async ({ page }) => {
      await expect(page.getByText(NO_INVITES_REGEX)).toBeVisible();
    });
  });

  test.describe("Access Type Persistence", () => {
    test("access type persists after page reload", async ({ page }) => {
      // Change to password protected
      await page.getByText(PASSWORD_PROTECTED_REGEX).click();
      await page.locator("#password").fill("secret123");
      await page.getByRole("button", { name: UPDATE_ACCESS_REGEX }).click();
      await expect(page.getByText(SUCCESS_REGEX)).toBeVisible({
        timeout: 10_000,
      });

      // Reload page
      await page.reload();

      // Password protected should still be selected
      const passwordOption = page.getByText(PASSWORD_PROTECTED_REGEX);
      await expect(passwordOption).toBeVisible();

      // The radio should be checked (verify by checking if password field is visible)
      await expect(page.locator("#password")).toBeVisible();
    });

    test("private site shows invites after reload", async ({ page }) => {
      // Change to private
      await page.getByText(PRIVATE_REGEX).click();
      await page.getByRole("button", { name: UPDATE_ACCESS_REGEX }).click();
      await expect(page.getByText(SUCCESS_REGEX)).toBeVisible({
        timeout: 10_000,
      });

      // Reload page
      await page.reload();

      // Invite section should still be visible
      await expect(
        page.getByText("Invited Users", { exact: true })
      ).toBeVisible();
    });
  });

  test.describe("Access Type Visual Feedback", () => {
    test("selected access type is visually highlighted", async ({ page }) => {
      // Click on private option - use exact text match
      await page.getByText("Private", { exact: true }).click();

      // The label containing "Private" should have some visual indication
      const privateLabel = page.locator("label").filter({ hasText: "Private" });
      await expect(privateLabel.first()).toBeVisible();

      // The radio input should be checked
      const radioInput = privateLabel.first().locator('input[type="radio"]');
      await expect(radioInput).toBeChecked();
    });

    test("only one access type can be selected at a time", async ({ page }) => {
      // Click private - use exact text match
      await page.getByText("Private", { exact: true }).click();
      let privateRadio = page
        .locator("label")
        .filter({ hasText: "Private" })
        .first()
        .locator('input[type="radio"]');
      await expect(privateRadio).toBeChecked();

      // Click public - use exact text match
      await page.getByText("Public", { exact: true }).click();
      const publicRadio = page
        .locator("label")
        .filter({ hasText: "Public" })
        .first()
        .locator('input[type="radio"]');
      await expect(publicRadio).toBeChecked();

      // Private should no longer be checked
      privateRadio = page
        .locator("label")
        .filter({ hasText: "Private" })
        .first()
        .locator('input[type="radio"]');
      await expect(privateRadio).not.toBeChecked();
    });
  });
});
