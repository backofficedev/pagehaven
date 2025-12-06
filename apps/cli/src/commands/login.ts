import chalk from "chalk";
import { Command } from "commander";
import { clearToken, isAuthenticated, setToken } from "../lib/config";

export const loginCommand = new Command("login")
  .description("Authenticate with Pagehaven")
  .option("-t, --token <token>", "API token")
  .action((options: { token?: string }) => {
    if (options.token) {
      setToken(options.token);
      console.log(chalk.green("✓ Logged in successfully"));
      return;
    }

    console.log(chalk.yellow("To get your API token:"));
    console.log("1. Go to https://pagehaven.io/settings");
    console.log("2. Generate a new API token");
    console.log("3. Run: pagehaven login --token <your-token>");
  });

export const logoutCommand = new Command("logout")
  .description("Log out from Pagehaven")
  .action(() => {
    if (!isAuthenticated()) {
      console.log(chalk.yellow("Not logged in"));
      return;
    }

    clearToken();
    console.log(chalk.green("✓ Logged out successfully"));
  });

export const whoamiCommand = new Command("whoami")
  .description("Show current authentication status")
  .action(() => {
    if (isAuthenticated()) {
      console.log(chalk.green("✓ Authenticated"));
    } else {
      console.log(chalk.yellow("Not authenticated"));
      console.log("Run: pagehaven login --token <your-token>");
    }
  });
