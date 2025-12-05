import { db } from "@pagehaven/db";
import { siteAnalytics } from "@pagehaven/db/schema/analytics";
import { and, desc, eq, gte, sql } from "drizzle-orm";
import { z } from "zod";
import { protectedProcedure, publicProcedure } from "../index";
import { requireSitePermission } from "../lib/check-site-permission";

function generateId(): string {
  return crypto.randomUUID();
}

function getDateString(date: Date = new Date()): string {
  return date.toISOString().split("T")[0] ?? "";
}

export const analyticsRouter = {
  // Record a page view (called from static server)
  recordView: publicProcedure
    .input(
      z.object({
        siteId: z.string(),
        path: z.string(),
        bytes: z.number().optional(),
        visitorId: z.string().optional(),
      })
    )
    .handler(async ({ input }) => {
      const date = getDateString();

      // Try to update existing record
      const existing = await db
        .select({ id: siteAnalytics.id, views: siteAnalytics.views })
        .from(siteAnalytics)
        .where(
          and(
            eq(siteAnalytics.siteId, input.siteId),
            eq(siteAnalytics.date, date),
            eq(siteAnalytics.path, input.path)
          )
        )
        .get();

      if (existing) {
        await db
          .update(siteAnalytics)
          .set({
            views: existing.views + 1,
            bandwidth: sql`${siteAnalytics.bandwidth} + ${input.bytes ?? 0}`,
          })
          .where(eq(siteAnalytics.id, existing.id));
      } else {
        await db.insert(siteAnalytics).values({
          id: generateId(),
          siteId: input.siteId,
          date,
          path: input.path,
          views: 1,
          uniqueVisitors: 1,
          bandwidth: input.bytes ?? 0,
        });
      }

      return { success: true };
    }),

  // Get analytics summary for a site
  getSummary: protectedProcedure
    .input(
      z.object({
        siteId: z.string(),
        days: z.number().min(1).max(90).default(30),
      })
    )
    .handler(async ({ input, context }) => {
      const userId = context.session.user.id;

      // Check membership (viewer+ can view analytics)
      await requireSitePermission(
        input.siteId,
        userId,
        "viewer",
        "Access denied"
      );

      const startDate = new Date();
      startDate.setDate(startDate.getDate() - input.days);
      const startDateStr = getDateString(startDate);

      // Get aggregated stats
      const stats = await db
        .select({
          totalViews: sql<number>`sum(${siteAnalytics.views})`,
          totalBandwidth: sql<number>`sum(${siteAnalytics.bandwidth})`,
          uniquePaths: sql<number>`count(distinct ${siteAnalytics.path})`,
        })
        .from(siteAnalytics)
        .where(
          and(
            eq(siteAnalytics.siteId, input.siteId),
            gte(siteAnalytics.date, startDateStr)
          )
        )
        .get();

      // Get daily breakdown
      const daily = await db
        .select({
          date: siteAnalytics.date,
          views: sql<number>`sum(${siteAnalytics.views})`,
          bandwidth: sql<number>`sum(${siteAnalytics.bandwidth})`,
        })
        .from(siteAnalytics)
        .where(
          and(
            eq(siteAnalytics.siteId, input.siteId),
            gte(siteAnalytics.date, startDateStr)
          )
        )
        .groupBy(siteAnalytics.date)
        .orderBy(siteAnalytics.date);

      // Get top pages
      const topPages = await db
        .select({
          path: siteAnalytics.path,
          views: sql<number>`sum(${siteAnalytics.views})`,
        })
        .from(siteAnalytics)
        .where(
          and(
            eq(siteAnalytics.siteId, input.siteId),
            gte(siteAnalytics.date, startDateStr)
          )
        )
        .groupBy(siteAnalytics.path)
        .orderBy(desc(sql`sum(${siteAnalytics.views})`))
        .limit(10);

      return {
        summary: {
          totalViews: stats?.totalViews ?? 0,
          totalBandwidth: stats?.totalBandwidth ?? 0,
          uniquePaths: stats?.uniquePaths ?? 0,
        },
        daily,
        topPages,
      };
    }),
};
