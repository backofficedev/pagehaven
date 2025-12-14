import path from "node:path";
import { loadEnv } from "@pagehaven/config/env";
import {
  buildUrl,
  getDomainEnvVarFromProcess,
  getUsername,
} from "@pagehaven/infra/helpers";
import tailwindcss from "@tailwindcss/vite";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

loadEnv({ envDir: path.join(import.meta.dirname, "../../") });

const stage = process.env.STAGE || getUsername();
const SERVER_DOMAIN = getDomainEnvVarFromProcess(stage, "SERVER_DOMAIN");
const STATIC_DOMAIN = getDomainEnvVarFromProcess(stage, "STATIC_DOMAIN");

process.env.VITE_SERVER_URL = buildUrl(stage, SERVER_DOMAIN);
process.env.VITE_STATIC_DOMAIN = STATIC_DOMAIN;

export default defineConfig({
  plugins: [
    tailwindcss(),
    tanstackRouter({
      routeFileIgnorePattern: ".(test|spec).(ts|tsx)$",
    }),
    react(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ["react", "react-dom"],
          router: ["@tanstack/react-router"],
          query: [
            "@tanstack/react-query",
            "@orpc/client",
            "@orpc/tanstack-query",
          ],
          ui: [
            "radix-ui",
            "lucide-react",
            "class-variance-authority",
            "clsx",
            "tailwind-merge",
          ],
          auth: ["better-auth"],
          form: ["@tanstack/react-form"],
        },
      },
    },
  },
});
