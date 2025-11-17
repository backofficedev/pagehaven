import { WorkOS } from "@workos-inc/node";
import { getConfig } from "./config";
import { lazy } from "./utils";

export const getWorkOS = lazy(() => {
	const apiKey = getConfig<string>("apiKey");
	if (!apiKey) {
		throw new Error("WORKOS_API_KEY is required");
	}

	const apiHostname = getConfig<string>("apiHostname");
	const https = getConfig<boolean>("https");
	const port = getConfig<number>("port");

	return new WorkOS(apiKey, {
		apiHostname,
		https,
		port,
	});
});

// Export a direct instance for convenience
export const workos = getWorkOS();
