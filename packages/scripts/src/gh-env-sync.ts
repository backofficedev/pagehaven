#!/usr/bin/env bun
import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import {
  getEnvFilePatterns,
  getProcessEnvVar,
  loadEnv,
} from "@pagehaven/config/env";
import alchemy from "alchemy";
import { GitHubSecret } from "alchemy/github";
import { Command } from "commander";
import { parse } from "dotenv";
import YAML from "yaml";

type Environment = "preview" | "staging" | "production";

const VALID_ENVIRONMENTS: Environment[] = ["preview", "staging", "production"];

const program = new Command();

program
  .name("gh-env-sync")
  .description(
    "Sync environment variables from .env.{ENV} files to GitHub secrets"
  )
  .requiredOption(
    "-e, --env <environment>",
    "Source environment to sync from (preview, staging, or production)"
  )
  .option(
    "-g, --github-env <environment>",
    "GitHub environment to sync to (defaults to --env value)"
  )
  .option(
    "-n, --dry-run",
    "Preview what would be synced without actually doing it"
  )
  .option("-o, --owner <owner>", "GitHub repository owner", "backofficedev")
  .option("-r, --repo <repo>", "GitHub repository name", "pagehaven")
  .option("-d, --debug", "Show environment variable values in output")
  .parse();

const options = program.opts<{
  env: string;
  githubEnv?: string;
  dryRun?: boolean;
  owner: string;
  repo: string;
  debug?: boolean;
}>();

function validateEnvironment(env: string): Environment {
  if (!VALID_ENVIRONMENTS.includes(env as Environment)) {
    console.error(
      `Error: Environment must be one of: ${VALID_ENVIRONMENTS.join(", ")}`
    );
    process.exit(1);
  }
  return env as Environment;
}

function findEnvFilesInDirectory(
  baseDir: string,
  envPatterns: string[],
  relativePrefix = ""
): { path: string; relativePath: string }[] {
  const envFiles: { path: string; relativePath: string }[] = [];

  for (const envPattern of envPatterns) {
    const envFile = path.join(baseDir, envPattern);
    if (existsSync(envFile)) {
      envFiles.push({
        path: envFile,
        relativePath: relativePrefix
          ? `${relativePrefix}/${envPattern}`
          : envPattern,
      });
    }
  }

  return envFiles;
}

function findAppEnvFiles(
  appsDir: string,
  envPatterns: string[]
): { path: string; relativePath: string }[] {
  if (!existsSync(appsDir)) {
    return [];
  }

  const envFiles: { path: string; relativePath: string }[] = [];
  const appDirs = readdirSync(appsDir, { withFileTypes: true });

  for (const appDir of appDirs) {
    if (!appDir.isDirectory()) {
      continue;
    }

    // Load env for each app directory
    loadEnv({ envDir: path.join(appsDir, appDir.name), mode: options.env });

    const appEnvFiles = findEnvFilesInDirectory(
      path.join(appsDir, appDir.name),
      envPatterns,
      `apps/${appDir.name}`
    );
    envFiles.push(...appEnvFiles);
  }

  return envFiles;
}

function findEnvFiles(
  projectRoot: string,
  envPatterns: string[]
): { path: string; relativePath: string }[] {
  // Load env for root directory
  loadEnv({ envDir: projectRoot, mode: options.env });

  const rootEnvFiles = findEnvFilesInDirectory(projectRoot, envPatterns);
  const appEnvFiles = findAppEnvFiles(
    path.join(projectRoot, "apps"),
    envPatterns
  );

  return [...rootEnvFiles, ...appEnvFiles];
}

function parseEnvFile(filePath: string): Record<string, string> {
  const content = readFileSync(filePath, "utf-8");
  return parse(content);
}

type SyncOptions = {
  envVars: Map<string, { value: string; source: string }>;
  githubEnv: string;
  owner: string;
  repo: string;
  dryRun: boolean;
  debug?: boolean;
};

type DeployYmlValidation = {
  valid: boolean;
  missingVars: string[];
  deployYmlVars: string[];
};

function parseDeployYml(projectRoot: string): string[] {
  const deployYmlPath = path.join(
    projectRoot,
    ".github",
    "workflows",
    "deploy.yml"
  );

  if (!existsSync(deployYmlPath)) {
    throw new Error(`deploy.yml not found at ${deployYmlPath}`);
  }

  const content = readFileSync(deployYmlPath, "utf-8");
  const parsed = YAML.parse(content);

  const envVars: string[] = [];

  if (parsed.env && typeof parsed.env === "object") {
    for (const key of Object.keys(parsed.env)) {
      if (key !== "STAGE") {
        envVars.push(key);
      }
    }
  }

  return envVars;
}

