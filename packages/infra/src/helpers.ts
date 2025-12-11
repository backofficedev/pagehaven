import { userInfo } from "node:os";

type Environment = "dev" | "prod" | string;

let cachedUsername: string | null = null;

export function getUsername(): string {
  if (cachedUsername) {
    return cachedUsername;
  }

  try {
    cachedUsername = userInfo().username;
    return cachedUsername;
  } catch {
    cachedUsername = "dev";
    return cachedUsername;
  }
}

export function isDevelopmentEnvironment(environment: Environment): boolean {
  const username = getUsername();
  return environment === "dev" || environment === username;
}

function getProtocolByEnvironment(environment: Environment): "http" | "https" {
  return isDevelopmentEnvironment(environment) ? "http" : "https";
}

export function getDomainByEnvironment(
  environment: Environment,
  domain: string
): string {
  if (isDevelopmentEnvironment(environment) || environment === "prod") {
    return domain;
  }

  return `${environment}.${domain}`;
}

export function buildUrl(environment: Environment, domain: string): string {
  const protocol = getProtocolByEnvironment(environment);
  const finalDomain = getDomainByEnvironment(environment, domain);
  return `${protocol}://${finalDomain}`;
}
