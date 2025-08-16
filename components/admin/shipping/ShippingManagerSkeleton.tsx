export function ShippingManagerSkeleton() {
  return (
    <div className="space-y-6">
      {/* Tab skeleton */}
      <div className="bg-admin-light-bg-surface dark:bg-admin-bg-surface rounded-lg shadow-admin-soft border border-admin-light-border dark:border-admin-border p-4">
        <div className="animate-pulse flex space-x-4">
          <div className="h-8 bg-admin-light-bg-hover dark:bg-admin-bg-hover rounded w-32"></div>
          <div className="h-8 bg-admin-light-bg-hover dark:bg-admin-bg-hover rounded w-32"></div>
        </div>
      </div>

      {/* Content skeleton */}
      <div className="bg-admin-light-bg-surface dark:bg-admin-bg-surface rounded-lg shadow-admin-soft border border-admin-light-border dark:border-admin-border p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-admin-light-bg-hover dark:bg-admin-bg-hover rounded w-1/4"></div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-12 bg-admin-light-bg-hover dark:bg-admin-bg-hover rounded"></div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}