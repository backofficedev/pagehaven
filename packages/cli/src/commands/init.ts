import { existsSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import chalk from "chalk";
import { Command } from "commander";
import { stringify } from "yaml";
import { saveConfig } from "../lib/config";

const CONFIG_FILENAME = "pagehaven.yaml";

type ProjectConfig = {
  name?: string;
  siteId?: string;
  outputDirectory: string;
  buildCommand?: string;
  installCommand?: string;
};

export const initCommand = new Command("init")
  .description("Initialize a Pagehaven project in the current directory")
  .option("-n, --name <name>", "Project name")
  .option("-s, --site <siteId>", "Link to an existing site ID")
  .option("-o, --output <dir>", "Output directory", "dist")
  .option("-b, --build <command>", "Build command")
  .option("-i, --install <command>", "Install command")
  .option("-f, --force", "Overwrite existing config file")
  .action((options) => {
    const cwd = process.cwd();
    const configPath = join(cwd, CONFIG_FILENAME);

    // Check if config already exists
    if (existsSync(configPath) && !options.force) {
      console.log(
        chalk.yellow(
          `Config file ${CONFIG_FILENAME} already exists. Use --force to overwrite.`
        )
      );
      return;
    }

    const projectConfig: ProjectConfig = {
      outputDirectory: options.output,
    };

    if (options.name) {
      projectConfig.name = options.name;
    }

    if (options.site) {
      projectConfig.siteId = options.site;
      // Also save as default site in global config
      saveConfig({ defaultSiteId: options.site });
    }

    if (options.build) {
      projectConfig.buildCommand = options.build;
    }

    if (options.install) {
      projectConfig.installCommand = options.install;
    }

    // Generate YAML content
    const yamlContent = stringify(projectConfig, {
      indent: 2,
      lineWidth: 0,
    });

    // Add header comment
    const content = `# Pagehaven configuration
# See https://pagehaven.io/docs/cli for more options

${yamlContent}`;

    writeFileSync(configPath, content);

    console.log(chalk.green(`✓ Created ${CONFIG_FILENAME}`));
    console.log();
    console.log("Next steps:");
    console.log(
      `  1. ${chalk.cyan("pagehaven login")} - Authenticate with Pagehaven`
    );

    if (options.site) {
      console.log(`  2. ${chalk.cyan("pagehaven deploy")} - Deploy your site`);
    } else {
      console.log(
        `  2. ${chalk.cyan("pagehaven link")} - Link to an existing site or create a new one`
      );
      console.log(`  3. ${chalk.cyan("pagehaven deploy")} - Deploy your site`);
    }
  });

/**
 * Read project config from pagehaven.yaml
 */
export function readProjectConfig(): ProjectConfig | null {
  const cwd = process.cwd();
  const configPath = join(cwd, CONFIG_FILENAME);

  if (!existsSync(configPath)) {
    return null;
  }

  try {
    const { readFileSync } = require("node:fs");
    const { parse } = require("yaml");
    const content = readFileSync(configPath, "utf-8");
    return parse(content) as ProjectConfig;
  } catch {
    return null;
  }
}

/**
 * Update project config
 */
export function updateProjectConfig(updates: Partial<ProjectConfig>): void {
  const cwd = process.cwd();
  const configPath = join(cwd, CONFIG_FILENAME);

  const current = readProjectConfig() ?? { outputDirectory: "dist" };
  const updated = { ...current, ...updates };

  const yamlContent = stringify(updated, {
    indent: 2,
    lineWidth: 0,
  });

  const content = `# Pagehaven configuration
# See https://pagehaven.io/docs/cli for more options

${yamlContent}`;

  writeFileSync(configPath, content);
}
