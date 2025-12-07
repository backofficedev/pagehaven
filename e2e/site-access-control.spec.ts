import { expect, test } from "@playwright/test";
import {
  createSite,
  generateSubdomain,
  generateTestUser,
  signUp,
} from "./fixtures";

// Regex patterns at module level for performance
const SETTINGS_REGEX = /settings/i;
const UPDATE_ACCESS_REGEX = /update access/i;
const PUBLIC_REGEX = /public/i;
const PASSWORD_PROTECTED_REGEX = /password protected/i;
const OWNER_ONLY_REGEX = /owner only/i;
const INVITE_REGEX = /^invite$/i;
const ACCESS_SUCCESS_REGEX = /access settings updated/i;
const NO_INVITES_REGEX = /no invites yet/i;

/**
 * Helper to submit access form and reload page, then wait for page to load
 */
async function submitAccessAndReload(
  page: import("@playwright/test").Page,
  expectFn: typeof expect
) {
  await page.getByRole("button", { name: UPDATE_ACCESS_REGEX }).click();
  await expectFn(page.getByText(ACCESS_SUCCESS_REGEX)).toBeVisible();
  await page.reload();
  await expectFn(
    page.getByText("Access Control", { exact: true })
  ).toBeVisible();
}

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

    // Wait for settings page to fully load - Access Control section should be visible
    await expect(
      page.getByText("Access Control", { exact: true })
    ).toBeVisible();

    // Wait for access query to load - public radio should be checked by default
    const publicRadio = page.locator('input[type="radio"][value="public"]');
    await expect(publicRadio).toBeChecked();
  });

  test.describe("Access Type Changes", () => {
    test("can change from public to password protected", async ({ page }) => {
      // Verify we're on settings page - use exact match to avoid matching back link
      await expect(
        page.getByText("Access Control", { exact: true })
      ).toBeVisible();

      // Select password protected
      await page.getByText(PASSWORD_PROTECTED_REGEX).click();

      // Password input should appear - use ID selector
      await expect(page.locator("#password")).toBeVisible();

      // Enter password
      await page.locator("#password").fill("testpassword123");

      // Update access
      await page.getByRole("button", { name: UPDATE_ACCESS_REGEX }).click();

      // Wait for success toast
      await expect(page.getByText(ACCESS_SUCCESS_REGEX)).toBeVisible();
    });

    test("can change from public to private", async ({ page }) => {
      // Verify we're on settings page - use exact match to avoid matching back link
      await expect(
        page.getByText("Access Control", { exact: true })
      ).toBeVisible();

      // Select private - click radio directly for reliability
      const privateRadio = page.locator('input[type="radio"][value="private"]');
      await privateRadio.click();

      // Wait for radio to be checked (confirms click was processed)
      await expect(privateRadio).toBeChecked();

      // Update access
      await page.getByRole("button", { name: UPDATE_ACCESS_REGEX }).click();

      // Wait for success toast
      await expect(page.getByText(ACCESS_SUCCESS_REGEX)).toBeVisible();

      // Wait for the invite section to appear (it renders when accessType === "private")
      await expect(
        page.getByText("Invited Users", { exact: true })
      ).toBeVisible();
    });

    test("can change from public to owner only", async ({ page }) => {
      // Verify we're on settings page - use exact match to avoid matching back link
      await expect(
        page.getByText("Access Control", { exact: true })
      ).toBeVisible();

      // Select owner only
      await page.getByText(OWNER_ONLY_REGEX).click();

      // Update access
      await page.getByRole("button", { name: UPDATE_ACCESS_REGEX }).click();

      // Wait for success toast
      await expect(page.getByText(ACCESS_SUCCESS_REGEX)).toBeVisible();
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
      // Wait for Access Control section to be visible (confirms parent beforeEach completed)
      await expect(
        page.getByText("Access Control", { exact: true })
      ).toBeVisible();

      // Set site to private first - click the radio input directly for reliability
      const privateRadio = page.locator('input[type="radio"][value="private"]');
      await privateRadio.click();

      // Wait for radio to be checked (confirms click was processed)
      await expect(privateRadio).toBeChecked();

      // Verify the invite section appears (confirms local state is "private")
      await expect(
        page.getByText("Invited Users", { exact: true })
      ).toBeVisible();

      // Now submit the form to persist the change
      await page.getByRole("button", { name: UPDATE_ACCESS_REGEX }).click();

      // Wait for success toast to confirm mutation completed
      await expect(page.getByText(ACCESS_SUCCESS_REGEX)).toBeVisible();

      // Wait for invites query to complete - either "No invites yet" or invite list should be visible
      await expect(page.getByText(NO_INVITES_REGEX)).toBeVisible();
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

      // The invite input should be visible after beforeEach completes
      const inviteInput = page.getByPlaceholder("user@example.com");
      await expect(inviteInput).toBeVisible();

      await inviteInput.fill(inviteEmail);
      await page.getByRole("button", { name: INVITE_REGEX }).click();

      // Wait for success toast
      await expect(page.getByText("Invite sent")).toBeVisible();

      // Invited email should appear in list
      await expect(page.getByText(inviteEmail)).toBeVisible();
    });

    test("can remove an invited user", async ({ page }) => {
      const inviteEmail = "toremove@example.com";

      // The invite input should be visible after beforeEach completes
      const inviteInput = page.getByPlaceholder("user@example.com");
      await expect(inviteInput).toBeVisible();

      // First invite a user
      await inviteInput.fill(inviteEmail);
      await page.getByRole("button", { name: INVITE_REGEX }).click();

      // Wait for invite success toast first
      await expect(page.getByText("Invite sent")).toBeVisible();

      // Wait for invite to appear in list
      await expect(page.getByText(inviteEmail)).toBeVisible();

      // Find and click the remove button (X icon) for this invite
      const inviteRow = page
        .locator("p", { hasText: inviteEmail })
        .locator("..");
      await inviteRow.locator("..").getByRole("button").last().click();

      // Wait for success toast
      await expect(page.getByText("Invite removed")).toBeVisible();

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
      // Wait for Access Control section to be visible (confirms parent beforeEach completed)
      await expect(
        page.getByText("Access Control", { exact: true })
      ).toBeVisible();

      // Change to password protected - click radio directly for reliability
      const passwordRadio = page.locator(
        'input[type="radio"][value="password"]'
      );
      await passwordRadio.click();
      await expect(passwordRadio).toBeChecked();

      // Verify password field appears and fill it
      await expect(page.locator("#password")).toBeVisible();
      await page.locator("#password").fill("secret123");

      // Submit and reload
      await submitAccessAndReload(page, expect);

      // Verify access type persisted
      await expect(passwordRadio).toBeChecked();
      await expect(page.locator("#password")).toBeVisible();
    });

    test("private site shows invites after reload", async ({ page }) => {
      // Change to private - click radio directly for reliability
      const privateRadio = page.locator('input[type="radio"][value="private"]');
      await privateRadio.click();
      await expect(privateRadio).toBeChecked();

      // Verify the invite section appears
      await expect(
        page.getByText("Invited Users", { exact: true })
      ).toBeVisible();

      // Submit and reload
      await submitAccessAndReload(page, expect);

      // Verify access type persisted
      await expect(privateRadio).toBeChecked();
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
