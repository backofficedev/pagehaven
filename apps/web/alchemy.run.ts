import path from "node:path";
import alchemy from "alchemy";
import { Vite } from "alchemy/cloudflare";
import { config } from "dotenv";

config({ path: path.join(import.meta.dirname, ".env") });

const app = await alchemy("web");

const URL = alchemy.env.VITE_SERVER_URL;

// Only validate server URL during deploy/dev, not destroy
// This avoids circular dependency issues with alchemy destroy
if (app.phase !== "destroy") {
  const { server } = await import("server/alchemy");
  if (URL !== server.url) {
    throw new Error(
      `VITE_SERVER_URL (${URL}) does not match server.url (${server.url})`
    );
  }
}

export const web = await Vite("web", {
  assets: path.join(import.meta.dirname, "dist"),
  bindings: {
    VITE_SERVER_URL: URL,
  },
  dev: {
    command: "bun run dev",
  },
});

console.log(`Web    -> ${web.url}`);

await app.finalize();
