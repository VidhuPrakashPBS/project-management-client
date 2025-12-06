import type { TimeDisplayProps } from '@/types/attendance';

export function TimeDisplay({ currentTime, currentDate }: TimeDisplayProps) {
  return (
    <div className="rounded-lg border bg-gradient-to-br from-blue-50 to-indigo-50 p-6 text-center dark:from-blue-950/20 dark:to-indigo-950/20">
      <div className="mb-2 font-bold font-mono text-4xl text-blue-600 tracking-tight md:text-5xl dark:text-blue-400">
        {currentTime}
      </div>
      <div className="text-muted-foreground text-sm">{currentDate}</div>
    </div>
  );
}
