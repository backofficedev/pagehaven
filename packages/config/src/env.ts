import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { config } from "dotenv";
import dotenvExpand from "dotenv-expand";

export const APP_NAME_KEYS = [
  "SERVER_APP_NAME",
  "STATIC_APP_NAME",
  "WEB_APP_NAME",
] as const;

const envKeys = [
  "REPO_NAME",
  "APP_NAME_PREFIX",
  "SERVER_RESOURCE_NAME",
  "STATIC_RESOURCE_NAME",
  "WEB_RESOURCE_NAME",
  ...APP_NAME_KEYS,
] as const;

let _env: Record<(typeof envKeys)[number], string> | undefined;

export function getEnv() {
  if (!_env) {
    _env = buildEnv();
  }
  return _env;
}

export function getProcessEnvVar(key: string): string {
  const value = process.env[key];
  if (value === undefined) {
    throw missingEnvVarError(key);
  }
  return value;
}

function buildEnv() {
  return envKeys.reduce(
    (acc, key) => {
      acc[key] = getProcessEnvVar(key);
      return acc;
    },
    {} as Record<(typeof envKeys)[number], string>
  );
}

type EnvMode = "development" | "production" | "test" | string;
type LoadEnvOptions = {
  mode?: EnvMode;
  envDir?: string;
};

export function getEnvFilePatterns(mode: string): string[] {
  return [
    /* default */ ".env",
    /* local overrides */ ".env.local",
    /* mode file */ mode && `.env.${mode}`,
    /* mode local overrides */ mode && `.env.${mode}.local`,
  ].filter(Boolean);
}

export function loadEnv(options: LoadEnvOptions = {}) {
  const { mode = process.env.NODE_ENV || "development", envDir } = options;
  const basePath = envDir ?? process.cwd();
  const envFiles = getEnvFilePatterns(mode);

  // Load each file in sequence, with later files taking precedence
  // Use dotenv-expand to handle ${VAR} variable expansion
  for (const file of envFiles) {
    const path = resolve(basePath, file);
    if (existsSync(path)) {
      dotenvExpand.expand(config({ path, override: true }));
    }
  }
}

export function missingEnvVarError(key: string) {
  return new Error(
    `Missing environment variable: ${key}, value: ${process.env[key]}`
  );
}
