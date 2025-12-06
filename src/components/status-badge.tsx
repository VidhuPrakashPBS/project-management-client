'use client';

import { useMemo, useTransition } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

const statusClassMap: Record<string, string> = {
  completed: 'bg-green-500/10 text-green-700 border-green-400/50',
  'in-progress': 'bg-blue-500/10 text-blue-700 border-blue-400/50',
  in_progress: 'bg-blue-500/10 text-blue-700 border-blue-400/50',
  'in progress': 'bg-blue-500/10 text-blue-700 border-blue-400/50',
  'on hold': 'bg-yellow-500/10 text-yellow-700 border-yellow-400/50',
  on_hold: 'bg-yellow-500/10 text-yellow-700 border-yellow-400/50',
  pending: 'bg-gray-500/10 text-gray-700 border-gray-400/50',
};

type Status = 'completed' | 'in_progress' | 'on_hold' | 'pending';

type StatusSelectProps = {
  value: string;
  onChange?: (next: Status) => void;
  className?: string;
  disabled?: boolean;
};

export function StatusSelect({
  value,
  onChange,
  className,
  disabled = false,
}: StatusSelectProps) {
  const [isPending, startTransition] = useTransition();
  const normalized = value.toLowerCase().replace(/ /g, '_');
  const colorClass =
    statusClassMap[normalized] ?? 'bg-gray-100 text-gray-800 border-gray-300';

  const options: { value: Status; label: string }[] = useMemo(
    () => [
      { value: 'pending', label: 'Pending' },
      { value: 'in_progress', label: 'In Progress' },
      { value: 'on_hold', label: 'On Hold' },
      { value: 'completed', label: 'Completed' },
    ],
    []
  );

  const formatStatusLabel = (status: string) => {
    const option = options.find((opt) => opt.value === status);
    return option
      ? option.label
      : status.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
  };

  return (
    <Select
      disabled={isPending || disabled}
      onValueChange={(next) => {
        const nextStatus = next as Status;
        if (onChange) {
          startTransition(() => onChange(nextStatus));
        }
      }}
      value={normalized}
    >
      <SelectTrigger
        className={cn(
          'h-8 w-auto rounded-full border px-3 font-medium text-xs',
          colorClass,
          className,
          (isPending || disabled) && 'cursor-not-allowed opacity-50'
        )}
      >
        <SelectValue>{formatStatusLabel(normalized)}</SelectValue>
      </SelectTrigger>
      <SelectContent align="end" className="min-w-[12rem]">
        {options?.map((opt) => (
          <SelectItem key={opt.value} value={opt.value}>
            {opt.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
