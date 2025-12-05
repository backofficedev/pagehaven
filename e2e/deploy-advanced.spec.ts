import { expect, test } from "@playwright/test";
import {
  createSiteAndNavigateToDeploy,
  generateSubdomain,
  generateTestUser,
  signUp,
} from "./fixtures";

// Regex patterns at module level for performance
const DEPLOY_EXACT_REGEX = /^deploy$/i;
const CLEAR_FILES_REGEX = /clear files/i;
const REMOVE_REGEX = /remove/i;
const FILES_TO_DEPLOY_REGEX = /files to deploy/i;
const COMMIT_MESSAGE_REGEX = /commit message/i;
const DEPLOYMENT_SUCCESS_REGEX = /success|deployed|live/i;
const SELECT_FILES_REGEX = /select files/i;
const SELECT_FOLDER_REGEX = /select folder/i;
const FILE_COUNT_2_REGEX = /\(2\)/;
const FILE_COUNT_3_REGEX = /\(3\)/;
const FILE_SIZE_REGEX = /\d+\s*B/;
const DEPLOYING_REGEX = /deploying/i;
const WHAT_CHANGED_REGEX = /what changed/i;
const DEPLOY_URL_REGEX = /deploy/;

test.describe("Advanced Deployment", () => {
  let siteName: string;
  let subdomain: string;

  test.beforeEach(async ({ page }) => {
    const user = generateTestUser();
    await signUp(page, user, expect);

    siteName = "Advanced Deploy Test Site";
    subdomain = generateSubdomain();
    await createSiteAndNavigateToDeploy(
      page,
      { name: siteName, subdomain },
      expect
    );
  });

  test.describe("File Upload Interface", () => {
    test("shows file and folder upload inputs", async ({ page }) => {
      await expect(page.getByText(SELECT_FILES_REGEX)).toBeVisible();
      await expect(page.getByText(SELECT_FOLDER_REGEX)).toBeVisible();
    });

    test("shows commit message input", async ({ page }) => {
      await expect(page.getByText(COMMIT_MESSAGE_REGEX)).toBeVisible();
    });

    test("deploy button disabled without files", async ({ page }) => {
      const deployButton = page.getByRole("button", {
        name: DEPLOY_EXACT_REGEX,
      });
      await expect(deployButton).toBeDisabled();
    });

    test("clear files button disabled without files", async ({ page }) => {
      const clearButton = page.getByRole("button", { name: CLEAR_FILES_REGEX });
      await expect(clearButton).toBeDisabled();
    });
  });

  test.describe("File Selection", () => {
    test("shows file list after selection", async ({ page }) => {
      const fileInput = page.locator('input[type="file"]').first();

      await fileInput.setInputFiles({
        name: "index.html",
        mimeType: "text/html",
        buffer: Buffer.from("<html><body>Hello</body></html>"),
      });

      await expect(page.getByText("index.html")).toBeVisible({ timeout: 5000 });
    });

    test("shows Files to Deploy card with file count", async ({ page }) => {
      const fileInput = page.locator('input[type="file"]').first();

      await fileInput.setInputFiles([
        {
          name: "index.html",
          mimeType: "text/html",
          buffer: Buffer.from("<html></html>"),
        },
        {
          name: "style.css",
          mimeType: "text/css",
          buffer: Buffer.from("body {}"),
        },
      ]);

      await expect(page.getByText(FILES_TO_DEPLOY_REGEX)).toBeVisible({
        timeout: 5000,
      });
      // Should show count (2)
      await expect(page.getByText(FILE_COUNT_2_REGEX)).toBeVisible();
    });

    test("shows total size of selected files", async ({ page }) => {
      const fileInput = page.locator('input[type="file"]').first();

      await fileInput.setInputFiles({
        name: "index.html",
        mimeType: "text/html",
        buffer: Buffer.from("<html><body>Test content</body></html>"),
      });

      await expect(page.getByText("index.html")).toBeVisible({ timeout: 5000 });
      // Should show size (e.g., "38 B" or similar)
      await expect(page.getByText(FILE_SIZE_REGEX)).toBeVisible();
    });

    test("enables deploy button after file selection", async ({ page }) => {
      const fileInput = page.locator('input[type="file"]').first();

      await fileInput.setInputFiles({
        name: "index.html",
        mimeType: "text/html",
        buffer: Buffer.from("<html></html>"),
      });

      await expect(page.getByText("index.html")).toBeVisible({ timeout: 5000 });

      const deployButton = page.getByRole("button", {
        name: DEPLOY_EXACT_REGEX,
      });
      await expect(deployButton).toBeEnabled();
    });

    test("enables clear files button after file selection", async ({
      page,
    }) => {
      const fileInput = page.locator('input[type="file"]').first();

      await fileInput.setInputFiles({
        name: "index.html",
        mimeType: "text/html",
        buffer: Buffer.from("<html></html>"),
      });

      await expect(page.getByText("index.html")).toBeVisible({ timeout: 5000 });

      const clearButton = page.getByRole("button", { name: CLEAR_FILES_REGEX });
      await expect(clearButton).toBeEnabled();
    });
  });

  test.describe("Clear Files", () => {
    test("clears all selected files", async ({ page }) => {
      const fileInput = page.locator('input[type="file"]').first();

      await fileInput.setInputFiles([
        {
          name: "index.html",
          mimeType: "text/html",
          buffer: Buffer.from("<html></html>"),
        },
        {
          name: "style.css",
          mimeType: "text/css",
          buffer: Buffer.from("body {}"),
        },
      ]);

      await expect(page.getByText("index.html")).toBeVisible({ timeout: 5000 });
      await expect(page.getByText("style.css")).toBeVisible();

      // Click clear files
      await page.getByRole("button", { name: CLEAR_FILES_REGEX }).click();

      // Files should be gone
      await expect(page.getByText("index.html")).not.toBeVisible();
      await expect(page.getByText("style.css")).not.toBeVisible();

      // Files to Deploy card should be gone
      await expect(page.getByText(FILES_TO_DEPLOY_REGEX)).not.toBeVisible();
    });

    test("disables buttons after clearing files", async ({ page }) => {
      const fileInput = page.locator('input[type="file"]').first();

      await fileInput.setInputFiles({
        name: "index.html",
        mimeType: "text/html",
        buffer: Buffer.from("<html></html>"),
      });

      await expect(page.getByText("index.html")).toBeVisible({ timeout: 5000 });

      await page.getByRole("button", { name: CLEAR_FILES_REGEX }).click();

      const deployButton = page.getByRole("button", {
        name: DEPLOY_EXACT_REGEX,
      });
      const clearButton = page.getByRole("button", { name: CLEAR_FILES_REGEX });

      await expect(deployButton).toBeDisabled();
      await expect(clearButton).toBeDisabled();
    });
  });

  test.describe("Remove Individual Files", () => {
    test("can remove a single file from list", async ({ page }) => {
      const fileInput = page.locator('input[type="file"]').first();

      await fileInput.setInputFiles([
        {
          name: "index.html",
          mimeType: "text/html",
          buffer: Buffer.from("<html></html>"),
        },
        {
          name: "style.css",
          mimeType: "text/css",
          buffer: Buffer.from("body {}"),
        },
      ]);

      await expect(page.getByText("index.html")).toBeVisible({ timeout: 5000 });
      await expect(page.getByText("style.css")).toBeVisible();

      // Find and click remove button for index.html
      const indexRow = page.locator("div").filter({ hasText: "index.html" });
      const removeButton = indexRow.getByRole("button", { name: REMOVE_REGEX });
      await removeButton.click();

      // index.html should be gone, style.css should remain
      await expect(page.getByText("index.html")).not.toBeVisible();
      await expect(page.getByText("style.css")).toBeVisible();
    });

    test("updates file count after removal", async ({ page }) => {
      const fileInput = page.locator('input[type="file"]').first();

      await fileInput.setInputFiles([
        {
          name: "file1.html",
          mimeType: "text/html",
          buffer: Buffer.from("<html></html>"),
        },
        {
          name: "file2.html",
          mimeType: "text/html",
          buffer: Buffer.from("<html></html>"),
        },
        {
          name: "file3.html",
          mimeType: "text/html",
          buffer: Buffer.from("<html></html>"),
        },
      ]);

      await expect(page.getByText(FILE_COUNT_3_REGEX)).toBeVisible({
        timeout: 5000,
      });

      // Remove one file
      const fileRow = page.locator("div").filter({ hasText: "file1.html" });
      await fileRow.getByRole("button", { name: REMOVE_REGEX }).click();

      // Count should update to 2
      await expect(page.getByText(FILE_COUNT_2_REGEX)).toBeVisible();
    });
  });

  test.describe("Commit Message", () => {
    test("can enter commit message", async ({ page }) => {
      const messageInput = page.getByPlaceholder(WHAT_CHANGED_REGEX);
      await messageInput.fill("Initial deployment");
      await expect(messageInput).toHaveValue("Initial deployment");
    });

    test("commit message is optional", async ({ page }) => {
      const fileInput = page.locator('input[type="file"]').first();

      await fileInput.setInputFiles({
        name: "index.html",
        mimeType: "text/html",
        buffer: Buffer.from("<html></html>"),
      });

      await expect(page.getByText("index.html")).toBeVisible({ timeout: 5000 });

      // Deploy button should be enabled even without commit message
      const deployButton = page.getByRole("button", {
        name: DEPLOY_EXACT_REGEX,
      });
      await expect(deployButton).toBeEnabled();
    });
  });

  test.describe("Deployment Execution", () => {
    test("successfully deploys files", async ({ page }) => {
      const fileInput = page.locator('input[type="file"]').first();

      await fileInput.setInputFiles({
        name: "index.html",
        mimeType: "text/html",
        buffer: Buffer.from(
          "<!DOCTYPE html><html><head><title>Test</title></head><body><h1>Hello World</h1></body></html>"
        ),
      });

      await expect(page.getByText("index.html")).toBeVisible({ timeout: 5000 });

      // Add commit message
      const messageInput = page.getByPlaceholder(WHAT_CHANGED_REGEX);
      await messageInput.fill("Test deployment");

      // Click deploy
      const deployButton = page.getByRole("button", {
        name: DEPLOY_EXACT_REGEX,
      });
      await deployButton.click();

      // Wait for success
      await expect(page.getByText(DEPLOYMENT_SUCCESS_REGEX)).toBeVisible({
        timeout: 30_000,
      });
    });

    test("shows loading state during deployment", async ({ page }) => {
      const fileInput = page.locator('input[type="file"]').first();

      await fileInput.setInputFiles({
        name: "index.html",
        mimeType: "text/html",
        buffer: Buffer.from("<html></html>"),
      });

      await expect(page.getByText("index.html")).toBeVisible({ timeout: 5000 });

      const deployButton = page.getByRole("button", {
        name: DEPLOY_EXACT_REGEX,
      });
      await deployButton.click();

      // Should show deploying state (button text changes or spinner appears)
      await expect(page.getByText(DEPLOYING_REGEX)).toBeVisible({
        timeout: 5000,
      });
    });

    test("navigates to site detail after successful deployment", async ({
      page,
    }) => {
      const fileInput = page.locator('input[type="file"]').first();

      await fileInput.setInputFiles({
        name: "index.html",
        mimeType: "text/html",
        buffer: Buffer.from("<html><body>Test</body></html>"),
      });

      await expect(page.getByText("index.html")).toBeVisible({ timeout: 5000 });

      const deployButton = page.getByRole("button", {
        name: DEPLOY_EXACT_REGEX,
      });
      await deployButton.click();

      // Wait for navigation back to site detail
      await expect(page.getByText(DEPLOYMENT_SUCCESS_REGEX)).toBeVisible({
        timeout: 30_000,
      });

      // Should be back on site detail page (not deploy page)
      await expect(page).not.toHaveURL(DEPLOY_URL_REGEX);
    });
  });

  test.describe("Multiple File Types", () => {
    test("can deploy HTML, CSS, and JS files together", async ({ page }) => {
      const fileInput = page.locator('input[type="file"]').first();

      await fileInput.setInputFiles([
        {
          name: "index.html",
          mimeType: "text/html",
          buffer: Buffer.from(
            '<!DOCTYPE html><html><head><link rel="stylesheet" href="style.css"></head><body><script src="app.js"></script></body></html>'
          ),
        },
        {
          name: "style.css",
          mimeType: "text/css",
          buffer: Buffer.from("body { margin: 0; padding: 0; }"),
        },
        {
          name: "app.js",
          mimeType: "application/javascript",
          buffer: Buffer.from('console.log("Hello World");'),
        },
      ]);

      await expect(page.getByText("index.html")).toBeVisible({ timeout: 5000 });
      await expect(page.getByText("style.css")).toBeVisible();
      await expect(page.getByText("app.js")).toBeVisible();

      // Should show 3 files
      await expect(page.getByText(FILE_COUNT_3_REGEX)).toBeVisible();
    });

    test("can deploy image files", async ({ page }) => {
      const fileInput = page.locator('input[type="file"]').first();

      // Create a minimal valid PNG (1x1 transparent pixel)
      const pngBuffer = Buffer.from([
        0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d,
        0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
        0x08, 0x06, 0x00, 0x00, 0x00, 0x1f, 0x15, 0xc4, 0x89, 0x00, 0x00, 0x00,
        0x0a, 0x49, 0x44, 0x41, 0x54, 0x78, 0x9c, 0x63, 0x00, 0x01, 0x00, 0x00,
        0x05, 0x00, 0x01, 0x0d, 0x0a, 0x2d, 0xb4, 0x00, 0x00, 0x00, 0x00, 0x49,
        0x45, 0x4e, 0x44, 0xae, 0x42, 0x60, 0x82,
      ]);

      await fileInput.setInputFiles({
        name: "logo.png",
        mimeType: "image/png",
        buffer: pngBuffer,
      });

      await expect(page.getByText("logo.png")).toBeVisible({ timeout: 5000 });
    });
  });

  test.describe("Accumulative File Selection", () => {
    test("can add more files to existing selection", async ({ page }) => {
      const fileInput = page.locator('input[type="file"]').first();

      // First selection
      await fileInput.setInputFiles({
        name: "index.html",
        mimeType: "text/html",
        buffer: Buffer.from("<html></html>"),
      });

      await expect(page.getByText("index.html")).toBeVisible({ timeout: 5000 });

      // Second selection should add to existing
      await fileInput.setInputFiles({
        name: "style.css",
        mimeType: "text/css",
        buffer: Buffer.from("body {}"),
      });

      // Both files should be visible
      await expect(page.getByText("index.html")).toBeVisible();
      await expect(page.getByText("style.css")).toBeVisible();
      await expect(page.getByText(FILE_COUNT_2_REGEX)).toBeVisible();
    });
  });
});
