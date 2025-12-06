import { Skeleton } from '@/components/ui/skeleton';

export const ActivitySkeleton = () => (
  <div className="space-y-4">
    <div className="flex items-center justify-between">
      <Skeleton className="h-7 w-40" />
      <Skeleton className="h-9 w-28" />
    </div>
    {Array.from({ length: 3 })?.map((_) => (
      <div className="space-y-2 rounded-md border p-3" key={Math.random()}>
        <div>
          <Skeleton className="mb-1 h-4 w-64" />
          <Skeleton className="h-3 w-32" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-6 w-20" />
          <Skeleton className="h-6 w-16" />
        </div>
      </div>
    ))}
  </div>
);