function validateEnvVarsInDeployYml(
  envVars: Map<string, { value: string; source: string }>,
  projectRoot: string
): DeployYmlValidation {
  const deployYmlVars = parseDeployYml(projectRoot);
  const envVarKeys = Array.from(envVars.keys());

  const missingVars = envVarKeys.filter((key) => !deployYmlVars.includes(key));

  return {
    valid: missingVars.length === 0,
    missingVars,
    deployYmlVars,
  };
}

async function syncToGitHub(opts: SyncOptions) {
  const { envVars, githubEnv, owner, repo, dryRun, debug } = opts;
  if (dryRun) {
    console.log(
      `\nDRY RUN: Would sync the following environment variables to GitHub environment '${githubEnv}':\n`
    );
    for (const [key, { value, source }] of envVars) {
      const debugInfo = debug ? ` = ${value}` : "";
      console.log(`  ${key} (from ${source})${debugInfo}`);
    }
    console.log(`\nTotal variables: ${envVars.size}`);
    console.log(
      "\nDRY RUN: No actual changes were made. Run without --dry-run to perform the sync."
    );
    return;
  }

  console.log(
    `\nSyncing ${envVars.size} environment variables to GitHub environment '${githubEnv}'...`
  );

  const app = await alchemy("gh-env-sync", {
    stage: githubEnv,
    phase: "up",
    quiet: false,
  });

  await Promise.all(
    Array.from(envVars.entries()).map(([key, { value }]) =>
      GitHubSecret(`secret-${key}`, {
        owner,
        repository: repo,
        name: key,
        value: alchemy.secret(value),
        environment: githubEnv,
      })
    )
  );

  await app.finalize();

  console.log(
    `\n✅ Successfully synced ${envVars.size} environment secrets to GitHub environment '${githubEnv}'`
  );
}

function getProjectRoot(): string {
  // Navigate up from packages/scripts/src to project root
  const scriptDir = import.meta.dirname;
  return path.resolve(scriptDir, "../../..");
}

async function main() {
  const env = validateEnvironment(options.env);
  const githubEnv = options.githubEnv ?? env;
  const dryRun = options.dryRun ?? false;
  const debug = options.debug ?? false;
  const { owner, repo } = options;

  const projectRoot = getProjectRoot();

  // Determine env file pattern
  const envFilePatterns = getEnvFilePatterns(env);

  // Find all matching env files
  const envFiles = findEnvFiles(projectRoot, envFilePatterns);

  if (envFiles.length === 0) {
    console.error(
      `Error: No environment files matching ${envFilePatterns.join(", ")} found in root or apps/`
    );
    process.exit(1);
  }

  console.log(`Found ${envFiles.length} environment file(s):`);
  for (const file of envFiles) {
    console.log(`  - ${file.relativePath}`);
  }

  // Collect all env vars from files
  const allEnvVars = new Map<string, { value: string; source: string }>();

  for (const file of envFiles) {
    const vars = parseEnvFile(file.path);
    for (const key of Object.keys(vars)) {
      // Get value from process.env after expansion
      const val = getProcessEnvVar(key);
      // Later files override earlier ones
      allEnvVars.set(key, { value: val, source: file.relativePath });
    }
  }

  if (allEnvVars.size === 0) {
    console.log("\nNo environment variables found to sync.");
    return;
  }

  const validation = validateEnvVarsInDeployYml(allEnvVars, projectRoot);

  if (validation.valid) {
    console.log(
      "\n✅ deploy.yml validation passed - all env vars are defined."
    );
  } else {
    console.log("\n⚠️  deploy.yml validation failed!");
    console.log(
      "The following environment variables are not defined in .github/workflows/deploy.yml:"
    );
    for (const varName of validation.missingVars) {
      console.log(`  - ${varName}`);
    }
    console.log(
      "\nPlease add these variables to the 'env' section of deploy.yml before syncing."
    );

    if (!dryRun) {
      console.log(
        "\n❌ Sync aborted. Use --dry-run flag to preview and proceed despite validation failure."
      );
      process.exit(1);
    }
    console.log(
      "\n⚠️  Dry run mode enabled - proceeding with sync despite validation failure."
    );
  }

  await syncToGitHub({
    envVars: allEnvVars,
    githubEnv,
    owner,
    repo,
    dryRun,
    debug,
  });
}

main().catch((error) => {
  console.error("Error:", error.message);
  process.exit(1);
});
