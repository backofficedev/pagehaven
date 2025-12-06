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
const ACCESS_SUCCESS_REGEX = /access settings updated/i;
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
      await expect(page.getByText(ACCESS_SUCCESS_REGEX)).toBeVisible({
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
      await expect(page.getByText(ACCESS_SUCCESS_REGEX)).toBeVisible({
        timeout: 10_000,
      });

      // Wait for the invite section to appear (it renders when accessType === "private")
      // The local state is already "private" from clicking the radio, so section should show
      await expect(
        page.getByText("Invited Users", { exact: true })
      ).toBeVisible({ timeout: 5000 });
    });

    test("can change from public to owner only", async ({ page }) => {
      await expect(page.getByText(ACCESS_CONTROL_REGEX)).toBeVisible();

      // Select owner only
      await page.getByText(OWNER_ONLY_REGEX).click();

      // Update access
      await page.getByRole("button", { name: UPDATE_ACCESS_REGEX }).click();

      // Wait for success
      await expect(page.getByText(ACCESS_SUCCESS_REGEX)).toBeVisible({
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
      // Wait for the Access Control section to be fully loaded
      await expect(
        page.getByText("Access Control", { exact: true })
      ).toBeVisible({
        timeout: 10_000,
      });

      // Set site to private first - click the radio input directly for reliability
      const privateRadio = page.locator('input[type="radio"][value="private"]');
      await expect(privateRadio).toBeVisible({ timeout: 5000 });
      await privateRadio.click();

      // Verify the invite section appears (confirms local state is "private")
      await expect(
        page.getByText("Invited Users", { exact: true })
      ).toBeVisible({ timeout: 10_000 });

      // Now submit the form to persist the change
      await page.getByRole("button", { name: UPDATE_ACCESS_REGEX }).click();

      // Wait for mutation to complete
      await page.waitForLoadState("networkidle");
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

      // Wait for invite input to be visible (confirms beforeEach completed)
      const inviteInput = page.getByPlaceholder("user@example.com");
      await expect(inviteInput).toBeVisible({ timeout: 10_000 });

      await inviteInput.fill(inviteEmail);
      await page.getByRole("button", { name: INVITE_REGEX }).click();

      // Wait for success - use specific invite success message
      await expect(page.getByText("Invite sent")).toBeVisible({
        timeout: 10_000,
      });

      // Invited email should appear in list
      await expect(page.getByText(inviteEmail)).toBeVisible();
    });

    test("can remove an invited user", async ({ page }) => {
      const inviteEmail = "toremove@example.com";

      // Wait for invite input to be visible (confirms beforeEach completed)
      const inviteInput = page.getByPlaceholder("user@example.com");
      await expect(inviteInput).toBeVisible({ timeout: 10_000 });

      // First invite a user
      await inviteInput.fill(inviteEmail);
      await page.getByRole("button", { name: INVITE_REGEX }).click();
      await expect(page.getByText(inviteEmail)).toBeVisible({
        timeout: 10_000,
      });

      // Find and click the remove button (X icon) for this invite
      // The invite row has the email in a paragraph, find the row containing it
      // and click the last button (the X button, not the Invite button)
      const inviteRow = page
        .locator("p", { hasText: inviteEmail })
        .locator("..");
      // The X button is a sibling of the div containing the email
      await inviteRow.locator("..").getByRole("button").last().click();

      // Wait for success - use specific invite removed message
      await expect(page.getByText("Invite removed")).toBeVisible({
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
      // Change to password protected - click radio directly for reliability
      const passwordRadio = page.locator(
        'input[type="radio"][value="password"]'
      );
      await passwordRadio.click();

      // Verify password field appears (confirms local state change)
      await expect(page.locator("#password")).toBeVisible({ timeout: 5000 });
      await page.locator("#password").fill("secret123");

      // Submit the form
      await page.getByRole("button", { name: UPDATE_ACCESS_REGEX }).click();

      // Wait for mutation to complete
      await page.waitForLoadState("networkidle");

      // Reload page
      await page.reload();

      // Wait for page to load and access query to complete
      await expect(
        page.getByText("Access Control", { exact: true })
      ).toBeVisible({
        timeout: 10_000,
      });

      // The password field should be visible after reload (confirms access type persisted)
      await expect(page.locator("#password")).toBeVisible({ timeout: 10_000 });
    });

    test("private site shows invites after reload", async ({ page }) => {
      // Change to private - use exact text match to avoid matching description
      await page.getByText("Private", { exact: true }).click();
      await page.getByRole("button", { name: UPDATE_ACCESS_REGEX }).click();
      await expect(page.getByText(ACCESS_SUCCESS_REGEX)).toBeVisible({
        timeout: 10_000,
      });

      // Wait for the invite section to appear before reload (confirms mutation completed)
      // The section should appear because local state is now "private"
      await expect(
        page.getByText("Invited Users", { exact: true })
      ).toBeVisible({ timeout: 10_000 });

      // Wait for network to be idle to ensure mutation is persisted
      await page.waitForLoadState("networkidle");

      // Reload page
      await page.reload();

      // Wait for page to load and access query to complete - use exact match to avoid matching back link
      await expect(
        page.getByText("Access Control", { exact: true })
      ).toBeVisible({
        timeout: 10_000,
      });

      // Invite section should still be visible after reload
      await expect(
        page.getByText("Invited Users", { exact: true })
      ).toBeVisible({ timeout: 10_000 });
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
