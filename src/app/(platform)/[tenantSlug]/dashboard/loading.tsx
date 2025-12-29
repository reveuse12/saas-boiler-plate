/**
 * Dashboard Loading State
 * Skeleton UI while data is being fetched
 */
export default function DashboardLoading() {
  return (
    <div className="space-y-6">
      {/* Header skeleton */}
      <div className="space-y-2">
        <div className="h-8 w-48 bg-muted animate-pulse rounded" />
        <div className="h-4 w-64 bg-muted animate-pulse rounded" />
      </div>

      {/* Stats grid skeleton */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="rounded-lg border p-6 space-y-2">
            <div className="h-4 w-24 bg-muted animate-pulse rounded" />
            <div className="h-8 w-16 bg-muted animate-pulse rounded" />
          </div>
        ))}
      </div>

      {/* Recent activity skeleton */}
      <div className="rounded-lg border p-6 space-y-4">
        <div className="h-6 w-32 bg-muted animate-pulse rounded" />
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-center gap-4">
            <div className="h-10 w-10 bg-muted animate-pulse rounded-full" />
            <div className="space-y-2 flex-1">
              <div className="h-4 w-48 bg-muted animate-pulse rounded" />
              <div className="h-3 w-24 bg-muted animate-pulse rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
