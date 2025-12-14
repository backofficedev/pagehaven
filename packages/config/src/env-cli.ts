#!/usr/bin/env bun
import { loadEnvIfNotCI } from "./env";
import { findWorkspaceRoot } from "./path";

const ENV_VAR_NAME_PATTERN = /^[A-Z][A-Z0-9_]*$/;
const ENV_VAR_REF_PATTERN = /\$\{?([A-Z][A-Z0-9_]*)\}?/g;

const args = process.argv.slice(2);

// Support both "env-cli -- cmd" and "env-cli cmd" syntax
// The -- is optional and just separates options from command
const separatorIndex = args.indexOf("--");
const commandArgs =
  separatorIndex === -1 ? args : args.slice(separatorIndex + 1);

if (commandArgs.length === 0) {
  console.error("Usage: env-cli [--] <command> [args...]");
  process.exit(1);
}

// Load env from monorepo root first, then current directory (for overrides)
const rootDir = findWorkspaceRoot(process.cwd());
const cwd = process.cwd();

loadEnvIfNotCI({ envDir: rootDir });
if (cwd !== rootDir) {
  loadEnvIfNotCI({ envDir: cwd });
}

// Expand environment variable references in command args
// Supports both $VAR and ${VAR} syntax, and plain VAR_NAME that matches an env key
const expandedArgs = commandArgs.map((arg) => {
  // If arg looks like an env var name (all caps with underscores), expand it
  if (ENV_VAR_NAME_PATTERN.test(arg) && process.env[arg]) {
    return process.env[arg];
  }
  // Also expand $VAR and ${VAR} patterns
  return arg.replace(ENV_VAR_REF_PATTERN, (_, name) => process.env[name] ?? "");
});

const command = expandedArgs.join(" ");

// biome-ignore lint/correctness/noUndeclaredVariables: <Exists with bun runtime>
const proc = Bun.spawn({
  cmd: ["sh", "-c", command],
  stdio: ["inherit", "inherit", "inherit"],
  env: { ...process.env },
  cwd,
});

const exitCode = await proc.exited;
process.exit(exitCode);
