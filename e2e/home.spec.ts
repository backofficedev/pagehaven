import { expect, test } from "@playwright/test";

// Regex patterns at module level for performance
const PAGEHAVEN_REGEX = /pagehaven/i;
const LOGIN_REGEX = /login/;
const TOGGLE_THEME_REGEX = /toggle theme/i;
const LIGHT_REGEX = /light/i;
const DARK_REGEX = /dark/i;

test.describe("Home Page", () => {
  test("has title", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(PAGEHAVEN_REGEX);
  });

  test("shows navigation links", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("link", { name: "Home" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Sites" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Dashboard" })).toBeVisible();
  });

  test("shows hero section with ASCII art", async ({ page }) => {
    await page.goto("/");
    // The home page shows ASCII art in a pre element, not a heading
    await expect(page.locator("pre")).toBeVisible();
  });

  test("redirects to login when accessing protected route unauthenticated", async ({
    page,
  }) => {
    await page.goto("/sites");
    // Should redirect to login (with timeout for auth check)
    await expect(page).toHaveURL(LOGIN_REGEX, { timeout: 10_000 });
  });
});

test.describe("Theme Toggle", () => {
  test("toggles between light and dark mode", async ({ page }) => {
    await page.goto("/");

    // Find and click the theme toggle button
    const themeToggle = page.getByRole("button", { name: TOGGLE_THEME_REGEX });
    await expect(themeToggle).toBeVisible();

    // Click to open dropdown
    await themeToggle.click();

    // Select light mode
    await page.getByRole("menuitem", { name: LIGHT_REGEX }).click();

    // Verify theme changed (html element should have class)
    await expect(page.locator("html")).toHaveClass(LIGHT_REGEX);

    // Toggle back to dark
    await themeToggle.click();
    await page.getByRole("menuitem", { name: DARK_REGEX }).click();
    await expect(page.locator("html")).toHaveClass(DARK_REGEX);
  });
});
