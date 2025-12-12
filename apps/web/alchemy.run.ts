import path from "node:path";
import {
  getDomainByEnvironment,
  isDevelopmentEnvironment,
} from "@pagehaven/infra/helpers";
import { createApp } from "@pagehaven/infra/resources";
import alchemy from "alchemy";
import { Vite } from "alchemy/cloudflare";
import { GitHubComment } from "alchemy/github";
import { config } from "dotenv";

config({ path: path.join(import.meta.dirname, "../../.env") });

const PORT = 3001;
const app = await createApp("web");
const stage = app.stage;

// Global env
const WEB_DOMAIN = getDomainByEnvironment(stage, alchemy.env.WEB_DOMAIN || "");
const domains = isDevelopmentEnvironment(stage) ? undefined : [WEB_DOMAIN];

export const web = await Vite("web", {
  assets: path.join(import.meta.dirname, "dist"),
  domains,
  placement: {
    mode: "smart",
  },
  build: {
    command: "bun run vite build",
  },
  dev: {
    command: `bun run vite --port ${PORT}`,
  },
});

console.log(`Web -> ${web.url}`);

if (process.env.PULL_REQUEST) {
  // if this is a PR, add a comment to the PR with the preview URL
  // it will auto-update with each push
  const [owner, repo] = (process.env.GITHUB_REPOSITORY || "").split("/");
  await GitHubComment("preview-comment", {
    owner: process.env.GITHUB_REPOSITORY_OWNER || owner || "backofficedev",
    repository: process.env.GITHUB_REPOSITORY_NAME || repo || "pagehaven",
    issueNumber: Number(process.env.PULL_REQUEST),
    body: `## 🚀 Preview Deployed

Your changes have been deployed to a preview environment:

**🌐 Website:** ${web.url}

Built from commit ${process.env.GITHUB_SHA?.slice(0, 7)}

---
<sub>🤖 This comment updates automatically with each push.</sub>`,
  });
}

await app.finalize();
