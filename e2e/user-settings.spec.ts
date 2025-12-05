import { expect, test } from "@playwright/test";
import { generateTestUser, signUp } from "./fixtures";

// Regex patterns at module level for performance
const SETTINGS_REGEX = /settings/i;
const PROFILE_REGEX = /profile/i;
const SESSIONS_REGEX = /sessions/i;
const DANGER_ZONE_REGEX = /danger zone/i;
const UPDATE_PROFILE_REGEX = /update profile/i;
const CHANGE_PASSWORD_REGEX = /change password/i;
const DELETE_ACCOUNT_REGEX = /delete.*account/i;
const NAME_REGEX = /name/i;
const EMAIL_REGEX = /email/i;
const CURRENT_PASSWORD_REGEX = /current password/i;
const NEW_PASSWORD_REGEX = /new password/i;
const CONFIRM_PASSWORD_REGEX = /confirm.*password/i;
const CURRENT_SESSION_REGEX = /current session/i;
const OTHER_SESSIONS_REGEX = /other sessions/i;
const PERMANENT_WARNING_REGEX = /permanent|cannot be undone/i;

test.describe("User Settings", () => {
  test.beforeEach(async ({ page }) => {
    const user = generateTestUser();
    await signUp(page, user, expect);
  });

  test.describe("Navigation", () => {
    test("can navigate to user settings", async ({ page }) => {
      // Click on user menu or settings link
      await page.goto("/settings");

      await expect(
        page.getByRole("heading", { name: SETTINGS_REGEX })
      ).toBeVisible();
    });
  });

  test.describe("Profile Settings", () => {
    test("displays profile section", async ({ page }) => {
      await page.goto("/settings");

      await expect(page.getByText(PROFILE_REGEX)).toBeVisible();
    });

    test("shows name input with current value", async ({ page }) => {
      await page.goto("/settings");

      const nameInput = page.getByLabel(NAME_REGEX);
      await expect(nameInput).toBeVisible();
      await expect(nameInput).not.toHaveValue("");
    });

    test("shows email display", async ({ page }) => {
      await page.goto("/settings");

      await expect(page.getByText(EMAIL_REGEX)).toBeVisible();
    });

    test("can update profile name", async ({ page }) => {
      await page.goto("/settings");

      const nameInput = page.getByLabel(NAME_REGEX);
      await nameInput.clear();
      await nameInput.fill("Updated Name");

      await page.getByRole("button", { name: UPDATE_PROFILE_REGEX }).click();

      // Wait for success (input should retain value)
      await expect(nameInput).toHaveValue("Updated Name");
    });
  });

  test.describe("Security Settings", () => {
    test("displays change password section", async ({ page }) => {
      await page.goto("/settings");

      await expect(page.getByText(CHANGE_PASSWORD_REGEX)).toBeVisible();
    });

    test("shows password change form fields", async ({ page }) => {
      await page.goto("/settings");

      await expect(page.getByLabel(CURRENT_PASSWORD_REGEX)).toBeVisible();
      await expect(page.getByLabel(NEW_PASSWORD_REGEX)).toBeVisible();
      await expect(page.getByLabel(CONFIRM_PASSWORD_REGEX)).toBeVisible();
    });

    test("can fill in password change form", async ({ page }) => {
      await page.goto("/settings");

      await page.getByLabel(CURRENT_PASSWORD_REGEX).fill("OldPassword123!");
      await page.getByLabel(NEW_PASSWORD_REGEX).fill("NewPassword123!");
      await page.getByLabel(CONFIRM_PASSWORD_REGEX).fill("NewPassword123!");

      // Form should be filled
      await expect(page.getByLabel(CURRENT_PASSWORD_REGEX)).toHaveValue(
        "OldPassword123!"
      );
      await expect(page.getByLabel(NEW_PASSWORD_REGEX)).toHaveValue(
        "NewPassword123!"
      );
    });
  });

  test.describe("Sessions Management", () => {
    test("displays sessions section", async ({ page }) => {
      await page.goto("/settings");

      await expect(page.getByText(SESSIONS_REGEX)).toBeVisible();
    });

    test("shows current session", async ({ page }) => {
      await page.goto("/settings");

      await expect(page.getByText(CURRENT_SESSION_REGEX)).toBeVisible();
    });

    test("shows other sessions section", async ({ page }) => {
      await page.goto("/settings");

      await expect(page.getByText(OTHER_SESSIONS_REGEX)).toBeVisible();
    });
  });

  test.describe("Danger Zone", () => {
    test("displays delete account section", async ({ page }) => {
      await page.goto("/settings");

      await expect(page.getByText(DANGER_ZONE_REGEX)).toBeVisible();
      await expect(
        page.getByRole("button", { name: DELETE_ACCOUNT_REGEX })
      ).toBeVisible();
    });

    test("shows delete account confirmation requirements", async ({ page }) => {
      await page.goto("/settings");

      // The delete account section should show warning text
      await expect(page.getByText(PERMANENT_WARNING_REGEX)).toBeVisible();
    });
  });
});
