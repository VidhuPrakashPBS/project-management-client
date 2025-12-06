import { cn } from '@/lib/utils';
import type { MainTask } from '@/types/project';

export default function TaskNode({
  task,
  index,
  lastActiveIndex,
  showLabels,
}: {
  task: MainTask;
  index: number;
  lastActiveIndex: number;
  showLabels: 'all' | 'hover' | 'none';
}) {
  const isCompleted = task.status === 'completed';
  const isInProgress = task.status === 'in_progress';
  const isPending = !(isCompleted || isInProgress);

  let connectorBeforeColor = 'bg-transparent';

  function labelForStatus(s: MainTask['status']) {
    if (s === 'completed') {
      return 'Completed task';
    }
    if (s === 'in_progress') {
      return 'Task in progress';
    }
    return 'Pending task';
  }

  function titleSuffixForStatus(s: MainTask['status']) {
    if (s === 'completed') {
      return '(completed)';
    }
    if (s === 'in_progress') {
      return '(in-progress)';
    }
    return '';
  }

  if (index > 0) {
    if (index - 1 <= lastActiveIndex) {
      connectorBeforeColor = 'bg-green-600';
    } else {
      connectorBeforeColor = 'bg-gray-300 dark:bg-gray-700';
    }
  }

  const nodeAriaLabel = labelForStatus(task.status);
  const nodeTitleExtra = titleSuffixForStatus(task.status);

  return (
    <li
      aria-label={`${task.title}${task.status ? ` - ${task.status}` : ''}`}
      className={cn('relative flex snap-start flex-col items-center')}
    >
      {index > 0 && (
        <div
          aria-hidden="true"
          className={cn(
            'absolute top-3 left-[-3rem] h-0.5 w-12 rounded-full',
            connectorBeforeColor
          )}
        />
      )}

      {/* Node */}
      <div className="relative flex items-center justify-center">
        <span
          aria-label={nodeAriaLabel}
          className={cn(
            'relative inline-flex h-6 w-6 items-center justify-center rounded-full border',
            isCompleted && 'border-green-600 bg-green-600',
            isInProgress &&
              'border-blue-500 bg-blue-500 ring-4 ring-blue-500/20',
            isPending && 'border-gray-400 bg-background',
            'outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2'
          )}
          role="img"
          title={`${task.title} ${nodeTitleExtra}`}
        >
          {isInProgress && (
            <span className="absolute inline-flex h-6 w-6 animate-ping rounded-full bg-amber-500/40" />
          )}
          {isPending && (
            <span className="inline-block h-2.5 w-2.5 rounded-full bg-gray-400" />
          )}
        </span>
      </div>

      {/* Label */}
      {showLabels !== 'none' && (
        <div
          className={cn(
            'mt-2 max-w-[8rem] text-center text-muted-foreground text-xs leading-5',
            showLabels === 'hover' &&
              'opacity-80 transition-opacity hover:opacity-100 md:opacity-100'
          )}
        >
          <div className="text-balance">{task.title}</div>
          <div className="sr-only">
            {task.status ? `Status: ${task.status}` : 'Status: pending'}
          </div>
        </div>
      )}
    </li>
  );
}
