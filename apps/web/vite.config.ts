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
const SERVER_DOMAIN = process.env.SERVER_DOMAIN || "";
const STATIC_DOMAIN = process.env.STATIC_DOMAIN || "";

const VITE_SERVER_URL = buildUrl(stage, SERVER_DOMAIN);
const VITE_STATIC_DOMAIN = getDomainByEnvironment(stage, STATIC_DOMAIN);

export default defineConfig({
  define: {
    "import.meta.env.VITE_SERVER_URL": JSON.stringify(VITE_SERVER_URL),
    "import.meta.env.VITE_STATIC_DOMAIN": JSON.stringify(VITE_STATIC_DOMAIN),
  },
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
