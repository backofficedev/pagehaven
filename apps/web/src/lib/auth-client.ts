import type { auth } from "@pagehaven/auth";
import { inferAdditionalFields } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";
import { config } from "@/utils/config";

export const authClient = createAuthClient({
  baseURL: config.serverUrl,
  plugins: [inferAdditionalFields<typeof auth>()],
});
