import { test as base, type Page } from "@playwright/test";

// Regex patterns at module level for performance
const CREATE_ACCOUNT_REGEX = /create account/i;
const SETTINGS_REGEX = /settings/i;
const WELCOME_BACK_REGEX = /welcome back/i;
const SIGN_UP_REGEX = /sign up/i;
const SIGN_IN_REGEX = /sign in/i;
const SIGN_OUT_REGEX = /sign out/i;
const ALREADY_HAVE_ACCOUNT_REGEX = /already have an account/i;
const NEW_SITE_REGEX = /new site/i;
const CREATE_SITE_REGEX = /create site/i;
const DASHBOARD_REGEX = /dashboard/;
const DEPLOY_BUTTON_REGEX = /deploy|upload/i;
const DEPLOY_PAGE_REGEX = /deploy/;
const DEPLOY_EXACT_REGEX = /^deploy$/i;
const SITE_CREATED_REGEX = /site created successfully!?/i;
const SITE_NAME_REGEX = /site name/i;

/**
 * Generate a unique test user for each test run
 */
export function generateTestUser() {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return {
    name: `Test User ${random}`,
    email: `test-${timestamp}-${random}@example.com`,
    password: "TestPassword123!",
  };
}

/**
 * Generate a unique subdomain for testing
 */
export function generateSubdomain() {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `test-${timestamp}-${random}`.toLowerCase();
}

/**
 * Helper to sign up a new user
 */
export async function signUp(
  page: Page,
  user: { name: string; email: string; password: string },
  expect: typeof import("@playwright/test").expect
) {
  await page.goto("/login");

  // Should be on sign up form by default
  await expect(
    page.getByRole("heading", { name: CREATE_ACCOUNT_REGEX })
  ).toBeVisible();

  // Fill in the form using specific input IDs
  await page.locator("#name").fill(user.name);
  await page.locator("#email").fill(user.email);
  await page.locator("#password").fill(user.password);

  // Submit
  await page.getByRole("button", { name: SIGN_UP_REGEX }).click();

  // Wait for redirect to dashboard (with longer timeout for API calls)
  await expect(page).toHaveURL(DASHBOARD_REGEX, { timeout: 15_000 });
}

/**
 * Helper to navigate to site settings page
 */
export async function navigateToSiteSettings(
  page: Page,
  siteName: string,
  expect: typeof import("@playwright/test").expect
) {
  await page.getByText(siteName).click();
  await page.getByRole("button", { name: SETTINGS_REGEX }).click();

  // Wait for settings page to fully load
  await expect(
    page.getByRole("heading", { name: SETTINGS_REGEX })
  ).toBeVisible();

  // Wait for Access Control section to be visible (confirms page fully loaded)
  await expect(page.getByText("Access Control", { exact: true })).toBeVisible();

  // Wait for site name input to have the site name (confirms site query loaded)
  await expect(page.getByLabel(SITE_NAME_REGEX)).toHaveValue(siteName);
}

/**
 * Helper to sign in an existing user
 */
export async function signIn(
  page: Page,
  user: { email: string; password: string },
  expect: typeof import("@playwright/test").expect
) {
  await page.goto("/login");

  // Click to switch to sign in form
  await page.getByRole("button", { name: ALREADY_HAVE_ACCOUNT_REGEX }).click();

  // Should be on sign in form
  await expect(
    page.getByRole("heading", { name: WELCOME_BACK_REGEX })
  ).toBeVisible();

  // Fill in the form using specific input IDs
  await page.locator("#email").fill(user.email);
  await page.locator("#password").fill(user.password);

  // Submit
  await page.getByRole("button", { name: SIGN_IN_REGEX }).click();

  // Wait for redirect to dashboard (with longer timeout for API calls)
  await expect(page).toHaveURL(DASHBOARD_REGEX, { timeout: 15_000 });
}

/**
 * Helper to sign out the current user
 */
export async function signOut(page: Page) {
  // Look for sign out button in header
  const signOutButton = page.getByRole("button", { name: SIGN_OUT_REGEX });
  if (await signOutButton.isVisible()) {
    await signOutButton.click();
  }
}

/**
 * Helper to create a new site
 */
