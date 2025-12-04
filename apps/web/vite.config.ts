import path from "node:path";
import tailwindcss from "@tailwindcss/vite";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [tailwindcss(), tanstackRouter({}), react()],
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
