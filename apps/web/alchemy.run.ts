import path from "node:path";
import alchemy from "alchemy";
import { Vite } from "alchemy/cloudflare";

const PORT = 3001;
const app = await alchemy("web");

export const web = await Vite("web", {
  assets: path.join(import.meta.dirname, "dist"),
  placement: {
    mode: "smart",
  },
  dev: {
    command: `bun run vite --port ${PORT}`,
  },
});

console.log(`Web -> ${web.url}`);

await app.finalize();
