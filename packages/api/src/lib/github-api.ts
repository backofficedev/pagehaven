/**
 * Shared GitHub API utilities
 */
import { z } from "zod";

// Zod schema for GitHub API response validation
const GitHubResponseSchema = z.object({
  id: z.number().optional(),
  name: z.string().optional(),
  full_name: z.string().optional(),
  private: z.boolean().optional(),
  // Add more fields as needed for specific endpoints
});

/**
 * GitHub API helper with access token
 */
export async function githubFetch<T>(
  endpoint: string,
  accessToken: string
): Promise<T> {
  const response = await fetch(`https://api.github.com${endpoint}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/vnd.github.v3+json",
      "User-Agent": "PageHaven",
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`GitHub API error: ${response.status} - ${error}`);
  }

  const data = await response.json();

  // Validate response structure with Zod
  const parsed = GitHubResponseSchema.parse(data);

  return parsed as T;
}
