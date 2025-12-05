import { getConfig, getToken } from "./config";

export class ApiError extends Error {
  statusCode: number;

  constructor(message: string, statusCode: number) {
    super(message);
    this.name = "ApiError";
    this.statusCode = statusCode;
  }
}

type RequestOptions = {
  method?: "GET" | "POST" | "PUT" | "DELETE";
  body?: unknown;
};

async function request<T>(
  path: string,
  options: RequestOptions = {}
): Promise<T> {
  const config = getConfig();
  const token = getToken();

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${config.apiUrl}${path}`, {
    method: options.method ?? "GET",
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  if (!response.ok) {
    const errorData = (await response
      .json()
      .catch(() => ({ message: "Unknown error" }))) as { message?: string };
    throw new ApiError(errorData.message ?? "Request failed", response.status);
  }

  return response.json();
}

export type Site = {
  id: string;
  name: string;
  subdomain: string;
  customDomain?: string;
  activeDeploymentId?: string;
};

export type Deployment = {
  id: string;
  siteId: string;
  status: "pending" | "processing" | "live" | "failed";
  fileCount: number;
  totalSize: number;
  createdAt: string;
};

export const api = {
  sites: {
    list: () => request<Site[]>("/rpc/site.list"),
    get: (siteId: string) =>
      request<Site>("/rpc/site.get", {
        method: "POST",
        body: { siteId },
      }),
    create: (name: string) =>
      request<Site>("/rpc/site.create", {
        method: "POST",
        body: { name },
      }),
  },
  deployments: {
    list: (siteId: string) =>
      request<Deployment[]>("/rpc/deployment.list", {
        method: "POST",
        body: { siteId },
      }),
    create: (siteId: string, commitMessage?: string) =>
      request<Deployment>("/rpc/deployment.create", {
        method: "POST",
        body: { siteId, commitMessage },
      }),
    markProcessing: (deploymentId: string) =>
      request<Deployment>("/rpc/deployment.markProcessing", {
        method: "POST",
        body: { deploymentId },
      }),
    finalize: (deploymentId: string, fileCount: number, totalSize: number) =>
      request<Deployment>("/rpc/deployment.finalize", {
        method: "POST",
        body: { deploymentId, fileCount, totalSize },
      }),
  },
  upload: {
    uploadFiles: (
      deploymentId: string,
      files: { filePath: string; content: string }[]
    ) =>
      request<{ uploaded: number }>("/rpc/upload.uploadFiles", {
        method: "POST",
        body: { deploymentId, files },
      }),
  },
};

/**
 * Create an API client with custom URL and token
 */
export function createApi(apiUrl: string, token?: string) {
  async function customRequest<T>(
    path: string,
    options: RequestOptions = {}
  ): Promise<T> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(`${apiUrl}${path}`, {
      method: options.method ?? "GET",
      headers,
      body: options.body ? JSON.stringify(options.body) : undefined,
    });

    if (!response.ok) {
      const errorData = (await response
        .json()
        .catch(() => ({ message: "Unknown error" }))) as { message?: string };
      throw new ApiError(
        errorData.message ?? "Request failed",
        response.status
      );
    }

    return response.json();
  }

  return {
    sites: {
      list: () => customRequest<Site[]>("/rpc/site.list"),
      get: (siteId: string) =>
        customRequest<Site>("/rpc/site.get", {
          method: "POST",
          body: { siteId },
        }),
      create: (name: string) =>
        customRequest<Site>("/rpc/site.create", {
          method: "POST",
          body: { name },
        }),
    },
    deployments: {
      list: (siteId: string) =>
        customRequest<Deployment[]>("/rpc/deployment.list", {
          method: "POST",
          body: { siteId },
        }),
    },
  };
}
