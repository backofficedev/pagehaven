import path from "node:path";
import {
  buildUrl,
  getDomainByEnvironment,
  getUsername,
} from "@pagehaven/infra/helpers";
import tailwindcss from "@tailwindcss/vite";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import react from "@vitejs/plugin-react";
import { config } from "dotenv";
import { defineConfig } from "vite";

config({ path: path.join(import.meta.dirname, "../../.env") });

const stage = process.env.STAGE || getUsername();
const SERVER_DOMAIN = getDomainByEnvironment(
  stage,
  process.env.SERVER_DOMAIN || ""
);
const STATIC_DOMAIN = getDomainByEnvironment(
  stage,
  process.env.STATIC_DOMAIN || ""
);

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
