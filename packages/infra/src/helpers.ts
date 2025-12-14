import { userInfo } from "node:os";
import { getProcessEnvVar, missingEnvVarError } from "@pagehaven/config/env";
import alchemy, { type Secret } from "alchemy";

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

function getDomainByEnvironment(
  environment: Environment,
  domain: string
): string {
  if (isDevelopmentEnvironment(environment) || environment === "prod") {
    return domain;
  }

  return `${environment}.${domain}`;
}

export function getDomainEnvVar(
  environment: Environment,
  domainKey: string
): string {
  return getDomainByEnvironment(environment, getEnvVar(domainKey));
}

export function getDomainEnvVarFromProcess(
  environment: Environment,
  domainKey: string
): string {
  return getDomainByEnvironment(environment, getProcessEnvVar(domainKey));
}

export function buildUrl(environment: Environment, domain: string): string {
  const protocol = getProtocolByEnvironment(environment);
  const finalDomain = getDomainByEnvironment(environment, domain);
  return `${protocol}://${finalDomain}`;
}

export function getEnvVar(key: string): string {
  const value = alchemy.env[key];
  if (value === undefined) {
    throw missingEnvVarError(key);
  }
  return value;
}

export function getSecretEnvVar(key: string): Secret<string> {
  const value = alchemy.secret.env[key];
  if (value === undefined) {
    throw missingEnvVarError(key);
  }
  return value;
}
