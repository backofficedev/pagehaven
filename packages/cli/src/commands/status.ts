import { formatSize } from "@pagehaven/utils/format";
import chalk from "chalk";
import { Command } from "commander";
import ora from "ora";
import { createApiClient } from "../lib/api";
import { getConfig, isAuthenticated } from "../lib/config";
import { readProjectConfig } from "./init";

export const statusCommand = new Command("status")
  .description("Show the status of the current site")
  .option("-s, --site <siteId>", "Site ID (defaults to linked site)")
  // biome-ignore lint/complexity/noExcessiveCognitiveComplexity: CLI command with display logic
  .action(async (options) => {
    if (!isAuthenticated()) {
      console.log(chalk.red("Not authenticated. Run `pagehaven login` first."));
      process.exit(1);
    }

    const globalConfig = getConfig();
    const projectConfig = readProjectConfig();

    const siteId =
      options.site ?? projectConfig?.siteId ?? globalConfig.defaultSiteId;

    if (!siteId) {
      console.log(chalk.red("No site linked."));
      console.log(`Run ${chalk.cyan("pagehaven link")} to link a site.`);
      process.exit(1);
    }

    const client = createApiClient(globalConfig.apiUrl, globalConfig.token);
    const spinner = ora("Fetching site status...").start();

    try {
      const site = await client.site.get({ siteId });
      const deployments = await client.deployment.list({ siteId });
      spinner.stop();

      console.log();
      console.log(chalk.bold("Site Information"));
      console.log(`  Name:      ${site.name}`);
      console.log(
        `  Subdomain: ${chalk.cyan(`${site.subdomain}.pagehaven.io`)}`
      );
      if (site.customDomain) {
        console.log(`  Domain:    ${chalk.cyan(site.customDomain)}`);
      }
      console.log(`  ID:        ${chalk.gray(site.id)}`);

      console.log();
      console.log(chalk.bold("Deployments"));

      if (deployments.length === 0) {
        console.log(chalk.gray("  No deployments yet"));
      } else {
        const recentDeployments = deployments.slice(0, 5);
        for (const deployment of recentDeployments) {
          const statusColor = getStatusColor(deployment.status);
          const isActive = site.activeDeploymentId === deployment.id;
          const activeMarker = isActive ? chalk.green(" ★ LIVE") : "";

          console.log(
            `  ${statusColor(deployment.status.toUpperCase().padEnd(10))} ` +
              `${chalk.gray(deployment.id.slice(0, 8))} ` +
              `${deployment.fileCount ?? 0} files, ${formatSize(deployment.totalSize ?? 0)} ` +
              `${chalk.gray(formatDate(deployment.createdAt))}` +
              activeMarker
          );
        }

        if (deployments.length > 5) {
          console.log(
            chalk.gray(`  ... and ${deployments.length - 5} more deployments`)
          );
        }
      }

      console.log();
    } catch (error) {
      spinner.fail("Failed to fetch status");
      console.log(
        chalk.red(error instanceof Error ? error.message : "Unknown error")
      );
      process.exit(1);
    }
  });

function getStatusColor(status: string) {
  switch (status) {
    case "live":
      return chalk.green;
    case "processing":
      return chalk.yellow;
    case "failed":
      return chalk.red;
    default:
      return chalk.gray;
  }
}

function formatDate(dateInput: Date | string): string {
  const date = dateInput instanceof Date ? dateInput : new Date(dateInput);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60_000);
  const diffHours = Math.floor(diffMs / 3_600_000);
  const diffDays = Math.floor(diffMs / 86_400_000);

  if (diffMins < 1) {
    return "just now";
  }
  if (diffMins < 60) {
    return `${diffMins}m ago`;
  }
  if (diffHours < 24) {
    return `${diffHours}h ago`;
  }
  if (diffDays < 7) {
    return `${diffDays}d ago`;
  }
  return date.toLocaleDateString();
}
