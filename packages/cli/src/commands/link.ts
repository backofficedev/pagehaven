import chalk from "chalk";
import { Command } from "commander";
import ora from "ora";
import { createApi } from "../lib/api";
import { getConfig, isAuthenticated, saveConfig } from "../lib/config";
import { readProjectConfig, updateProjectConfig } from "./init";

export const linkCommand = new Command("link")
  .description("Link the current directory to a Pagehaven site")
  .option("-s, --site <siteId>", "Site ID to link to")
  .option("-c, --create <name>", "Create a new site with this name")
  // biome-ignore lint/complexity/noExcessiveCognitiveComplexity: CLI command with multiple branches
  .action(async (options) => {
    if (!isAuthenticated()) {
      console.log(chalk.red("Not authenticated. Run `pagehaven login` first."));
      process.exit(1);
    }

    const config = getConfig();
    const api = createApi(config.apiUrl, config.token);

    let siteId: string;

    if (options.create) {
      // Create a new site
      const spinner = ora("Creating site...").start();
      try {
        const site = await api.sites.create(options.create);
        siteId = site.id;
        spinner.succeed(
          `Created site: ${chalk.cyan(site.name)} (${site.subdomain})`
        );
      } catch (error) {
        spinner.fail("Failed to create site");
        console.log(
          chalk.red(error instanceof Error ? error.message : "Unknown error")
        );
        process.exit(1);
      }
    } else if (options.site) {
      siteId = options.site;
    } else {
      // List sites and let user choose
      const spinner = ora("Fetching sites...").start();
      try {
        const sites = await api.sites.list();
        spinner.stop();

        if (sites.length === 0) {
          console.log(chalk.yellow("No sites found."));
          console.log(
            `Create one with: ${chalk.cyan("pagehaven link --create <name>")}`
          );
          process.exit(0);
        }

        console.log("\nAvailable sites:");
        for (const [index, site] of sites.entries()) {
          console.log(
            `  ${chalk.gray(`${index + 1}.`)} ${site.name} ${chalk.gray(`(${site.subdomain})`)}`
          );
        }

        console.log();
        console.log(
          `Use ${chalk.cyan("pagehaven link --site <siteId>")} to link to a site`
        );
        console.log(
          `Or ${chalk.cyan("pagehaven link --create <name>")} to create a new one`
        );
        process.exit(0);
      } catch (error) {
        spinner.fail("Failed to fetch sites");
        console.log(
          chalk.red(error instanceof Error ? error.message : "Unknown error")
        );
        process.exit(1);
      }
    }

    // Update project config
    const projectConfig = readProjectConfig();
    if (projectConfig) {
      updateProjectConfig({ siteId });
      console.log(chalk.green("✓ Updated pagehaven.yaml with site ID"));
    } else {
      // Create a new config file
      updateProjectConfig({ siteId, outputDirectory: "dist" });
      console.log(chalk.green("✓ Created pagehaven.yaml with site ID"));
    }

    // Also save as default in global config
    saveConfig({ defaultSiteId: siteId });
    console.log(chalk.green("✓ Set as default site"));

    console.log();
    console.log(`Deploy with: ${chalk.cyan("pagehaven deploy")}`);
  });
