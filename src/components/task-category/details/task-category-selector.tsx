'use client';

import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { TaskSelectorProps } from '@/types/main-task';

export function TaskSelector({
  label,
  selectedTaskIds,
  availableTasks,
  onTaskToggle,
  loading = false,
  disabled = false,
  placeholder,
}: TaskSelectorProps) {
  const getPlaceholder = () => {
    if (loading) {
      return 'Loading tasks...';
    }
    if (selectedTaskIds.length > 0) {
      return `${selectedTaskIds.length} task(s) selected`;
    }
    return placeholder || 'Select tasks...';
  };

  const handleValueChange = (taskId: string) => {
    onTaskToggle(taskId);
  };

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Select disabled={disabled || loading} onValueChange={handleValueChange}>
        <SelectTrigger>
          <SelectValue placeholder={getPlaceholder()} />
        </SelectTrigger>
        <SelectContent>
          {availableTasks.length === 0 ? (
            <div className="p-2 text-center text-muted-foreground text-sm">
              {loading ? 'Loading tasks...' : 'No tasks available'}
            </div>
          ) : (
            availableTasks?.map((task) => (
              <SelectItem
                key={task.id}
                onSelect={(e) => e.preventDefault()}
                value={task.id}
              >
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={selectedTaskIds.includes(task.id)}
                    className="pointer-events-none"
                  />
                  <div className="flex flex-col items-start">
                    <span className="font-medium">{task.title}</span>
                    <span className="text-muted-foreground text-xs">
                      ({task.taskNo})
                    </span>
                  </div>
                </div>
              </SelectItem>
            ))
          )}
        </SelectContent>
      </Select>

      {/* Show selected tasks */}
      {selectedTaskIds.length > 0 && (
        <div className="mt-2">
          <div className="text-muted-foreground text-xs">Selected tasks:</div>
          <div className="mt-1 flex flex-wrap gap-1">
            {selectedTaskIds?.map((taskId) => {
              const task = availableTasks.find((t) => t.id === taskId);
              return task ? (
                <span
                  className="inline-flex items-center rounded-md bg-muted px-2 py-1 text-xs"
                  key={taskId}
                >
                  {task.title}
                </span>
              ) : null;
            })}
          </div>
        </div>
      )}
    </div>
  );
}
