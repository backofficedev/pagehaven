import { env } from "cloudflare:workers";
import { OpenAPIHandler } from "@orpc/openapi/fetch";
import { OpenAPIReferencePlugin } from "@orpc/openapi/plugins";
import { onError } from "@orpc/server";
import { RPCHandler } from "@orpc/server/fetch";
import { ZodToJsonSchemaConverter } from "@orpc/zod/zod4";
import { createContext } from "@pagehaven/api/context";
import { initCache } from "@pagehaven/api/lib/cache";
import { processGitHubPush } from "@pagehaven/api/lib/github-webhook";
import { appRouter } from "@pagehaven/api/routers/index";
import { auth } from "@pagehaven/auth";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";

// Initialize cache with KV binding if available
if (env.CACHE) {
  initCache(env.CACHE);
}

const app = new Hono();

app.use(logger());
app.use(
  "/*",
  cors({
    origin: env.CORS_ORIGIN || "",
    allowMethods: ["GET", "POST", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

app.on(["POST", "GET"], "/api/auth/*", (c) => auth.handler(c.req.raw));

// GitHub webhook endpoint
app.post("/api/webhooks/github", async (c) => {
  const signature = c.req.header("X-Hub-Signature-256");
  const event = c.req.header("X-GitHub-Event");

  if (!signature || event !== "push") {
    return c.json({ error: "Invalid webhook" }, 400);
  }

  const payload = await c.req.text();

  // We need to verify against each site's webhook secret
  // For now, we'll process the event and let it fail if the repo isn't configured
  try {
    const body = JSON.parse(payload);
    const result = await processGitHubPush(body);

    if (result.success) {
      return c.json({
        success: true,
        deploymentId: result.deploymentId,
      });
    }

    return c.json({ error: result.error }, 400);
  } catch (error) {
    console.error("GitHub webhook error:", error);
    return c.json(
      { error: error instanceof Error ? error.message : "Webhook failed" },
      500
    );
  }
});

export const apiHandler = new OpenAPIHandler(appRouter, {
  plugins: [
    new OpenAPIReferencePlugin({
      schemaConverters: [new ZodToJsonSchemaConverter()],
    }),
  ],
  interceptors: [
    onError((error) => {
      console.error(error);
    }),
  ],
});

export const rpcHandler = new RPCHandler(appRouter, {
  interceptors: [
    onError((error) => {
      console.error(error);
    }),
  ],
});

app.use("/*", async (c, next) => {
  const context = await createContext({ context: c });

  const rpcResult = await rpcHandler.handle(c.req.raw, {
    prefix: "/rpc",
    context,
  });

  if (rpcResult.matched) {
    return c.newResponse(rpcResult.response.body, rpcResult.response);
  }

  const apiResult = await apiHandler.handle(c.req.raw, {
    prefix: "/api-reference",
    context,
  });

  if (apiResult.matched) {
    return c.newResponse(apiResult.response.body, apiResult.response);
  }

  return next();
});

app.get("/", (c) => c.text("OK"));

export default app;
