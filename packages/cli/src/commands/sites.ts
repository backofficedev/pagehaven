import chalk from "chalk";
import { Command } from "commander";
import { getApiClient } from "../lib/api";
import { isAuthenticated } from "../lib/config";

export const sitesCommand = new Command("sites")
  .description("Manage your sites")
  .addCommand(
    new Command("list").description("List all your sites").action(async () => {
      if (!isAuthenticated()) {
        console.log(chalk.red("Not authenticated. Run: pagehaven login"));
        process.exit(1);
      }

      try {
        const client = getApiClient();
        const sites = await client.site.list();

        if (sites.length === 0) {
          console.log(chalk.yellow("No sites found"));
          console.log("Create a site at https://pagehaven.io/sites");
          return;
        }

        console.log(chalk.bold("\nYour Sites:\n"));
        for (const site of sites) {
          const status = site.activeDeploymentId
            ? chalk.green("● Live")
            : chalk.yellow("○ No deployment");
          console.log(`  ${chalk.cyan(site.name)}`);
          console.log(`    Subdomain: ${site.subdomain}.pagehaven.io`);
          if (site.customDomain) {
            console.log(`    Domain: ${site.customDomain}`);
          }
          console.log(`    Status: ${status}`);
          console.log(`    ID: ${chalk.dim(site.id)}`);
          console.log();
        }
      } catch (error) {
        console.error(
          chalk.red("Failed to fetch sites:"),
          error instanceof Error ? error.message : "Unknown error"
        );
        process.exit(1);
      }
    })
  );
