'use client';

import { useEffect, useState, useTransition } from 'react';
import { toast } from 'sonner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import api from '@/lib/api';
import { cn } from '@/lib/utils';

const TASK_STATUSES = [
  {
    lable: 'Completed',
    value: 'completed',
  },
  {
    lable: 'In Progress',
    value: 'in_progress',
  },
  {
    lable: 'On Hold',
    value: 'on_hold',
  },
  {
    lable: 'Cancelled',
    value: 'cancelled',
  },
  {
    lable: 'Due',
    value: 'due',
  },
];

export const statusClassMap: Record<string, string> = {
  completed: 'bg-green-500/10 text-green-700 border-green-400/40',
  'in progress': 'bg-blue-500/10 text-blue-700 border-blue-400/40',
  'on hold': 'bg-yellow-500/10 text-yellow-700 border-yellow-400/40',
  cancelled: 'bg-red-500/10 text-red-700 border-red-400/40',
  due: 'bg-amber-500/10 text-amber-700 border-amber-400/40',
};

interface TaskStatusControlProps {
  taskId: string;
  value: string;
  onStatusUpdate?: (newStatus: string) => void;
}

export default function TaskStatusControl({
  taskId,
  value,
  onStatusUpdate,
}: TaskStatusControlProps) {
  const [current, setCurrent] = useState<string>(value);
  const [isPending, startTransition] = useTransition();

  // Synchronize internal state with prop value
  useEffect(() => {
    setCurrent(value);
  }, [value]);

  const handleStatusChange = (newStatus: string) => {
    setCurrent(newStatus);

    startTransition(async () => {
      try {
        const formData = new FormData();
        formData.append('id', taskId);
        formData.append('status', newStatus);

        const response = await api.put('/api/tasks', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });

        if (!response.data.success) {
          throw new Error(response.data.message || 'Failed to update status');
        }

        if (onStatusUpdate) {
          onStatusUpdate(newStatus);
        }

        toast.success('Task status updated successfully');
      } catch (err) {
        toast.error(`Failed to update status. ${err}`);
        setCurrent(value);
      }
    });
  };

  return (
    <div className="space-y-1">
      <Select
        disabled={isPending}
        onValueChange={handleStatusChange}
        value={current}
      >
        <SelectTrigger
          className={cn(
            'h-8 w-auto rounded-full border px-3 font-medium text-xs',
            statusClassMap[current] ||
              'border-gray-300 bg-gray-100 text-gray-800'
          )}
        >
          <SelectValue placeholder="Select status" />
        </SelectTrigger>
        <SelectContent align="end" className="min-w-[12rem]">
          {TASK_STATUSES?.map((status) => (
            <SelectItem key={status.value} value={status.value}>
              <div className="flex items-center gap-2">
                <div
                  className={cn('h-2 w-2 rounded-full', {
                    'bg-green-500': status.value === 'completed',
                    'bg-blue-500': status.value === 'in_progress',
                    'bg-yellow-500': status.value === 'on_hold',
                    'bg-red-500': status.value === 'cancelled',
                    'bg-amber-500': status.value === 'due',
                  })}
                />
                <span className="capitalize">{status.lable}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {isPending && (
        <div className="text-muted-foreground text-xs">Updating status...</div>
      )}
    </div>
  );
}
