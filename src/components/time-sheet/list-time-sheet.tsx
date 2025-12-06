'use client';

import { format } from 'date-fns';
import {
  AlertTriangle,
  ArrowUpDown,
  CalendarIcon,
  Edit,
  Filter,
  Trash2,
  User,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import api from '@/lib/api';
import { cn } from '@/lib/utils';
import { AppTable, type CommonTableColumn } from '../app-table';
import ConfirmDialog from '../confirm-dialog';
import Pagination from '../pagination';

export interface TimesheetEntry {
  id: string;
  projectId: string;
  projectName: string;
  mainTaskId: string;
  taskCategoryId?: string;
  taskCategoryName?: string;
  mainTaskName: string;
  taskId?: string;
  taskName?: string;
  userName: string;
  userId: string;
  hours: number;
  description: string;
  onFullDayLeave: boolean;
  onHalfDayLeave: boolean;
  halfDayLeaveType?: 'firstHalf' | 'secondHalf';
  date: Date;
  createdAt: Date;
  updatedAt: Date;
}

interface Project {
  id: string;
  title: string;
}

interface Employee {
  id: string;
  name: string;
  email: string;
  image: string;
}

interface PaginationData {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface TimesheetListProps {
  timesheets: TimesheetEntry[];
  projects: Project[];
  pagination: PaginationData;
  onEdit: (timesheet: TimesheetEntry) => void;
  onDelete: (id: string) => void;
  onDateSelect: (date: Date | undefined) => void;
  onProjectFilter?: (projectId: string) => void;
  onDateRangeFilter?: (range: string) => void;
  onUserFilter?: (userId: string) => void;
  onSortChange?: (sort: string) => void;
  onPageChange?: (page: number) => void;
  isLoading?: boolean;
  selectedDate?: Date;
  selectedProject?: string;
  selectedUser?: string;
  dateRangeFilter?: string;
  sortOrder?: string;
  showFilters?: boolean;
  totalHours?: number;
  deletePermission?: boolean;
  editPermission?: boolean;
  topAccessFilter?: boolean;
}

export default function TimesheetList({
  timesheets,
  pagination,
  onEdit,
  onDelete,
  onDateSelect,
  onUserFilter,
  onSortChange,
  onPageChange,
  isLoading = false,
  selectedDate,
  selectedUser,
  sortOrder,
  totalHours = 0,
  deletePermission = false,
  editPermission = false,
  topAccessFilter = false,
}: TimesheetListProps) {
  const [deleteConfirm, setDeleteConfirm] = useState<{
    open: boolean;
    timesheetId: string | null;
  }>({ open: false, timesheetId: null });

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isFetchingEmployees, setIsFetchingEmployees] = useState(false);

  useEffect(() => {
    const fetchEmployees = async () => {
      setIsFetchingEmployees(true);
      try {
        const response = await api.get('/api/employee');
        if (response.data.data.data) {
          setEmployees(response.data.data.data);
        }
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : 'Failed to fetch employees'
        );
      } finally {
        setIsFetchingEmployees(false);
      }
    };

    fetchEmployees();
  }, []);

  const handleDeleteClick = (id: string) => {
    setDeleteConfirm({ open: true, timesheetId: id });
  };

  const handleDeleteConfirm = () => {
    if (deleteConfirm.timesheetId) {
      onDelete(deleteConfirm.timesheetId);
    }
    setDeleteConfirm({ open: false, timesheetId: null });
  };

  const handleDeleteCancel = () => {
    setDeleteConfirm({ open: false, timesheetId: null });
  };

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
          {timesheet.halfDayLeaveType === 'firstHalf' ? '1st Half' : '2nd Half'}
        </Badge>
      );
    }
    return (
      <Badge className="text-xs" variant="outline">
        Working
      </Badge>
    );
  };

  const getSelectedEmployeeName = () => {
    if (!selectedUser || selectedUser === 'all') {
      return 'All employees';
    }
    const employee = employees.find((emp) => emp.id === selectedUser);
    return employee ? employee.name : 'All employees';
  };

  const getSortOrderText = () => {
    return sortOrder === 'asc' ? 'Oldest first' : 'Recent first';
  };

  const hasActiveFilters =
    !!selectedDate ||
    (selectedUser && selectedUser !== 'all') ||
    (sortOrder && sortOrder !== 'desc');

  const columns: CommonTableColumn<TimesheetEntry>[] = [
    {
      key: 'date',
      label: 'Date',
      width: '110px',
      className: 'text-xs font-medium',
      render: (value) => (
        <div className="flex flex-col">
          <span>{format(value as Date, 'dd MMM yy')}</span>
          <span className="text-[10px] text-muted-foreground">
            {format(value as Date, 'EEE')}
          </span>
        </div>
      ),
    },
    {
      key: 'userName',
      label: 'User Name',
      width: '110px',
      className: 'text-xs font-medium',
      render: (value) => (
        <div className="flex flex-col">
          <span>{value as string}</span>
        </div>
      ),
    },
    {
      key: 'projectName',
      label: 'Project',
      className: 'text-xs',
      render: (value) => (
        <div className="flex flex-col">
          <span className="font-medium">{value as string}</span>
        </div>
      ),
    },
    {
      key: 'mainTaskName',
      label: 'Main Task',
      className: 'text-xs text-muted-foreground',
    },
    {
      key: 'taskName',
      label: 'Task',
      className: 'text-xs text-muted-foreground',
      render: (value) => (
        <span className="italic">{(value as string) || 'No task'}</span>
      ),
    },
    {
      key: 'description',
      label: 'Description',
      className: 'text-xs max-w-[250px]',
      render: (value) => (
        <div className="truncate" title={value as string}>
          {value as string}
        </div>
      ),
    },
    {
      key: 'hours',
      label: 'Hours',
      width: '90px',
      className: 'text-xs text-center',
      render: (value) => (
        <span className="font-mono font-semibold">
          {(value as number).toFixed(1)}h
        </span>
      ),
    },
    {
      key: 'onFullDayLeave',
      label: 'Status',
      width: '110px',
      className: 'text-center',
      render: (_, row) => getLeaveStatus(row),
    },
    ...(editPermission || deletePermission
      ? [
          {
            key: 'id' as keyof TimesheetEntry,
            label: 'Actions',
            width: '100px',
            className: 'text-center',
            render: (_: unknown, row: TimesheetEntry) => (
              <div className="flex justify-center gap-1">
                {editPermission && (
                  <Button
                    className="h-8 w-8 p-0 hover:bg-primary/10 hover:text-primary"
                    onClick={(e) => {
                      e.stopPropagation();
                      onEdit(row);
                    }}
                    size="sm"
                    variant="ghost"
                  >
                    <Edit className="h-3.5 w-3.5" />
                  </Button>
                )}
                {deletePermission && (
                  <Button
                    className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10 hover:text-destructive"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteClick(row.id);
                    }}
                    size="sm"
                    variant="ghost"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
            ),
          },
        ]
      : []),
  ];

  return (
    <Card className="shadow-sm">
      <CardHeader className="space-y-4 pb-4">
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-lg">Timesheet Entries</h3>
              <div className="flex items-center gap-4 text-muted-foreground text-sm">
                <span className="flex items-center gap-1">
                  <span className="font-semibold text-foreground">
                    {pagination.total}
                  </span>{' '}
                  {pagination.total === 1 ? 'entry' : 'entries'}
                </span>
                <span className="h-1 w-1 rounded-full bg-muted-foreground" />
                <span className="flex items-center gap-1">
                  <span className="font-semibold text-foreground">
                    {totalHours.toFixed(1)}
                  </span>{' '}
                  total hours
                </span>
              </div>
            </div>
            {hasActiveFilters && (
              <Badge className="text-xs" variant="secondary">
                <Filter className="mr-1 h-3 w-3" />
                Filtered
              </Badge>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-7">
          {/* Date */}
          <div className="space-y-1.5 sm:col-span-2 lg:col-span-2">
            <label
              className="font-medium text-muted-foreground text-xs"
              htmlFor="date-select"
            >
              Date
            </label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  className={cn(
                    'h-9 w-full justify-start text-left font-normal text-xs',
                    !selectedDate && 'text-muted-foreground'
                  )}
                  id="date-select"
                  variant="outline"
                >
                  <CalendarIcon className="mr-2 h-3.5 w-3.5" />
                  {selectedDate
                    ? format(selectedDate, 'dd MMM yyyy')
                    : 'Select date'}
                </Button>
              </PopoverTrigger>
              <PopoverContent align="start" className="w-auto p-0">
                <Calendar
                  initialFocus
                  mode="single"
                  onSelect={onDateSelect}
                  selected={selectedDate}
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Employee */}
          {topAccessFilter && (
            <div className="space-y-1.5 sm:col-span-2 lg:col-span-2">
              <label
                className="font-medium text-muted-foreground text-xs"
                htmlFor="employee-select"
              >
                Employee
              </label>
              <Select
                disabled={isFetchingEmployees}
                onValueChange={onUserFilter}
                value={selectedUser ?? 'all'}
              >
                <SelectTrigger className="h-9 text-xs" id="employee-select">
                  <SelectValue>{getSelectedEmployeeName()}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    <div className="flex items-center gap-2">
                      <User className="h-3.5 w-3.5" />
                      <span>All employees</span>
                    </div>
                  </SelectItem>
                  {employees?.map((employee) => (
                    <SelectItem key={employee.id} value={employee.id}>
                      <div className="flex items-center gap-2">
                        <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 font-semibold text-[10px] text-primary">
                          {employee.name.charAt(0).toUpperCase()}
                        </div>
                        <span>{employee.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Sort */}
          <div className="space-y-1.5 sm:col-span-2 lg:col-span-2">
            <label
              className="font-medium text-muted-foreground text-xs"
              htmlFor="sort-select"
            >
              Sort by
            </label>
            <Select onValueChange={onSortChange} value={sortOrder ?? 'desc'}>
              <SelectTrigger className="h-9 text-xs" id="sort-select">
                <SelectValue>{getSortOrderText()}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="desc">
                  <div className="flex items-center gap-2">
                    <ArrowUpDown className="h-3.5 w-3.5" />
                    <span>Recent first</span>
                  </div>
                </SelectItem>
                <SelectItem value="asc">
                  <div className="flex items-center gap-2">
                    <ArrowUpDown className="h-3.5 w-3.5" />
                    <span>Oldest first</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Clear Filters */}
          {hasActiveFilters && (
            <div className="flex flex-col justify-end space-y-1.5 sm:col-span-2 lg:col-span-1">
              <div className="pointer-events-none font-medium text-muted-foreground text-xs opacity-0">
                Clear
              </div>
              <Button
                className="h-9 w-full text-xs"
                onClick={() => {
                  onDateSelect(undefined);
                  onUserFilter?.('all');
                  onSortChange?.('desc');
                }}
                size="sm"
                variant="outline"
              >
                Clear filters
              </Button>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <AppTable
          columns={columns}
          data={timesheets}
          emptyMessage="No timesheet entries found. Create your first entry above."
          loading={isLoading}
          loadingRows={5}
        />

        {/* Pagination Section */}
        {pagination.totalPages > 0 && (
          <div className="flex items-center justify-between border-t px-6 py-4">
            <div className="text-muted-foreground text-sm">
              Showing{' '}
              {Math.min(
                (pagination.page - 1) * pagination.limit + 1,
                pagination.total
              )}{' '}
              to{' '}
              {Math.min(pagination.page * pagination.limit, pagination.total)}{' '}
              of {pagination.total} entries
            </div>

            <Pagination
              currentPage={pagination.page}
              onPageChange={(page) => onPageChange?.(page)}
              totalPages={pagination.totalPages}
            />
          </div>
        )}
      </CardContent>

      <ConfirmDialog
        cancelText="Cancel"
        confirmText="Delete"
        description="This timesheet entry will be permanently deleted. This action cannot be undone."
        icon={<AlertTriangle className="h-6 w-6 text-destructive" />}
        mode="confirm"
        onCancel={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        onOpenChange={(open) => {
          if (!open) {
            handleDeleteCancel();
          }
        }}
        open={deleteConfirm.open}
        title="Delete Timesheet Entry"
      />
    </Card>
  );
}
