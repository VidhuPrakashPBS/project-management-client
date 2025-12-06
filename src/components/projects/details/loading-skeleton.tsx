import { Skeleton } from '@/components/ui/skeleton';

export const LoadingSkeleton = () => (
  <div className="space-y-6 bg-background text-foreground">
    {/* Header skeleton */}
    <div className="mb-6 flex items-center justify-between">
      <Skeleton className="h-10 w-32" />
      <div className="flex items-center gap-2">
        <Skeleton className="h-9 w-20" />
        <Skeleton className="h-9 w-20" />
        <Skeleton className="h-9 w-48" />
      </div>
    </div>

    {/* Overview skeleton */}
    <div className="rounded-lg border p-6">
      <Skeleton className="mb-4 h-6 w-40" />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="space-y-2">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-6 w-32" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-6 w-24" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-6 w-28" />
        </div>
      </div>
      <div className="mt-4 space-y-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-16 w-full" />
      </div>
    </div>

    {/* Main content skeleton */}
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      {/* Main tasks skeleton */}
      <div className="lg:col-span-2">
        <div className="rounded-lg border p-6">
          <div className="mb-4 flex items-center justify-between">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-9 w-20" />
          </div>
          <Skeleton className="mb-4 h-4 w-64" />
          <div className="space-y-3">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        </div>
      </div>

      {/* Sidebar skeleton */}
      <div className="space-y-6 lg:col-span-1">
        {/* Activity skeleton */}
        <div className="rounded-lg border p-6">
          <div className="mb-4 flex items-center justify-between">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-8 w-16" />
          </div>
          <Skeleton className="mb-4 h-4 w-48" />
          <div className="space-y-3">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        </div>

        {/* Assign skeleton */}
        <div className="rounded-lg border p-6">
          <Skeleton className="mb-4 h-6 w-36" />
          <div className="space-y-3">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        </div>
      </div>
    </div>
  </div>
);
