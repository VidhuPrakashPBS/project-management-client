import { Clock } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import type { ClockStatusBannerProps } from '@/types/attendance';

export function ClockStatusBanner({
  clockInTime,
  onSite,
  formatTime,
}: ClockStatusBannerProps) {
  return (
    <Alert className="border-green-200 bg-green-50 dark:border-green-900/50 dark:bg-green-950/20">
      <Clock className="h-4 w-4 text-green-600 dark:text-green-400" />
      <AlertDescription className="text-green-800 dark:text-green-200">
        <div className="flex flex-col gap-1">
          <span className="font-medium">
            You clocked in at {formatTime(clockInTime)}
          </span>
          <span className="text-xs">
            Location: {onSite ? 'On-Site' : 'Remote'}
          </span>
        </div>
      </AlertDescription>
    </Alert>
  );
}
