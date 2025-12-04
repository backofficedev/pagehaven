import { readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import chalk from "chalk";
import { Command } from "commander";
import { glob } from "glob";
import ora from "ora";
import { api } from "../lib/api";
import { isAuthenticated } from "../lib/config";

const BATCH_SIZE = 10;
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export const deployCommand = new Command("deploy")
  .description("Deploy a directory to a Pagehaven site")
  .argument("<directory>", "Directory to deploy")
  .option("-s, --site <siteId>", "Site ID to deploy to")
  .option("-m, --message <message>", "Deployment message")
  .action(
    async (directory: string, options: { site?: string; message?: string }) => {
      if (!isAuthenticated()) {
        console.log(chalk.red("Not authenticated. Run: pagehaven login"));
        process.exit(1);
      }

      if (!options.site) {
        console.log(chalk.red("Site ID is required. Use --site <siteId>"));
        console.log("Run: pagehaven sites list to see your sites");
        process.exit(1);
      }

      const spinner = ora("Scanning files...").start();

      try {
        // Scan directory for files
        const files = await glob("**/*", {
          cwd: directory,
          nodir: true,
          dot: false,
          ignore: [
            "**/node_modules/**",
            "**/.git/**",
            "**/.DS_Store",
            "**/Thumbs.db",
          ],
        });

        if (files.length === 0) {
          spinner.fail("No files found in directory");
          process.exit(1);
        }

        spinner.text = `Found ${files.length} files`;

        // Validate file sizes
        const filesToUpload: { path: string; content: string; size: number }[] =
          [];
        let totalSize = 0;

        for (const file of files) {
          const fullPath = join(directory, file);
          const stats = statSync(fullPath);

          if (stats.size > MAX_FILE_SIZE) {
            spinner.warn(
              `Skipping ${file} (exceeds ${MAX_FILE_SIZE / 1024 / 1024}MB limit)`
            );
            continue;
          }

          const content = readFileSync(fullPath);
          filesToUpload.push({
            path: file,
            content: content.toString("base64"),
            size: stats.size,
          });
          totalSize += stats.size;
        }

        spinner.text = `Preparing ${filesToUpload.length} files (${formatSize(totalSize)})`;

        // Create deployment
        spinner.text = "Creating deployment...";
        const deployment = await api.deployments.create(
          options.site,
          options.message
        );

        // Mark as processing
        await api.deployments.markProcessing(deployment.id);

        // Upload files in batches
        spinner.text = "Uploading files...";
        let uploaded = 0;

        for (let i = 0; i < filesToUpload.length; i += BATCH_SIZE) {
          const batch = filesToUpload.slice(i, i + BATCH_SIZE);
          await api.upload.uploadFiles(
            deployment.id,
            batch.map((f) => ({
              filePath: f.path,
              content: f.content,
            }))
          );
          uploaded += batch.length;
          spinner.text = `Uploading files... ${uploaded}/${filesToUpload.length}`;
        }

        // Finalize deployment
        spinner.text = "Finalizing deployment...";
        await api.deployments.finalize(
          deployment.id,
          filesToUpload.length,
          totalSize
        );

        spinner.succeed(chalk.green("Deployment successful!"));
        console.log();
        console.log(`  ${chalk.bold("Files:")} ${filesToUpload.length}`);
        console.log(`  ${chalk.bold("Size:")} ${formatSize(totalSize)}`);
        console.log(
          `  ${chalk.bold("URL:")} https://${options.site}.pagehaven.io`
        );
      } catch (error) {
        spinner.fail("Deployment failed");
        console.error(
          chalk.red(error instanceof Error ? error.message : "Unknown error")
        );
        process.exit(1);
      }
    }
  );

function formatSize(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
