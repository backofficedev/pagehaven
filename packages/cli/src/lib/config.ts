import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

const CONFIG_DIR = join(homedir(), ".pagehaven");
const CONFIG_FILE = join(CONFIG_DIR, "config.json");

export type Config = {
  apiUrl: string;
  token?: string;
  defaultSiteId?: string;
};

const DEFAULT_CONFIG: Config = {
  apiUrl: "https://api.pagehaven.io",
};

export function getConfig(): Config {
  if (!existsSync(CONFIG_FILE)) {
    return DEFAULT_CONFIG;
  }

  try {
    const content = readFileSync(CONFIG_FILE, "utf-8");
    return { ...DEFAULT_CONFIG, ...JSON.parse(content) };
  } catch {
    return DEFAULT_CONFIG;
  }
}

export function saveConfig(config: Partial<Config>): void {
  if (!existsSync(CONFIG_DIR)) {
    mkdirSync(CONFIG_DIR, { recursive: true });
  }

  const current = getConfig();
  const updated = { ...current, ...config };
  writeFileSync(CONFIG_FILE, JSON.stringify(updated, null, 2));
}

export function getToken(): string | undefined {
  return getConfig().token;
}

export function setToken(token: string): void {
  saveConfig({ token });
}

export function clearToken(): void {
  if (!existsSync(CONFIG_DIR)) {
    return; // No config to clear
  }

  const config = getConfig();
  const { token: _, ...configWithoutToken } = config;
  // Write directly instead of using saveConfig to avoid merging
  writeFileSync(CONFIG_FILE, JSON.stringify(configWithoutToken, null, 2));
}

export function isAuthenticated(): boolean {
  return !!getToken();
}
