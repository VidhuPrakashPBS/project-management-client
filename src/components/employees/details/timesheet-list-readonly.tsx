'use client';

import { format } from 'date-fns';
import { Eye } from 'lucide-react';
import { AppTable, type CommonTableColumn } from '@/components/app-table';
import type { TimesheetEntry } from '@/components/time-sheet/list-time-sheet';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface Project {
  id: string;
  name: string;
}

interface TimesheetListReadonlyProps {
  timesheets: TimesheetEntry[];
  projects: Project[];
  onDateSelect: (date: Date | undefined) => void;
  onProjectFilter: (projectId: string) => void;
  onDateRangeFilter: (range: string) => void;
  isLoading?: boolean;
  selectedDate?: Date;
  selectedProject?: string;
  dateRangeFilter?: string;
  showFilters?: boolean;
  totalHours?: number;
}

export default function TimesheetListReadonly({
  timesheets,
  projects: _projects,
  onDateSelect: _onDateSelect,
  onProjectFilter: _onProjectFilter,
  onDateRangeFilter: _onDateRangeFilter,
  isLoading = false,
  selectedDate: _selectedDate,
  selectedProject: _selectedProject = '',
  dateRangeFilter: _dateRangeFilter = '',
  showFilters: _showFilters = false,
  totalHours = 0,
}: TimesheetListReadonlyProps) {
  const getLeaveStatus = (timesheet: TimesheetEntry) => {
    if (timesheet.onFullDayLeave) {
      return (
        <Badge className="text-xs" variant="destructive">
          Full Leave
        </Badge>
      );
    }
    if (timesheet.onHalfDayLeave) {
      return (
        <Badge className="text-xs" variant="secondary">
          {timesheet.halfDayLeaveType === 'firstHalf'
            ? '1st Half Leave'
            : '2nd Half Leave'}
        </Badge>
      );
    }
    return (
      <Badge className="text-xs" variant="default">
        Work
      </Badge>
    );
  };

  const columns: CommonTableColumn<TimesheetEntry>[] = [
    {
      key: 'date',
      label: 'Date',
      width: '100px',
      className: 'text-xs',
      render: (value) => format(value as Date, 'dd/MM/yy'),
    },
    {
      key: 'projectName',
      label: 'Project',
      className: 'text-xs font-medium',
    },
    {
      key: 'taskCategoryName',
      label: 'Main Task',
      className: 'text-xs',
    },
    {
      key: 'taskName',
      label: 'Task',
      className: 'text-xs text-muted-foreground',
      render: (value) => (value as string) || '—',
    },
    {
      key: 'description',
      label: 'Description',
      className: 'text-xs max-w-[200px]',
      render: (value) => (
        <div className="truncate" title={value as string}>
          {value as string}
        </div>
      ),
    },
    {
      key: 'hours',
      label: 'Hours',
      width: '80px',
      className: 'text-xs text-center font-mono',
      render: (value) => `${(value as number).toFixed(1)}h`,
    },
    {
      key: 'onFullDayLeave',
      label: 'Status',
      width: '100px',
      className: 'text-center',
      render: (_, row) => getLeaveStatus(row),
    },
  ];

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <CardTitle className="text-lg">Timesheet Entries</CardTitle>
            <p className="text-muted-foreground text-sm">
              {timesheets.length} entries • {totalHours.toFixed(1)} total hours
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-4">
        <AppTable
          columns={columns}
          data={timesheets}
          emptyMessage="No timesheet entries found for the selected filters"
          loading={isLoading}
          loadingRows={5}
        />

        {timesheets.length === 0 && !isLoading && (
          <div className="py-8 text-center text-muted-foreground">
            <Eye className="mx-auto mb-2 h-12 w-12 opacity-50" />
            <p>No timesheet entries to display</p>
            <p className="text-sm">
              Try adjusting your filters or check back later
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
