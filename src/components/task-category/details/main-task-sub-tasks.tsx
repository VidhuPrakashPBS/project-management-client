'use client';

import { Edit, SlidersHorizontal } from 'lucide-react';
import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAuth } from '@/hooks/use-auth';
import api from '@/lib/api';
import type { Employee, SubTaskView, Task } from '@/types/main-task';
import { encryptId } from '@/utils/aes-security-encryption';
import { mapTaskStatusToView, statusStyles } from '@/utils/status-colorizer';
import EditSubTaskDialog from './edit-sub-task-dialog';
import { MainTaskSubTaskLoadingSkeleton } from './main-task-sub-tasks-loader';

type Filters = {
  assignedTo?: string;
  status?: string;
  lastActivity?: 'asc' | 'desc';
  dueDate?: 'asc' | 'desc';
};

const TASK_STATUSES = [
  { value: 'in-progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
  { value: 'on-hold', label: 'On Hold' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'due', label: 'Due' },
];

export function MainTaskSubTasks({
  mainTaskId,
  mainTaskName,
}: {
  mainTaskId: string;
  mainTaskName?: string;
}) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [hasTaskEditPermission, setHasTaskEditPermission] =
    useState<boolean>(false);
  const [filters, setFilters] = useState<Filters>({});
  const [employees, setEmployees] = useState<Employee[]>([]);
  const { hasPermission } = useAuth();

  const fetchPermissions = useCallback(() => {
    const permissions = hasPermission('TASK-UPDATE');
    setHasTaskEditPermission(permissions ?? false);
  }, [hasPermission]);

  const fetchEmployees = useCallback(async () => {
    try {
      const response = await api.get('/api/employee');
      if (response.data.data.data) {
        setEmployees(response.data.data.data);
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to fetch employees'
      );
    }
  }, []);

  const buildQueryParams = useCallback(
    (mainTkId: string, filt: Filters): URLSearchParams => {
      const params = new URLSearchParams();
      params.append('mainTaskId', mainTkId);

      if (filt.assignedTo) {
        params.append('assignedTo', filt.assignedTo);
      }
      if (filt.status) {
        params.append('status', filt.status);
      }
      if (filt.lastActivity) {
        params.append('lastActivity', filt.lastActivity);
      }
      if (filt.dueDate) {
        params.append('dueDate', filt.dueDate);
      }

      return params;
    },
    []
  );

  const fetchTasks = useCallback(async () => {
    if (!mainTaskId) {
      return;
    }

    try {
      setLoading(true);

      const params = buildQueryParams(mainTaskId, filters);
      const response = await api.get(`/api/tasks?${params.toString()}`);

      if (response.data.success) {
        setTasks(response.data.data || []);
      } else {
        toast.error(response.data.message || 'Failed to fetch tasks');
        setTasks([]);
      }
    } catch (error) {
      toast.error(`Failed to fetch tasks: ${error}`);
      setTasks([]);
    } finally {
      setLoading(false);
    }
  }, [mainTaskId, filters, buildQueryParams]);

  useEffect(() => {
    fetchPermissions();
    fetchEmployees();
  }, [fetchPermissions, fetchEmployees]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const handleTaskUpdated = () => {
    fetchTasks();
  };

  const handleFilterChange = (
    key: keyof Filters,
    value: string | undefined
  ) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const clearFilters = () => {
    setFilters({});
  };

  const hasActiveFilters = Object.values(filters).some(
    (value) => value !== undefined
  );

  // Convert API tasks to SubTaskView format
  const subTasks: SubTaskView[] = tasks?.map((task) => ({
    id: task.id,
    title: task.title,
    description: task.description,
    status: mapTaskStatusToView(task.status),
    assigneeName: task.employeeName || 'Unassigned',
    dueDate: task.endDate || undefined,
    taskNo: task.taskNo,
  }));

  if (loading) {
    return <MainTaskSubTaskLoadingSkeleton />;
  }

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <span>Tasks</span>
              <span className="font-normal text-muted-foreground text-sm">
                ({subTasks.length})
              </span>
            </CardTitle>
            <CardDescription>
              {mainTaskName
                ? `All sub-tasks created under ${mainTaskName}.`
                : 'Sub-tasks for this main task.'}
            </CardDescription>
          </div>

          <Popover>
            <PopoverTrigger asChild>
              <Button size="sm" variant="outline">
                <SlidersHorizontal className="mr-2 h-4 w-4" />
                Filters
                {hasActiveFilters && (
                  <span className="ml-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground">
                    {Object.values(filters).filter(Boolean).length}
                  </span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-80">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-sm">Filter & Sort</h4>
                  {hasActiveFilters && (
                    <Button onClick={clearFilters} size="sm" variant="ghost">
                      Clear all
                    </Button>
                  )}
                </div>

                <div className="space-y-3">
                  {/* Assigned To Filter */}
                  <div className="space-y-2">
                    <Label className="text-xs">Assigned To</Label>
                    <Select
                      onValueChange={(value) =>
                        handleFilterChange(
                          'assignedTo',
                          value === 'all' ? undefined : value
                        )
                      }
                      value={filters.assignedTo || 'all'}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="All employees" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All employees</SelectItem>
                        {employees?.map((employee) => (
                          <SelectItem key={employee.id} value={employee.id}>
                            {employee.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Status Filter */}
                  <div className="space-y-2">
                    <Label className="text-xs">Status</Label>
                    <Select
                      onValueChange={(value) =>
                        handleFilterChange(
                          'status',
                          value === 'all' ? undefined : value
                        )
                      }
                      value={filters.status || 'all'}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="All statuses" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All statuses</SelectItem>
                        {TASK_STATUSES?.map((status) => (
                          <SelectItem key={status.value} value={status.value}>
                            {status.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Last Activity Sort */}
                  <div className="space-y-2">
                    <Label className="text-xs">Sort by Last Activity</Label>
                    <Select
                      onValueChange={(value) =>
                        handleFilterChange(
                          'lastActivity',
                          value === 'none'
                            ? undefined
                            : (value as 'asc' | 'desc')
                        )
                      }
                      value={filters.lastActivity || 'none'}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="No sorting" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No sorting</SelectItem>
                        <SelectItem value="desc">Most recent first</SelectItem>
                        <SelectItem value="asc">Oldest first</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Due Date Sort */}
                  <div className="space-y-2">
                    <Label className="text-xs">Sort by Due Date</Label>
                    <Select
                      onValueChange={(value) =>
                        handleFilterChange(
                          'dueDate',
                          value === 'none'
                            ? undefined
                            : (value as 'asc' | 'desc')
                        )
                      }
                      value={filters.dueDate || 'none'}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="No sorting" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No sorting</SelectItem>
                        <SelectItem value="asc">Earliest first</SelectItem>
                        <SelectItem value="desc">Latest first</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-120">
          {subTasks.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              <p className="text-sm">
                {hasActiveFilters
                  ? 'No tasks match your filters'
                  : 'No sub-tasks found'}
              </p>
              <p className="text-xs">
                {hasActiveFilters
                  ? 'Try adjusting your filters'
                  : 'Create a sub-task to get started'}
              </p>
            </div>
          ) : (
            <div className="max-h-80 space-y-2">
              {subTasks?.map((task) => {
                const statusStyle = statusStyles(task.status);
                return (
                  <div className="rounded-md border p-3" key={task.id}>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-12">
                      <div className="sm:col-span-8">
                        <div className="flex items-center justify-between">
                          <Link
                            className="font-medium underline hover:no-underline"
                            href={`/tasks/${encryptId(task.id)}`}
                          >
                            {task.title}
                            <span className="ml-2 text-muted-foreground text-xs">
                              ({task.taskNo})
                            </span>
                          </Link>
                        </div>
                        {task.description && (
                          <p className="text-muted-foreground text-sm">
                            {task.description}
                          </p>
                        )}
                        <div className="mt-1 flex items-center gap-4 text-muted-foreground text-xs">
                          <span>
                            {task.assigneeName !== 'Unassigned' &&
                              'Assigned to:'}{' '}
                            {task.assigneeName}
                          </span>
                          {task.dueDate && (
                            <span className="whitespace-nowrap text-red-600">
                              Due: {new Date(task.dueDate).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="sm:col-span-4">
                        <div className="flex h-full w-full items-center justify-end">
                          <div className="flex items-center gap-2">
                            <span
                              className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 font-medium text-xs ${statusStyle.chip}`}
                            >
                              <span
                                className={`h-2.5 w-2.5 rounded-full ${statusStyle.dot}`}
                              />
                              {statusStyle.text}
                            </span>
                            {hasTaskEditPermission && (
                              <EditSubTaskDialog
                                onTaskUpdated={handleTaskUpdated}
                                taskId={task.id}
                              >
                                <button
                                  aria-label="Edit sub-task"
                                  className="inline-flex h-8 w-8 items-center justify-center rounded-md border bg-background transition-colors hover:bg-accent hover:text-accent-foreground"
                                  type="button"
                                >
                                  <Edit className="h-4 w-4" />
                                </button>
                              </EditSubTaskDialog>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
