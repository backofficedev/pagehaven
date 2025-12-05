import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { ArrowLeft, Eye, FileText, HardDrive } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { authClient } from "@/lib/auth-client";
import { formatBytes } from "@/lib/utils";
import { orpc } from "@/utils/orpc";

export const Route = createFileRoute("/sites/$siteId/analytics")({
  component: AnalyticsPage,
  beforeLoad: async () => {
    const session = await authClient.getSession();
    if (!session.data) {
      redirect({
        to: "/login",
        throw: true,
      });
    }
    return { session };
  },
});

function AnalyticsPage() {
  const { siteId } = Route.useParams();

  const siteQuery = useQuery(orpc.site.get.queryOptions({ input: { siteId } }));
  const analyticsQuery = useQuery(
    orpc.analytics.getSummary.queryOptions({ input: { siteId, days: 30 } })
  );

  const site = siteQuery.data;
  const analytics = analyticsQuery.data;

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      <div className="mb-6">
        <Link
          className="mb-4 inline-flex items-center gap-1 text-muted-foreground text-sm hover:text-foreground"
          params={{ siteId }}
          to="/sites/$siteId"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to {site?.name ?? "Site"}
        </Link>
      </div>

      <div className="mb-8">
        <h1 className="font-bold text-3xl">Analytics</h1>
        <p className="text-muted-foreground">Last 30 days of site activity</p>
      </div>

      {analyticsQuery.isLoading ? (
        <div className="text-center text-muted-foreground">
          Loading analytics...
        </div>
      ) : null}

      {analytics ? (
        <>
          <div className="mb-8 grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="font-medium text-sm">
                  Total Views
                </CardTitle>
                <Eye className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="font-bold text-2xl">
                  {analytics.summary.totalViews.toLocaleString()}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="font-medium text-sm">Bandwidth</CardTitle>
                <HardDrive className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="font-bold text-2xl">
                  {formatBytes(analytics.summary.totalBandwidth)}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="font-medium text-sm">
                  Unique Pages
                </CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="font-bold text-2xl">
                  {analytics.summary.uniquePaths}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Top Pages</CardTitle>
              <CardDescription>
                Most viewed pages in the last 30 days
              </CardDescription>
            </CardHeader>
            <CardContent>
              {analytics.topPages.length === 0 ? (
                <p className="py-8 text-center text-muted-foreground">
                  No page views recorded yet
                </p>
              ) : (
                <div className="space-y-3">
                  {analytics.topPages.map((page, index) => (
                    <div
                      className="flex items-center justify-between rounded border p-3"
                      key={page.path}
                    >
                      <div className="flex items-center gap-3">
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-muted font-medium text-xs">
                          {index + 1}
                        </span>
                        <span className="font-mono text-sm">{page.path}</span>
                      </div>
                      <span className="text-muted-foreground text-sm">
                        {page.views.toLocaleString()} views
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Daily Views</CardTitle>
              <CardDescription>
                Page views over the last 30 days
              </CardDescription>
            </CardHeader>
            <CardContent>
              {analytics.daily.length === 0 ? (
                <p className="py-8 text-center text-muted-foreground">
                  No data available
                </p>
              ) : (
                <div className="space-y-2">
                  {analytics.daily.slice(-14).map((day) => (
                    <div
                      className="flex items-center justify-between text-sm"
                      key={day.date}
                    >
                      <span className="text-muted-foreground">{day.date}</span>
                      <div className="flex items-center gap-4">
                        <span>{day.views.toLocaleString()} views</span>
                        <span className="text-muted-foreground">
                          {formatBytes(day.bandwidth)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      ) : null}
    </div>
  );
}
