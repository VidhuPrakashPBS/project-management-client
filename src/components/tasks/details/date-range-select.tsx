'use client';

import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import { useEffect, useState, useTransition } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import api from '@/lib/api';

interface TaskDateRangeProps {
  taskId: string;
  endDate: Date | null;
  onDateUpdate?: (newEndDate: Date | null) => void;
}

export default function TaskDateRange({
  taskId,
  endDate,
  onDateUpdate,
}: TaskDateRangeProps) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    endDate || undefined
  );
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setSelectedDate(endDate || undefined);
  }, [endDate]);

  const onSelect = (date: Date | undefined) => {
    if (!date) {
      return;
    }

    setSelectedDate(date);

    startTransition(async () => {
      try {
        setError(null);

        const formData = new FormData();
        formData.append('id', taskId);
        formData.append('dueDate', date.toISOString());

        const response = await api.put('/api/tasks', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });

        if (!response.data.success) {
          throw new Error(response.data.message || 'Failed to update deadline');
        }

        if (onDateUpdate) {
          onDateUpdate(date);
        }

        toast.success('Deadline updated successfully');
      } catch (err) {
        toast.error(`Failed to update deadline. ${err}`);

        setSelectedDate(endDate || undefined);
      }
    });
  };

  const getLabel = () => {
    if (selectedDate) {
      return format(selectedDate, 'LLL dd, y');
    }
    return <span>Pick a deadline</span>;
  };

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
      <CardHeader className="py-3">
        <CardTitle className="text-base">Deadline</CardTitle>
      </CardHeader>
      <CardContent>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              className="w-full justify-start text-left font-normal"
              disabled={isPending}
              variant="outline"
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {getLabel()}
            </Button>
          </PopoverTrigger>
          <PopoverContent align="start" className="w-auto p-0">
            <Calendar
              disabled={(date) => date < new Date()}
              mode="single"
              onSelect={onSelect}
              selected={selectedDate}
            />
          </PopoverContent>
        </Popover>

        {isPending && (
          <div className="mt-2 text-muted-foreground text-xs">
            Updating deadline...
          </div>
        )}

        {error && (
          <div className="mt-2 text-destructive text-xs">Error: {error}</div>
        )}
      </CardContent>
    </Card>
  );
}