export async function createSite(
  page: Page,
  site: { name: string; subdomain: string },
  expect: typeof import("@playwright/test").expect
) {
  await page.goto("/sites");

  // Click new site button
  await page.getByRole("button", { name: NEW_SITE_REGEX }).click();

  // Wait for the create form to appear
  await expect(page.locator("form")).toBeVisible();

  // Fill in the form - use form-scoped selectors to avoid conflicts
  await page.locator("form #name").fill(site.name);
  await page.locator("form #subdomain").fill(site.subdomain);

  // Submit - use the form's submit button specifically
  await page
    .locator("form")
    .getByRole("button", { name: CREATE_SITE_REGEX })
    .click();

  // Wait for success toast to confirm site was created
  await expect(page.getByText(SITE_CREATED_REGEX)).toBeVisible();

  // Wait for site to appear in list
  await expect(page.getByText(site.name)).toBeVisible();
}

/**
 * Helper to navigate to deploy page for a site
 */
export async function navigateToDeployPage(
  page: Page,
  siteName: string,
  expect: typeof import("@playwright/test").expect
) {
  await page.getByText(siteName).click();
  // Wait for site detail page to load before clicking deploy
  await expect(page.getByRole("heading", { name: siteName })).toBeVisible({
    timeout: 10_000,
  });
  // Click the deploy link (which contains a button)
  await page.getByRole("link", { name: DEPLOY_BUTTON_REGEX }).first().click();
  await expect(page).toHaveURL(DEPLOY_PAGE_REGEX, { timeout: 10_000 });
}

/**
 * Helper to create a site and navigate to its deploy page
 */
export async function createSiteAndNavigateToDeploy(
  page: Page,
  site: { name: string; subdomain: string },
  expect: typeof import("@playwright/test").expect
) {
  await createSite(page, site, expect);
  await navigateToDeployPage(page, site.name, expect);
}

/**
 * Helper to upload files to the deploy page
 */
export async function uploadFiles(
  page: Page,
  files: Array<{ name: string; mimeType: string; buffer: Buffer }>,
  expect: typeof import("@playwright/test").expect
) {
  const fileInput = page.locator('input[type="file"]');
  await expect(fileInput).toBeAttached();
  await fileInput.setInputFiles(files);
}

/**
 * Test file data for common file types
 */
export const testFiles = {
  indexHtml: {
    name: "index.html",
    mimeType: "text/html",
    buffer: Buffer.from("<html></html>"),
  },
  styleCss: {
    name: "style.css",
    mimeType: "text/css",
    buffer: Buffer.from("body {}"),
  },
  createHtml: (content = "<html></html>") => ({
    name: "index.html",
    mimeType: "text/html",
    buffer: Buffer.from(content),
  }),
};

/**
 * Helper to upload a single HTML file and wait for it to be visible
 */
export async function uploadSingleHtmlFile(
  page: Page,
  expect: typeof import("@playwright/test").expect,
  content = "<html></html>"
) {
  const fileInput = page.locator('input[type="file"]').first();
  await fileInput.setInputFiles({
    name: "index.html",
    mimeType: "text/html",
    buffer: Buffer.from(content),
  });
  await expect(page.getByText("index.html")).toBeVisible({ timeout: 5000 });
}

/**
 * Helper to upload multiple files and wait for them to be visible
 */
export async function uploadMultipleFiles(
  page: Page,
  files: Array<{ name: string; mimeType: string; buffer: Buffer }>,
  expect: typeof import("@playwright/test").expect
) {
  const fileInput = page.locator('input[type="file"]').first();
  await fileInput.setInputFiles(files);
  // Wait for first file to be visible
  if (files.length > 0) {
    await expect(page.getByText(files[0].name)).toBeVisible({ timeout: 5000 });
  }
}

/**
 * Helper to get the deploy button
 */
export function getDeployButton(page: Page) {
  return page.getByRole("button", { name: DEPLOY_EXACT_REGEX });
}

/**
 * Extended test fixture with authenticated user
 */
export const test = base.extend<{
  authenticatedPage: Page;
  testUser: { name: string; email: string; password: string };
}>({
  // biome-ignore lint/correctness/noEmptyPattern: Playwright fixture API requires this pattern
  testUser: async ({}, use) => {
    const user = generateTestUser();
    await use(user);
  },
  authenticatedPage: async ({ page, testUser }, use) => {
    const { expect } = await import("@playwright/test");
    await signUp(page, testUser, expect);
    await use(page);
  },
});
