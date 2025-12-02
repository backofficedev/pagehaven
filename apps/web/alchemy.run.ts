import path from "node:path";
import alchemy from "alchemy";
import { Vite } from "alchemy/cloudflare";
import { config } from "dotenv";
import { server } from "server/alchemy";

config({ path: path.join(import.meta.dirname, ".env") });

const app = await alchemy("web");

if (alchemy.env.VITE_SERVER_URL !== server.url) {
  throw new Error("VITE_SERVER_URL does not match server.url");
}

export const web = await Vite("web", {
  assets: path.join(import.meta.dirname, "dist"),
  bindings: {
    VITE_SERVER_URL: server.url,
  },
  dev: {
    command: "bun run dev",
  },
});

console.log(`Web    -> ${web.url}`);

await app.finalize();
