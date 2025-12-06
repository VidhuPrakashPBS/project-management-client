import { Skeleton } from '../ui/skeleton';

function TableSectionFallback() {
  return (
    <>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex w-full items-stretch gap-2 sm:max-w-md">
          <Skeleton className="h-10 flex-1" />
          <Skeleton className="h-10 w-20" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-10" />
          <Skeleton className="h-10 w-20" />
        </div>
      </div>
      <div className="rounded-md border p-8">
        <Skeleton className="h-64 w-full" />
      </div>
    </>
  );
}
export default TableSectionFallback;
