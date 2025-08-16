export function AnalyticsLoadingSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Filter Bar Skeleton */}
      <div className="bg-admin-light-bg-surface dark:bg-admin-bg-surface rounded-lg border border-admin-light-border dark:border-admin-border p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="h-10 bg-admin-light-border dark:bg-admin-border rounded w-full sm:w-48"></div>
          <div className="h-10 bg-admin-light-border dark:bg-admin-border rounded w-full sm:w-48"></div>
          <div className="h-10 bg-admin-light-border dark:bg-admin-border rounded w-full sm:w-32"></div>
        </div>
      </div>

      {/* Summary Cards Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="bg-admin-light-bg-surface dark:bg-admin-bg-surface rounded-lg border border-admin-light-border dark:border-admin-border p-4"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="h-4 bg-admin-light-border dark:bg-admin-border rounded w-20"></div>
              <div className="h-8 w-8 bg-admin-light-border dark:bg-admin-border rounded-full"></div>
            </div>
            <div className="h-8 bg-admin-light-border dark:bg-admin-border rounded w-24 mb-1"></div>
            <div className="h-3 bg-admin-light-border dark:bg-admin-border rounded w-16"></div>
          </div>
        ))}
      </div>

      {/* Charts Section Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <div className="bg-admin-light-bg-surface dark:bg-admin-bg-surface rounded-lg border border-admin-light-border dark:border-admin-border p-6">
          <div className="h-6 bg-admin-light-border dark:bg-admin-border rounded w-32 mb-4"></div>
          <div className="h-64 bg-admin-light-border dark:bg-admin-border rounded"></div>
        </div>

        {/* Orders Chart */}
        <div className="bg-admin-light-bg-surface dark:bg-admin-bg-surface rounded-lg border border-admin-light-border dark:border-admin-border p-6">
          <div className="h-6 bg-admin-light-border dark:bg-admin-border rounded w-32 mb-4"></div>
          <div className="h-64 bg-admin-light-border dark:bg-admin-border rounded"></div>
        </div>
      </div>

      {/* Tables Section Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Products */}
        <div className="bg-admin-light-bg-surface dark:bg-admin-bg-surface rounded-lg border border-admin-light-border dark:border-admin-border p-6">
          <div className="h-6 bg-admin-light-border dark:bg-admin-border rounded w-32 mb-4"></div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 bg-admin-light-border dark:bg-admin-border rounded"></div>
                  <div className="h-4 bg-admin-light-border dark:bg-admin-border rounded w-24"></div>
                </div>
                <div className="h-4 bg-admin-light-border dark:bg-admin-border rounded w-16"></div>
              </div>
            ))}
          </div>
        </div>

        {/* Customer Analytics */}
        <div className="bg-admin-light-bg-surface dark:bg-admin-bg-surface rounded-lg border border-admin-light-border dark:border-admin-border p-6">
          <div className="h-6 bg-admin-light-border dark:bg-admin-border rounded w-32 mb-4"></div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="h-4 bg-admin-light-border dark:bg-admin-border rounded w-32"></div>
                <div className="h-4 bg-admin-light-border dark:bg-admin-border rounded w-16"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}