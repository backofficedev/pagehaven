/**
 * Shared GitHub API utilities
 */

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

  return response.json() as Promise<T>;
}
