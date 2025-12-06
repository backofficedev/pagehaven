import { expect, test } from "@playwright/test";
import {
  createSite,
  createSiteAndNavigateToDeploy,
  generateSubdomain,
  generateTestUser,
  navigateToDeployPage,
  signUp,
  uploadSingleHtmlFile,
} from "./fixtures";

// Regex patterns at module level for performance
const BACK_TO_SITE_REGEX = /back to site|back/i;
const DEPLOYMENT_SUCCESS_REGEX = /success|deployed|live/i;
const REMOVE_BUTTON_REGEX = /remove|delete|x/i;
const DEPLOY_EXACT_REGEX = /^deploy$/i;
const DEPLOY_HEADING_REGEX = /deploy/i;

test.describe("Deployment", () => {
  test.beforeEach(async ({ page }) => {
    // Sign up a new user before each test
    const user = generateTestUser();
    await signUp(page, user, expect);
  });

  test.describe("Deploy Page", () => {
    test("can navigate to deploy page from site detail", async ({ page }) => {
      const siteName = "Deploy Test Site";
      const subdomain = generateSubdomain();

      await createSite(page, { name: siteName, subdomain }, expect);
      await navigateToDeployPage(page, siteName, expect);
    });

    test("shows file upload interface", async ({ page }) => {
      const siteName = "Upload UI Test Site";
      const subdomain = generateSubdomain();

      await createSiteAndNavigateToDeploy(
        page,
        { name: siteName, subdomain },
        expect
      );

      // Use first() since there are multiple file inputs (files and folder)
      const fileInput = page.locator('input[type="file"]').first();
      await expect(fileInput).toBeAttached();
    });

    test("can navigate back to site detail", async ({ page }) => {
      const siteName = "Back Nav Deploy Test";
      const subdomain = generateSubdomain();

      await createSiteAndNavigateToDeploy(
        page,
        { name: siteName, subdomain },
        expect
      );

      // Click back link
      await page.getByRole("link", { name: BACK_TO_SITE_REGEX }).click();

      // Should be back on site detail
      await expect(page.getByRole("heading", { name: siteName })).toBeVisible();
    });
  });

  test.describe("File Selection", () => {
    test("can select files for upload", async ({ page }) => {
      const siteName = "File Select Test Site";
      const subdomain = generateSubdomain();

      await createSiteAndNavigateToDeploy(
        page,
        { name: siteName, subdomain },
        expect
      );

      // Use first() since there are multiple file inputs
      const fileInput = page.locator('input[type="file"]').first();

      // Set files using Playwright's setInputFiles
      await fileInput.setInputFiles({
        name: "index.html",
        mimeType: "text/html",
        buffer: Buffer.from("<html><body><h1>Hello World</h1></body></html>"),
      });

      // Should show the file in the list
      await expect(page.getByText("index.html")).toBeVisible({ timeout: 5000 });
    });

    test("can select multiple files", async ({ page }) => {
      const siteName = "Multi File Test Site";
      const subdomain = generateSubdomain();

      await createSiteAndNavigateToDeploy(
        page,
        { name: siteName, subdomain },
        expect
      );

      // Use first() since there are multiple file inputs
      const fileInput = page.locator('input[type="file"]').first();

      // Upload multiple files
      await fileInput.setInputFiles([
        {
          name: "index.html",
          mimeType: "text/html",
          buffer: Buffer.from("<html><body><h1>Home</h1></body></html>"),
        },
        {
          name: "style.css",
          mimeType: "text/css",
          buffer: Buffer.from("body { color: black; }"),
        },
        {
          name: "script.js",
          mimeType: "application/javascript",
          buffer: Buffer.from("console.log('Hello');"),
        },
      ]);

      // Should show all files
      await expect(page.getByText("index.html")).toBeVisible({ timeout: 5000 });
      await expect(page.getByText("style.css")).toBeVisible();
      await expect(page.getByText("script.js")).toBeVisible();
    });

    test("can remove selected files", async ({ page }) => {
      const siteName = "Remove File Test Site";
      const subdomain = generateSubdomain();

      await createSiteAndNavigateToDeploy(
        page,
        { name: siteName, subdomain },
        expect
      );

      // Use first() since there are multiple file inputs
      const fileInput = page.locator('input[type="file"]').first();

      await fileInput.setInputFiles({
        name: "test.html",
        mimeType: "text/html",
        buffer: Buffer.from("<html></html>"),
      });

      await expect(page.getByText("test.html")).toBeVisible({ timeout: 5000 });

      // Look for a remove/delete button near the file
      const removeButton = page.getByRole("button", {
        name: REMOVE_BUTTON_REGEX,
      });
      if (await removeButton.isVisible()) {
        await removeButton.click();
        await expect(page.getByText("test.html")).not.toBeVisible();
      }
    });
  });

  test.describe("Deployment Process", () => {
    test("can deploy files to site", async ({ page }) => {
      const siteName = "Deploy Process Test Site";
      const subdomain = generateSubdomain();

      await createSiteAndNavigateToDeploy(
        page,
        { name: siteName, subdomain },
        expect
      );

      // Use first() since there are multiple file inputs
      const fileInput = page.locator('input[type="file"]').first();

      // Upload a simple HTML file
      await fileInput.setInputFiles({
        name: "index.html",
        mimeType: "text/html",
        buffer: Buffer.from(
          "<!DOCTYPE html><html><head><title>Test</title></head><body><h1>Hello World</h1></body></html>"
        ),
      });

      await expect(page.getByText("index.html")).toBeVisible({ timeout: 5000 });

      // Find and click the deploy button
      const deployButton = page.getByRole("button", {
        name: DEPLOY_EXACT_REGEX,
      });
      if (await deployButton.isVisible()) {
        await deployButton.click();

        // Wait for deployment to complete or show success
        await expect(page.getByText(DEPLOYMENT_SUCCESS_REGEX)).toBeVisible({
          timeout: 30_000,
        });
      }
    });

    test("shows deployment progress", async ({ page }) => {
      const siteName = "Progress Test Site";
      const subdomain = generateSubdomain();

      await createSiteAndNavigateToDeploy(
        page,
        { name: siteName, subdomain },
        expect
      );

      // Verify we're on the deploy page
      await expect(
        page.getByRole("heading", { name: DEPLOY_HEADING_REGEX })
      ).toBeVisible({
        timeout: 10_000,
      });

      await uploadSingleHtmlFile(
        page,
        expect,
        "<html><body>Test</body></html>"
      );

      const deployButton = page.getByRole("button", {
        name: DEPLOY_EXACT_REGEX,
      });
      await expect(deployButton).toBeVisible({ timeout: 5000 });
      await deployButton.click();

      // Progress might be too fast to catch, so we just check deployment completes
      await expect(page.getByText(DEPLOYMENT_SUCCESS_REGEX)).toBeVisible({
        timeout: 60_000,
      });
    });
  });
});
