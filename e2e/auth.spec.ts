import { expect, test } from "@playwright/test";
import { generateTestUser, signIn, signUp } from "./fixtures";

// Regex patterns at module level for performance
const CREATE_ACCOUNT_REGEX = /create account/i;
const WELCOME_BACK_REGEX = /welcome back/i;
const DASHBOARD_REGEX = /dashboard/;
const LOGIN_REGEX = /login/;
const SIGN_OUT_REGEX = /sign out/i;
const SIGN_UP_REGEX = /sign up/i;
const SIGN_IN_REGEX = /sign in/i;
const ALREADY_HAVE_ACCOUNT_REGEX = /already have an account/i;
const NEED_ACCOUNT_REGEX = /need an account/i;
const PASSWORD_MIN_REGEX = /password must be at least 8 characters/i;
const INVALID_EMAIL_REGEX = /invalid email/i;
const AUTH_ERROR_REGEX = /invalid|incorrect|wrong|error/i;
const SITES_REGEX = /sites/;
const YOUR_SITES_REGEX = /your sites/i;

test.describe("Authentication", () => {
  test.describe("Sign Up", () => {
    test("shows sign up form by default on login page", async ({ page }) => {
      await page.goto("/login");
      await expect(
        page.getByRole("heading", { name: CREATE_ACCOUNT_REGEX })
      ).toBeVisible();
    });

    test("can sign up with valid credentials", async ({ page }) => {
      const user = generateTestUser();

      await page.goto("/login");

      // Fill in the form using specific input IDs
      await page.locator("#name").fill(user.name);
      await page.locator("#email").fill(user.email);
      await page.locator("#password").fill(user.password);

      // Submit
      await page.getByRole("button", { name: SIGN_UP_REGEX }).click();

      // Should redirect to dashboard
      await expect(page).toHaveURL(DASHBOARD_REGEX, { timeout: 10_000 });

      // Should show welcome message with user name
      await expect(page.getByText(user.name)).toBeVisible();
    });

    test("shows validation error for short password", async ({ page }) => {
      await page.goto("/login");

      await page.locator("#name").fill("Test User");
      await page.locator("#email").fill("test@example.com");
      await page.locator("#password").fill("short");

      await page.getByRole("button", { name: SIGN_UP_REGEX }).click();

      // Should show validation error
      await expect(page.getByText(PASSWORD_MIN_REGEX)).toBeVisible();
    });

    test("shows validation error for invalid email", async ({ page }) => {
      await page.goto("/login");

      await page.locator("#name").fill("Test User");
      await page.locator("#email").fill("invalid-email");
      await page.locator("#password").fill("ValidPassword123!");

      await page.getByRole("button", { name: SIGN_UP_REGEX }).click();

      // Should show validation error
      await expect(page.getByText(INVALID_EMAIL_REGEX)).toBeVisible();
    });

    test("can switch to sign in form", async ({ page }) => {
      await page.goto("/login");

      await page
        .getByRole("button", { name: ALREADY_HAVE_ACCOUNT_REGEX })
        .click();

      await expect(
        page.getByRole("heading", { name: WELCOME_BACK_REGEX })
      ).toBeVisible();
    });
  });

  test.describe("Sign In", () => {
    test("can sign in with existing account", async ({ page }) => {
      const user = generateTestUser();

      // First sign up
      await signUp(page, user, expect);

      // Sign out (if there's a sign out button)
      const signOutButton = page.getByRole("button", { name: SIGN_OUT_REGEX });
      if (await signOutButton.isVisible()) {
        await signOutButton.click();
        await page.waitForURL(LOGIN_REGEX);
      } else {
        // Navigate to login manually
        await page.goto("/login");
      }

      // Now sign in
      await signIn(page, user, expect);

      // Should be on dashboard
      await expect(page).toHaveURL(DASHBOARD_REGEX);
    });

    test("shows error for wrong password", async ({ page }) => {
      const user = generateTestUser();

      // First sign up
      await signUp(page, user, expect);

      // Sign out
      await page.goto("/login");

      // Switch to sign in
      await page
        .getByRole("button", { name: ALREADY_HAVE_ACCOUNT_REGEX })
        .click();

      // Try to sign in with wrong password
      await page.locator("#email").fill(user.email);
      await page.locator("#password").fill("WrongPassword123!");

      await page.getByRole("button", { name: SIGN_IN_REGEX }).click();

      // Should show error (toast or inline)
      await expect(page.getByText(AUTH_ERROR_REGEX)).toBeVisible({
        timeout: 5000,
      });
    });

    test("can switch to sign up form", async ({ page }) => {
      await page.goto("/login");

      // Switch to sign in first
      await page
        .getByRole("button", { name: ALREADY_HAVE_ACCOUNT_REGEX })
        .click();

      // Then switch back to sign up
      await page.getByRole("button", { name: NEED_ACCOUNT_REGEX }).click();

      await expect(
        page.getByRole("heading", { name: CREATE_ACCOUNT_REGEX })
      ).toBeVisible();
    });
  });

  test.describe("Protected Routes", () => {
    test("redirects to login when accessing dashboard unauthenticated", async ({
      page,
    }) => {
      await page.goto("/dashboard");
      await expect(page).toHaveURL(LOGIN_REGEX);
    });

    test("redirects to login when accessing sites unauthenticated", async ({
      page,
    }) => {
      await page.goto("/sites");
      await expect(page).toHaveURL(LOGIN_REGEX);
    });

    test("can access dashboard after sign in", async ({ page }) => {
      const user = generateTestUser();
      await signUp(page, user, expect);

      // Navigate to dashboard
      await page.goto("/dashboard");

      // Should stay on dashboard (not redirect to login)
      await expect(page).toHaveURL(DASHBOARD_REGEX);
      await expect(page.getByText(user.name)).toBeVisible();
    });

    test("can access sites after sign in", async ({ page }) => {
      const user = generateTestUser();
      await signUp(page, user, expect);

      // Navigate to sites
      await page.goto("/sites");

      // Should stay on sites page
      await expect(page).toHaveURL(SITES_REGEX);
      await expect(
        page.getByRole("heading", { name: YOUR_SITES_REGEX })
      ).toBeVisible();
    });
  });
});
