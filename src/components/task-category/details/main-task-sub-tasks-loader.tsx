import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export const MainTaskSubTaskLoadingSkeleton = () => (
  <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
    <CardHeader>
      <CardTitle>Tasks</CardTitle>
      <CardDescription>Loading sub-tasks...</CardDescription>
    </CardHeader>
    <CardContent>
      <div className="space-y-2">
        {Array.from({ length: 3 })?.map((_) => (
          <div className="rounded-md border p-3" key={Math.random()}>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-12">
              <div className="sm:col-span-8">
                <Skeleton className="mb-2 h-5 w-48" />
                <Skeleton className="mb-1 h-4 w-64" />
                <Skeleton className="h-3 w-24" />
              </div>
              <div className="sm:col-span-4">
                <div className="flex items-center justify-end gap-2">
                  <Skeleton className="h-6 w-20" />
                  <Skeleton className="h-8 w-8" />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </CardContent>
  </Card>
);
