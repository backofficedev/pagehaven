import type { RouterClient } from "@orpc/server";
import { protectedProcedure, publicProcedure } from "../index";
import { accessRouter } from "./access";
import { analyticsRouter } from "./analytics";
import { apiKeyRouter } from "./api-key";
import { deploymentRouter } from "./deployment";
import { domainRouter } from "./domain";
import { siteRouter } from "./site";
import { uploadRouter } from "./upload";

export const appRouter = {
  healthCheck: publicProcedure.handler(() => "OK"),
  privateData: protectedProcedure.handler(({ context }) => ({
    message: "This is private",
    user: context.session?.user,
  })),
  site: siteRouter,
  deployment: deploymentRouter,
  access: accessRouter,
  upload: uploadRouter,
  analytics: analyticsRouter,
  domain: domainRouter,
  apiKey: apiKeyRouter,
};
export type AppRouter = typeof appRouter;
export type AppRouterClient = RouterClient<typeof appRouter>;
