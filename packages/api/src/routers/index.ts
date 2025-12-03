import type { RouterClient } from "@orpc/server";
import { protectedProcedure, publicProcedure } from "../index";
import { accessRouter } from "./access";
import { analyticsRouter } from "./analytics";
import { deploymentRouter } from "./deployment";
import { domainRouter } from "./domain";
import { siteRouter } from "./site";
import { todoRouter } from "./todo";
import { uploadRouter } from "./upload";

export const appRouter = {
  healthCheck: publicProcedure.handler(() => "OK"),
  privateData: protectedProcedure.handler(({ context }) => ({
    message: "This is private",
    user: context.session?.user,
  })),
  todo: todoRouter,
  site: siteRouter,
  deployment: deploymentRouter,
  access: accessRouter,
  upload: uploadRouter,
  analytics: analyticsRouter,
  domain: domainRouter,
};
export type AppRouter = typeof appRouter;
export type AppRouterClient = RouterClient<typeof appRouter>;
