import path from "node:path";
import { loadEnv } from "@pagehaven/config/env";
import { getInfraName } from "@pagehaven/infra/constants";
import {
  getDomainEnvVar,
  isDevelopmentEnvironment,
} from "@pagehaven/infra/helpers";
import { createApp } from "@pagehaven/infra/resources";
import { Vite } from "alchemy/cloudflare";
import { GitHubComment } from "alchemy/github";

loadEnv({ envDir: path.join(import.meta.dirname, "../../") });

const PORT = 3001;
const app = await createApp(getInfraName().WEB_APP_NAME);
const stage = app.stage;

// Global env
const WEB_DOMAIN = getDomainEnvVar(stage, "WEB_DOMAIN");
const domains = isDevelopmentEnvironment(stage) ? undefined : [WEB_DOMAIN];

export const web = await Vite(getInfraName().RESOURCE_NAME, {
  assets: path.join(import.meta.dirname, "dist"),
  domains,
  placement: {
    mode: "smart",
  },
  build: {
    command: "bun run --bun vite build",
  },
  dev: {
    command: `bun run --bun vite --port ${PORT}`,
  },
});

console.log(`${app.appName} -> ${web.url}`);

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
