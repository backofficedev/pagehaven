import { env } from "cloudflare:workers";

const CLOUDFLARE_API_BASE = "https://api.cloudflare.com/client/v4";

type DnsRecordType =
  | "A"
  | "AAAA"
  | "CNAME"
  | "TXT"
  | "MX"
  | "NS"
  | "SRV"
  | "CAA";

type DnsRecordPayload = {
  type: DnsRecordType;
  name: string;
  content: string;
  ttl?: number;
  proxied?: boolean;
  priority?: number;
  comment?: string;
};

type CloudflareDnsRecord = {
  id: string;
  type: string;
  name: string;
  content: string;
  proxiable: boolean;
  proxied: boolean;
  ttl: number;
  zone_id: string;
  zone_name: string;
  created_on: string;
  modified_on: string;
  priority?: number;
  comment?: string;
};

type CloudflareResponse<T> = {
  success: boolean;
  errors: Array<{ code: number; message: string }>;
  messages: string[];
  result: T;
};

function getApiToken(): string {
  const token = (env as { CLOUDFLARE_API_TOKEN?: string }).CLOUDFLARE_API_TOKEN;
  if (!token) {
    throw new Error("CLOUDFLARE_API_TOKEN is not configured");
  }
  return token;
}

function getZoneId(): string {
  const zoneId = (env as { ZONE_ID?: string }).ZONE_ID;
  if (!zoneId) {
    throw new Error("ZONE_ID is not configured");
  }
  return zoneId;
}

function getStaticDomain(): string {
  const domain = (env as { STATIC_DOMAIN?: string }).STATIC_DOMAIN;
  // Extract base domain from STATIC_DOMAIN (e.g., "pagehaven.io")
  // In development this might be "localhost:3002" so we handle that
  if (!domain || domain.includes("localhost")) {
    return "";
  }
  return domain;
}

async function cfFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<CloudflareResponse<T>> {
  const response = await fetch(`${CLOUDFLARE_API_BASE}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${getApiToken()}`,
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  const data = (await response.json()) as CloudflareResponse<T>;

  if (!(response.ok && data.success)) {
    const errorMessage =
      data.errors?.map((e) => e.message).join(", ") || response.statusText;
    throw new Error(`Cloudflare API error: ${errorMessage}`);
  }

  return data;
}

/**
 * Create a CNAME DNS record for a subdomain pointing to the static domain
 */
export async function createSubdomainDnsRecord(
  subdomain: string
): Promise<CloudflareDnsRecord> {
  const staticDomain = getStaticDomain();
  if (!staticDomain) {
    // Skip DNS creation in development
    console.log(
      `Skipping DNS record creation for ${subdomain} (development mode)`
    );
    return {} as CloudflareDnsRecord;
  }

  const zoneId = getZoneId();
  const fullDomain = `${subdomain}.${staticDomain}`;

  const payload: DnsRecordPayload = {
    type: "CNAME",
    name: fullDomain,
    content: staticDomain,
    proxied: true,
    ttl: 1, // Auto TTL when proxied
    comment: `Pagehaven site: ${subdomain}`,
  };

  const response = await cfFetch<CloudflareDnsRecord>(
    `/zones/${zoneId}/dns_records`,
    {
      method: "POST",
      body: JSON.stringify(payload),
    }
  );

  return response.result;
}

/**
 * Delete a DNS record for a subdomain
 */
export async function deleteSubdomainDnsRecord(
  subdomain: string
): Promise<void> {
  const staticDomain = getStaticDomain();
  if (!staticDomain) {
    // Skip DNS deletion in development
    console.log(
      `Skipping DNS record deletion for ${subdomain} (development mode)`
    );
    return;
  }

  const zoneId = getZoneId();
  const fullDomain = `${subdomain}.${staticDomain}`;

  // First, find the record by name
  const listResponse = await cfFetch<CloudflareDnsRecord[]>(
    `/zones/${zoneId}/dns_records?type=CNAME&name=${encodeURIComponent(fullDomain)}`
  );

  const record = listResponse.result[0];
  if (!record) {
    console.log(`DNS record not found for ${fullDomain}, skipping deletion`);
    return;
  }

  // Delete the record
  await cfFetch<{ id: string }>(`/zones/${zoneId}/dns_records/${record.id}`, {
    method: "DELETE",
  });
}

/**
 * Check if a DNS record exists for a subdomain
 */
export async function checkSubdomainDnsRecord(
  subdomain: string
): Promise<CloudflareDnsRecord | null> {
  const staticDomain = getStaticDomain();
  if (!staticDomain) {
    return null;
  }

  const zoneId = getZoneId();
  const fullDomain = `${subdomain}.${staticDomain}`;

  const response = await cfFetch<CloudflareDnsRecord[]>(
    `/zones/${zoneId}/dns_records?type=CNAME&name=${encodeURIComponent(fullDomain)}`
  );

  return response.result[0] ?? null;
}

/**
 * Update a DNS record (e.g., when subdomain changes)
 */
export async function updateSubdomainDnsRecord(
  oldSubdomain: string,
  newSubdomain: string
): Promise<CloudflareDnsRecord | null> {
  const staticDomain = getStaticDomain();
  if (!staticDomain) {
    return null;
  }

  // Delete old record and create new one
  await deleteSubdomainDnsRecord(oldSubdomain);
  return createSubdomainDnsRecord(newSubdomain);
}
