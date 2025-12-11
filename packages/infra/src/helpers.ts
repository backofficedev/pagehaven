function getProtocolByEnvironment(environment: string) {
  return environment === "dev" ? "http" : "https";
}

export function getDomainByEnvironment(environment: string, domain: string) {
  return environment !== "dev" && environment !== "prod"
    ? `${environment}.${domain}`
    : domain;
}

export function buildUrl(environment: string, domain: string) {
  return `${getProtocolByEnvironment(environment)}://${domain}`;
}
