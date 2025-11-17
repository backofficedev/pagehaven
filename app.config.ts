import { defineConfig } from "@tanstack/start/config";
import { TanStackRouterVite } from "@tanstack/router-vite-plugin";

export default defineConfig({
  vite: {
    plugins: [
      TanStackRouterVite(),
    ],
  },
});
