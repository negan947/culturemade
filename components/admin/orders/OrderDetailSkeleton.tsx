export function OrderDetailSkeleton() {
  return (
    <div className="space-y-6">
      {/* Order Header Skeleton */}
      <div className="bg-admin-light-bg-surface dark:bg-admin-bg-surface rounded-lg shadow-admin-soft border border-admin-light-border dark:border-admin-border p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex-1">
            <div className="h-6 bg-admin-light-bg-hover dark:bg-admin-bg-hover rounded animate-pulse w-48 mb-3"></div>
            <div className="flex gap-4">
              <div className="h-4 bg-admin-light-bg-hover dark:bg-admin-bg-hover rounded animate-pulse w-32"></div>
              <div className="h-4 bg-admin-light-bg-hover dark:bg-admin-bg-hover rounded animate-pulse w-20"></div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="h-4 w-4 bg-admin-light-bg-hover dark:bg-admin-bg-hover rounded animate-pulse"></div>
            <div className="h-8 bg-admin-light-bg-hover dark:bg-admin-bg-hover rounded-full animate-pulse w-24"></div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Customer Information Skeleton */}
        <div className="bg-admin-light-bg-surface dark:bg-admin-bg-surface rounded-lg shadow-admin-soft border border-admin-light-border dark:border-admin-border p-6">
          <div className="h-6 bg-admin-light-bg-hover dark:bg-admin-bg-hover rounded animate-pulse w-40 mb-4"></div>
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 bg-admin-light-bg-hover dark:bg-admin-bg-hover rounded animate-pulse"></div>
              <div className="h-4 bg-admin-light-bg-hover dark:bg-admin-bg-hover rounded animate-pulse w-32"></div>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 bg-admin-light-bg-hover dark:bg-admin-bg-hover rounded animate-pulse"></div>
              <div className="h-4 bg-admin-light-bg-hover dark:bg-admin-bg-hover rounded animate-pulse w-48"></div>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 bg-admin-light-bg-hover dark:bg-admin-bg-hover rounded animate-pulse"></div>
              <div className="h-4 bg-admin-light-bg-hover dark:bg-admin-bg-hover rounded animate-pulse w-28"></div>
            </div>
          </div>
        </div>

        {/* Status Management Skeleton */}
        <div className="bg-admin-light-bg-surface dark:bg-admin-bg-surface rounded-lg shadow-admin-soft border border-admin-light-border dark:border-admin-border p-6">
          <div className="h-6 bg-admin-light-bg-hover dark:bg-admin-bg-hover rounded animate-pulse w-36 mb-4"></div>
          <div className="space-y-4">
            <div>
              <div className="h-4 bg-admin-light-bg-hover dark:bg-admin-bg-hover rounded animate-pulse w-24 mb-2"></div>
              <div className="h-10 bg-admin-light-bg-hover dark:bg-admin-bg-hover rounded animate-pulse"></div>
            </div>
            <div>
              <div className="h-4 bg-admin-light-bg-hover dark:bg-admin-bg-hover rounded animate-pulse w-32 mb-2"></div>
              <div className="h-10 bg-admin-light-bg-hover dark:bg-admin-bg-hover rounded animate-pulse"></div>
            </div>
            <div className="h-10 bg-admin-light-bg-hover dark:bg-admin-bg-hover rounded animate-pulse"></div>
          </div>
        </div>
      </div>

      {/* Addresses Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-admin-light-bg-surface dark:bg-admin-bg-surface rounded-lg shadow-admin-soft border border-admin-light-border dark:border-admin-border p-6">
          <div className="h-6 bg-admin-light-bg-hover dark:bg-admin-bg-hover rounded animate-pulse w-32 mb-4"></div>
          <div className="space-y-2">
            <div className="h-4 bg-admin-light-bg-hover dark:bg-admin-bg-hover rounded animate-pulse w-40"></div>
            <div className="h-4 bg-admin-light-bg-hover dark:bg-admin-bg-hover rounded animate-pulse w-48"></div>
            <div className="h-4 bg-admin-light-bg-hover dark:bg-admin-bg-hover rounded animate-pulse w-44"></div>
            <div className="h-4 bg-admin-light-bg-hover dark:bg-admin-bg-hover rounded animate-pulse w-36"></div>
          </div>
        </div>

        <div className="bg-admin-light-bg-surface dark:bg-admin-bg-surface rounded-lg shadow-admin-soft border border-admin-light-border dark:border-admin-border p-6">
          <div className="h-6 bg-admin-light-bg-hover dark:bg-admin-bg-hover rounded animate-pulse w-36 mb-4"></div>
          <div className="space-y-2">
            <div className="h-4 bg-admin-light-bg-hover dark:bg-admin-bg-hover rounded animate-pulse w-40"></div>
            <div className="h-4 bg-admin-light-bg-hover dark:bg-admin-bg-hover rounded animate-pulse w-48"></div>
            <div className="h-4 bg-admin-light-bg-hover dark:bg-admin-bg-hover rounded animate-pulse w-44"></div>
            <div className="h-4 bg-admin-light-bg-hover dark:bg-admin-bg-hover rounded animate-pulse w-36"></div>
          </div>
        </div>
      </div>

      {/* Order Items Skeleton */}
      <div className="bg-admin-light-bg-surface dark:bg-admin-bg-surface rounded-lg shadow-admin-soft border border-admin-light-border dark:border-admin-border overflow-hidden">
        <div className="p-6 border-b border-admin-light-border dark:border-admin-border">
          <div className="h-6 bg-admin-light-bg-hover dark:bg-admin-bg-hover rounded animate-pulse w-32"></div>
        </div>

        <div className="divide-y divide-admin-light-border dark:divide-admin-border">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="h-5 bg-admin-light-bg-hover dark:bg-admin-bg-hover rounded animate-pulse w-48 mb-2"></div>
                  <div className="h-4 bg-admin-light-bg-hover dark:bg-admin-bg-hover rounded animate-pulse w-32 mb-1"></div>
                  <div className="flex gap-4">
                    <div className="h-3 bg-admin-light-bg-hover dark:bg-admin-bg-hover rounded animate-pulse w-16"></div>
                    <div className="h-3 bg-admin-light-bg-hover dark:bg-admin-bg-hover rounded animate-pulse w-20"></div>
                    <div className="h-3 bg-admin-light-bg-hover dark:bg-admin-bg-hover rounded animate-pulse w-24"></div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="h-4 bg-admin-light-bg-hover dark:bg-admin-bg-hover rounded animate-pulse w-20 mb-1"></div>
                  <div className="h-5 bg-admin-light-bg-hover dark:bg-admin-bg-hover rounded animate-pulse w-16"></div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Order Summary Skeleton */}
        <div className="bg-admin-light-bg-hover dark:bg-admin-bg-hover p-6">
          <div className="space-y-2">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex justify-between">
                <div className="h-4 bg-admin-light-bg-main dark:bg-admin-bg-main rounded animate-pulse w-20"></div>
                <div className="h-4 bg-admin-light-bg-main dark:bg-admin-bg-main rounded animate-pulse w-16"></div>
              </div>
            ))}
            <div className="flex justify-between pt-2 border-t border-admin-light-border dark:border-admin-border">
              <div className="h-5 bg-admin-light-bg-main dark:bg-admin-bg-main rounded animate-pulse w-12"></div>
              <div className="h-5 bg-admin-light-bg-main dark:bg-admin-bg-main rounded animate-pulse w-20"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Order Notes Skeleton */}
      <div className="bg-admin-light-bg-surface dark:bg-admin-bg-surface rounded-lg shadow-admin-soft border border-admin-light-border dark:border-admin-border p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="h-6 bg-admin-light-bg-hover dark:bg-admin-bg-hover rounded animate-pulse w-28"></div>
          <div className="h-8 bg-admin-light-bg-hover dark:bg-admin-bg-hover rounded animate-pulse w-16"></div>
        </div>
        <div className="space-y-2">
          <div className="h-4 bg-admin-light-bg-hover dark:bg-admin-bg-hover rounded animate-pulse w-full"></div>
          <div className="h-4 bg-admin-light-bg-hover dark:bg-admin-bg-hover rounded animate-pulse w-3/4"></div>
          <div className="h-4 bg-admin-light-bg-hover dark:bg-admin-bg-hover rounded animate-pulse w-1/2"></div>
        </div>
      </div>
    </div>
  );
}