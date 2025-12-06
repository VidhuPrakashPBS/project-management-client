import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';

export const LoadingSkeleton = () => (
  <div className="container p-4">
    <div className="mb-6 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
      <div className="flex items-center gap-4">
        <Skeleton className="h-10 w-10" />
        <div>
          <Skeleton className="mb-2 h-8 w-64" />
          <Skeleton className="h-4 w-96" />
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Skeleton className="h-9 w-32" />
        <Skeleton className="h-9 w-32" />
      </div>
    </div>

    <div className="mb-8 rounded-lg border p-6">
      <Skeleton className="mb-4 h-6 w-48" />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Skeleton className="h-16" />
        <Skeleton className="h-16" />
        <Skeleton className="h-16" />
      </div>
    </div>

    <div className="mb-8">
      <Skeleton className="mb-4 h-6 w-32" />
      <div className="space-y-3">
        <Skeleton className="h-12" />
        <Skeleton className="h-12" />
        <Skeleton className="h-12" />
      </div>
    </div>

    <Separator className="my-8" />

    <div>
      <Skeleton className="mb-4 h-6 w-32" />
      <div className="space-y-3">
        <Skeleton className="h-16" />
        <Skeleton className="h-16" />
      </div>
    </div>
  </div>
);
