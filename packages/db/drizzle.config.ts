import { loadEnv } from "@pagehaven/config/env";
import { defineConfig } from "drizzle-kit";

loadEnv({ envDir: "../../apps/server" });

export default defineConfig({
  schema: "./src/schema",
  out: "./src/migrations",
  // DOCS: https://orm.drizzle.team/docs/guides/d1-http-with-drizzle-kit
  dialect: "sqlite",
  driver: "d1-http",
});
