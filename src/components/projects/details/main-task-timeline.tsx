import { cn } from '@/lib/utils';
import type { MainTaskTimelineProps } from '@/types/project';
import TaskNode from './task-node';

function LegendItem({
  colorClass,
  label,
  ring = false,
  hollow = false,
}: {
  colorClass: string;
  label: string;
  ring?: boolean;
  hollow?: boolean;
}) {
  return (
    <div className="flex items-center gap-2 text-muted-foreground text-xs">
      <span
        aria-hidden="true"
        className={cn(
          'relative inline-flex h-4 w-4 items-center justify-center rounded-full border',
          hollow
            ? 'border-gray-400 bg-background'
            : `${colorClass} border-transparent`,
          ring && 'ring-4 ring-amber-500/20'
        )}
      >
        {hollow && (
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-gray-400" />
        )}
      </span>
      <span>{label}</span>
    </div>
  );
}

export function MainTaskTimeline({
  tasks,
  className,
  showLabels = 'hover',
}: MainTaskTimelineProps) {
  const lastActiveIndex = (() => {
    let idx = -1;
    for (let i = 0; i < tasks?.length; i++) {
      const s = tasks[i].status;
      if (s === 'completed' || s === 'in_progress') {
        idx = i;
      }
    }
    return idx;
  })();

  if (tasks?.length === 0) {
    return null;
  }
  return (
    <div className={cn('w-full', className)}>
      <div
        className={cn('relative w-full overflow-x-auto py-4', 'scroll-pt-6')}
      >
        <ol
          aria-label="Main tasks timeline"
          className={cn(
            'relative flex min-w-max items-start gap-12 px-4 md:px-6',
            'snap-x snap-mandatory'
          )}
        >
          {tasks?.map((task, i) => (
            <TaskNode
              index={i}
              key={task.id}
              lastActiveIndex={lastActiveIndex}
              showLabels={showLabels}
              task={task}
            />
          ))}
        </ol>
      </div>

      {/* Legend */}
      <div className="mt-2 flex flex-wrap items-center gap-4 px-4 md:px-6">
        <LegendItem colorClass="bg-green-600" label="Completed" />
        <LegendItem colorClass="bg-blue-500" label="In Progress" ring />
        <LegendItem colorClass="bg-gray-400" hollow label="Pending / On hold" />
      </div>
    </div>
  );
}
