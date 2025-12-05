import { expect, test } from "@playwright/test";

// Regex patterns at module level for performance
const FORGOT_PASSWORD_REGEX = /forgot password/i;
const EMAIL_REGEX = /email/i;
const SEND_RESET_LINK_REGEX = /send.*reset.*link|send.*link/i;
const BACK_TO_LOGIN_REGEX = /back to login|sign in/i;
const NEW_PASSWORD_REGEX = /new password/i;
const LOGIN_URL_REGEX = /login/;
const FORGOT_PASSWORD_URL_REGEX = /forgot-password/;
const INVALID_TOKEN_REGEX = /invalid|expired|token/i;
const INVALID_EXPIRED_REGEX = /invalid|expired/i;
const ALREADY_HAVE_ACCOUNT_REGEX = /already have an account/i;

test.describe("Password Reset Flow", () => {
  test.describe("Forgot Password Page", () => {
    test("can navigate to forgot password page", async ({ page }) => {
      await page.goto("/login");

      // Click forgot password link
      await page.getByText(FORGOT_PASSWORD_REGEX).click();

      await expect(page).toHaveURL(FORGOT_PASSWORD_URL_REGEX);
    });

    test("displays forgot password form", async ({ page }) => {
      await page.goto("/forgot-password");

      await expect(
        page.getByRole("heading", { name: FORGOT_PASSWORD_REGEX })
      ).toBeVisible();
      await expect(page.getByLabel(EMAIL_REGEX)).toBeVisible();
      await expect(
        page.getByRole("button", { name: SEND_RESET_LINK_REGEX })
      ).toBeVisible();
    });

    test("can enter email address", async ({ page }) => {
      await page.goto("/forgot-password");

      const emailInput = page.getByLabel(EMAIL_REGEX);
      await emailInput.fill("test@example.com");

      await expect(emailInput).toHaveValue("test@example.com");
    });

    test("has back to login link", async ({ page }) => {
      await page.goto("/forgot-password");

      await expect(page.getByText(BACK_TO_LOGIN_REGEX)).toBeVisible();
    });

    test("can navigate back to login", async ({ page }) => {
      await page.goto("/forgot-password");

      await page.getByText(BACK_TO_LOGIN_REGEX).click();

      await expect(page).toHaveURL(LOGIN_URL_REGEX);
    });
  });

  test.describe("Reset Password Page", () => {
    test("reset password page requires token", async ({ page }) => {
      // Accessing reset password without token should show error or redirect
      await page.goto("/reset-password");

      // Should either show error or redirect to login/forgot-password
      const hasError = await page
        .getByText(INVALID_TOKEN_REGEX)
        .isVisible()
        .catch(() => false);
      const redirected =
        page.url().includes("login") || page.url().includes("forgot-password");

      expect(hasError || redirected).toBeTruthy();
    });

    test("reset password page with token shows form", async ({ page }) => {
      // Navigate with a mock token (won't be valid but should show form)
      await page.goto("/reset-password?token=mock-token-123");

      // Should show password fields (even if token is invalid, form may still render)
      const hasPasswordField = await page
        .getByLabel(NEW_PASSWORD_REGEX)
        .isVisible()
        .catch(() => false);
      const hasError = await page
        .getByText(INVALID_EXPIRED_REGEX)
        .isVisible()
        .catch(() => false);

      // Either shows form or shows error for invalid token
      expect(hasPasswordField || hasError).toBeTruthy();
    });
  });

  test.describe("Password Reset Integration", () => {
    test("forgot password link is accessible from login page", async ({
      page,
    }) => {
      await page.goto("/login");

      // Switch to sign in form
      await page.getByText(ALREADY_HAVE_ACCOUNT_REGEX).click();

      // Forgot password should be visible
      await expect(page.getByText(FORGOT_PASSWORD_REGEX)).toBeVisible();
    });
  });
});
