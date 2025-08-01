export function OrderListSkeleton() {
  return (
    <div className="space-y-6">
      {/* Filters Skeleton */}
      <div className="bg-admin-light-bg-surface dark:bg-admin-bg-surface rounded-lg shadow-admin-soft border border-admin-light-border dark:border-admin-border p-4">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <div className="h-10 bg-admin-light-bg-hover dark:bg-admin-bg-hover rounded-lg animate-pulse"></div>
          </div>
          <div className="w-32">
            <div className="h-10 bg-admin-light-bg-hover dark:bg-admin-bg-hover rounded-lg animate-pulse"></div>
          </div>
          <div className="w-32">
            <div className="h-10 bg-admin-light-bg-hover dark:bg-admin-bg-hover rounded-lg animate-pulse"></div>
          </div>
        </div>
      </div>

      {/* Table Skeleton */}
      <div className="bg-admin-light-bg-surface dark:bg-admin-bg-surface rounded-lg shadow-admin-soft border border-admin-light-border dark:border-admin-border overflow-hidden">
        {/* Desktop Table Skeleton */}
        <div className="hidden lg:block">
          <div className="bg-admin-light-bg-hover dark:bg-admin-bg-hover p-6">
            <div className="grid grid-cols-6 gap-4">
              <div className="h-4 bg-admin-light-bg-main dark:bg-admin-bg-main rounded animate-pulse"></div>
              <div className="h-4 bg-admin-light-bg-main dark:bg-admin-bg-main rounded animate-pulse"></div>
              <div className="h-4 bg-admin-light-bg-main dark:bg-admin-bg-main rounded animate-pulse"></div>
              <div className="h-4 bg-admin-light-bg-main dark:bg-admin-bg-main rounded animate-pulse"></div>
              <div className="h-4 bg-admin-light-bg-main dark:bg-admin-bg-main rounded animate-pulse"></div>
              <div className="h-4 bg-admin-light-bg-main dark:bg-admin-bg-main rounded animate-pulse"></div>
            </div>
          </div>
          <div className="divide-y divide-admin-light-border dark:divide-admin-border">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="p-6">
                <div className="grid grid-cols-6 gap-4 items-center">
                  <div className="space-y-2">
                    <div className="h-4 bg-admin-light-bg-hover dark:bg-admin-bg-hover rounded animate-pulse"></div>
                    <div className="h-3 bg-admin-light-bg-hover dark:bg-admin-bg-hover rounded animate-pulse w-20"></div>
                  </div>
                  <div className="space-y-2">
                    <div className="h-4 bg-admin-light-bg-hover dark:bg-admin-bg-hover rounded animate-pulse"></div>
                    <div className="h-3 bg-admin-light-bg-hover dark:bg-admin-bg-hover rounded animate-pulse w-32"></div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 bg-admin-light-bg-hover dark:bg-admin-bg-hover rounded animate-pulse"></div>
                    <div className="h-6 bg-admin-light-bg-hover dark:bg-admin-bg-hover rounded-full animate-pulse w-20"></div>
                  </div>
                  <div className="h-4 bg-admin-light-bg-hover dark:bg-admin-bg-hover rounded animate-pulse w-16"></div>
                  <div className="h-4 bg-admin-light-bg-hover dark:bg-admin-bg-hover rounded animate-pulse w-24"></div>
                  <div className="flex justify-end">
                    <div className="h-4 bg-admin-light-bg-hover dark:bg-admin-bg-hover rounded animate-pulse w-12"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Mobile Cards Skeleton */}
        <div className="lg:hidden divide-y divide-admin-light-border dark:divide-admin-border">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="space-y-2">
                  <div className="h-4 bg-admin-light-bg-hover dark:bg-admin-bg-hover rounded animate-pulse w-24"></div>
                  <div className="h-3 bg-admin-light-bg-hover dark:bg-admin-bg-hover rounded animate-pulse w-20"></div>
                </div>
                <div className="h-4 bg-admin-light-bg-hover dark:bg-admin-bg-hover rounded animate-pulse w-16"></div>
              </div>
              
              <div className="flex items-center justify-between mb-3">
                <div className="space-y-2">
                  <div className="h-4 bg-admin-light-bg-hover dark:bg-admin-bg-hover rounded animate-pulse w-32"></div>
                  <div className="h-3 bg-admin-light-bg-hover dark:bg-admin-bg-hover rounded animate-pulse w-40"></div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 bg-admin-light-bg-hover dark:bg-admin-bg-hover rounded animate-pulse"></div>
                  <div className="h-6 bg-admin-light-bg-hover dark:bg-admin-bg-hover rounded-full animate-pulse w-20"></div>
                </div>
              </div>

              <div className="flex justify-end">
                <div className="h-4 bg-admin-light-bg-hover dark:bg-admin-bg-hover rounded animate-pulse w-20"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}