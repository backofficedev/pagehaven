import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * Loading skeleton for a card with title and content
 */
export function CardSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-1/3" />
        <Skeleton className="h-4 w-2/3" />
      </CardHeader>
      <CardContent className="space-y-3">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-4/5" />
        <Skeleton className="h-4 w-3/5" />
      </CardContent>
    </Card>
  );
}

/**
 * Loading skeleton for a form with multiple fields
 */
export function FormSkeleton({ fields = 3 }: { fields?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: fields }).map((_, i) => (
        <div className="space-y-2" key={`field-${i + 1}`}>
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-10 w-full" />
        </div>
      ))}
      <Skeleton className="h-10 w-32" />
    </div>
  );
}

/**
 * Loading skeleton for a table with rows
 */
export function TableSkeleton({
  rows = 5,
  columns = 4,
}: {
  rows?: number;
  columns?: number;
}) {
  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex gap-4">
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton className="h-4 flex-1" key={`header-${i + 1}`} />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_row, rowIdx) => (
        <div className="flex gap-4" key={`row-${rowIdx + 1}`}>
          {Array.from({ length: columns }).map((_col, colIdx) => (
            <Skeleton
              className="h-8 flex-1"
              key={`cell-${rowIdx + 1}-${colIdx + 1}`}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

/**
 * Loading skeleton for a list of items
 */
export function ListSkeleton({ items = 3 }: { items?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: items }).map((_, i) => (
        <div
          className="flex items-center gap-3 rounded-lg border p-4"
          key={`item-${i + 1}`}
        >
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-3 w-2/3" />
          </div>
          <Skeleton className="h-8 w-20" />
        </div>
      ))}
    </div>
  );
}

/**
 * Loading skeleton for a page header
 */
export function PageHeaderSkeleton() {
  return (
    <div className="mb-6 space-y-2">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-4 w-72" />
    </div>
  );
}

/**
 * Loading skeleton for stats/metrics cards
 */
export function StatsSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <Card key={`stat-${i + 1}`}>
          <CardHeader className="pb-2">
            <Skeleton className="h-4 w-24" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-8 w-16" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

/**
 * Full page loading skeleton combining header and content
 */
export function PageSkeleton() {
  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      <PageHeaderSkeleton />
      <CardSkeleton />
    </div>
  );
}
