'use client';

import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  LayoutGrid,
  Search,
  Table as TableIcon,
  X,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'nextjs-toploader/app';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { AppTable, type CommonTableColumn } from '@/components/app-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/use-auth';
import api from '@/lib/api';
import { authClient } from '@/lib/auth-client';
import type { Project } from '@/types/project';
import type { TaskData } from '@/types/task';
import { encryptId } from '@/utils/aes-security-encryption';
import { mapTaskStatusToView, statusStyles } from '@/utils/status-colorizer';

interface Filters {
  search?: string;
  status?: string;
  projectId?: string;
  lastActivity?: 'asc' | 'desc';
  dueDate?: 'asc' | 'desc';
}

const TASK_STATUSES = [
  { value: 'all', label: 'All Statuses' },
  { value: 'pending', label: 'Pending' },
  { value: 'in-progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
  { value: 'on-hold', label: 'On Hold' },
];

const ITEMS_PER_PAGE_OPTIONS = [6, 12, 24, 48];

export default function TasksPage() {
  const { data: session } = authClient.useSession();
  const [tasks, setTasks] = useState<TaskData[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'table' | 'cards'>('cards');
  const [filters, setFilters] = useState<Filters>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(12);
  const router = useRouter();
  const { hasPermission } = useAuth();

  const checkPermission = useCallback(() => {
    try {
      const response = hasPermission('TASK-ASSIGNED-TO-ME');
      if (!response) {
        router.replace('/dashboard');
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to verify permissions'
      );
    }
  }, [router, hasPermission]);

  useEffect(() => {
    checkPermission();
  }, [checkPermission]);

  const buildQueryParams = useCallback(
    (userId: string, filt: Filters): URLSearchParams => {
      const params = new URLSearchParams();
      params.append('assignedTo', userId);

      if (filt.search) {
        params.append('search', filt.search);
      }
      if (filt.status && filt.status !== 'all') {
        params.append('status', filt.status);
      }
      if (filt.projectId && filt.projectId !== 'all') {
        params.append('projectId', filt.projectId);
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

  const fetchProjects = useCallback(async () => {
    try {
      const response = await api.get('/api/project');
      if (response.data.success) {
        setProjects(response.data.data.data || []);
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to fetch projects'
      );
    }
  }, []);

  const fetchTasks = useCallback(async () => {
    if (!session?.user?.id) {
      return;
    }

    try {
      setLoading(true);
      const params = buildQueryParams(session.user.id, filters);
      const response = await api.get(`/api/tasks?${params.toString()}`);

      if (response.data.success) {
        setTasks(response.data.data || []);
        setCurrentPage(1); // Reset to first page when filters change
      } else {
        toast.error(response.data.message || 'Failed to fetch tasks');
        setTasks([]);
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to fetch tasks'
      );
      setTasks([]);
    } finally {
      setLoading(false);
    }
  }, [session?.user?.id, filters, buildQueryParams]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const handleFilterChange = (
    key: keyof Filters,
    value: string | undefined
  ) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const clearAllFilters = () => {
    setFilters({});
  };

  const hasActiveFilters = useMemo(() => {
    return Object.entries(filters).some(
      ([, value]) => value !== undefined && value !== '' && value !== 'all'
    );
  }, [filters]);

  const activeFilterCount = useMemo(() => {
    return Object.entries(filters).filter(
      ([, value]) => value !== undefined && value !== '' && value !== 'all'
    ).length;
  }, [filters]);

  // Pagination calculations
  const totalPages = Math.ceil(tasks.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedTasks = tasks.slice(startIndex, endIndex);

  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  const taskColumns: CommonTableColumn<TaskData>[] = useMemo(
    () => [
      {
        key: 'title',
        label: 'Title',
        render(_value, row) {
          return (
            <Link
              className="font-medium hover:underline"
              href={`/tasks/${encryptId(row.id)}`}
            >
              {row.title}
            </Link>
          );
        },
      },
      {
        key: 'status',
        label: 'Status',
        width: '150px',
        render(value) {
          const statusStr = typeof value === 'string' ? value : 'pending';
          const statusView = mapTaskStatusToView(statusStr);
          const statusStyle = statusStyles(statusView);
          return (
            <span
              className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 font-medium text-xs ${statusStyle.chip}`}
            >
              <span className={`h-2 w-2 rounded-full ${statusStyle.dot}`} />
              {statusStyle.text}
            </span>
          );
        },
      },
      {
        key: 'endDate',
        label: 'Due Date',
        width: '120px',
        render(value) {
          if (
            !value ||
            (typeof value !== 'string' &&
              typeof value !== 'number' &&
              !(value instanceof Date))
          ) {
            return <span className="text-muted-foreground">-</span>;
          }
          const date = new Date(value);
          const isOverdue = date < new Date();
          return (
            <span className={isOverdue ? 'font-semibold text-red-600' : ''}>
              {date.toLocaleDateString()}
            </span>
          );
        },
      },
      {
        key: 'createdAt',
        label: 'Created',
        width: '120px',
        render(value) {
          return value &&
            (typeof value === 'string' ||
              typeof value === 'number' ||
              value instanceof Date) ? (
            <span className="text-muted-foreground">
              {new Date(value).toLocaleDateString()}
            </span>
          ) : (
            '-'
          );
        },
      },
    ],
    []
  );

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-bold text-3xl tracking-tight">My Tasks</h1>
          <p className="mt-1 text-muted-foreground">
            Manage and track your assigned tasks
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge className="px-3 py-1 text-sm" variant="secondary">
            {tasks.length} {tasks.length === 1 ? 'task' : 'tasks'}
          </Badge>
        </div>
      </div>

      {/* Filters Section */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Filters & Sorting</CardTitle>
            {hasActiveFilters && (
              <Button onClick={clearAllFilters} size="sm" variant="ghost">
                <X className="mr-1 h-3 w-3" />
                Clear all ({activeFilterCount})
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* First Row: Search, Status, Project */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label className="font-medium text-xs">Search</Label>
              <div className="relative">
                <Search className="absolute top-2.5 left-3 h-4 w-4 text-muted-foreground" />
                <Input
                  className="pl-9"
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  placeholder="Search tasks..."
                  type="search"
                  value={filters.search || ''}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="font-medium text-xs">Status</Label>
              <Select
                onValueChange={(v) =>
                  handleFilterChange('status', v === 'all' ? undefined : v)
                }
                value={filters.status || 'all'}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  {TASK_STATUSES?.map((status) => (
                    <SelectItem key={status.value} value={status.value}>
                      {status.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="font-medium text-xs">Project</Label>
              <Select
                onValueChange={(v) =>
                  handleFilterChange('projectId', v === 'all' ? undefined : v)
                }
                value={filters.projectId || 'all'}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Projects" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Projects</SelectItem>
                  {projects?.map((project) => (
                    <SelectItem key={project?.id} value={project?.id}>
                      {project?.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Second Row: Sorting and View */}
          <div className="flex flex-wrap items-end gap-4">
            <div className="space-y-2">
              <Label className="font-medium text-xs">Sort by Activity</Label>
              <Select
                onValueChange={(v) =>
                  handleFilterChange(
                    'lastActivity',
                    v === 'none' ? undefined : (v as 'asc' | 'desc')
                  )
                }
                value={filters.lastActivity || 'none'}
              >
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="No sorting" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Default</SelectItem>
                  <SelectItem value="desc">Most recent first</SelectItem>
                  <SelectItem value="asc">Oldest first</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="font-medium text-xs">Sort by Due Date</Label>
              <Select
                onValueChange={(v) =>
                  handleFilterChange(
                    'dueDate',
                    v === 'none' ? undefined : (v as 'asc' | 'desc')
                  )
                }
                value={filters.dueDate || 'none'}
              >
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="No sorting" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Default</SelectItem>
                  <SelectItem value="asc">Earliest first</SelectItem>
                  <SelectItem value="desc">Latest first</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="font-medium text-xs">Items per page</Label>
              <Select
                onValueChange={(v) => {
                  setItemsPerPage(Number(v));
                  setCurrentPage(1);
                }}
                value={itemsPerPage.toString()}
              >
                <SelectTrigger className="w-[100px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ITEMS_PER_PAGE_OPTIONS?.map((option) => (
                    <SelectItem key={option} value={option.toString()}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="ml-auto space-y-2">
              <Label className="font-medium text-xs">View</Label>
              <Tabs
                onValueChange={(v) => setView(v as 'table' | 'cards')}
                value={view}
              >
                <TabsList>
                  <TabsTrigger className="gap-2" value="table">
                    <TableIcon className="h-4 w-4" />
                    <span className="hidden sm:inline">Table</span>
                  </TabsTrigger>
                  <TabsTrigger className="gap-2" value="cards">
                    <LayoutGrid className="h-4 w-4" />
                    <span className="hidden sm:inline">Cards</span>
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Content */}
      <div className="rounded-lg border bg-card">
        {loading && (
          <div className="flex min-h-[400px] items-center justify-center py-12">
            <div className="flex flex-col items-center gap-3">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
              <p className="text-muted-foreground text-sm">Loading tasks...</p>
            </div>
          </div>
        )}
        {!loading && view === 'table' && (
          <AppTable<TaskData> columns={taskColumns} data={paginatedTasks} />
        )}
        {!loading && view === 'cards' && (
          <div className="p-4">
            {tasks.length === 0 ? (
              <div className="flex min-h-[400px] flex-col items-center justify-center py-12 text-center">
                <div className="rounded-full bg-muted p-3">
                  <Search className="h-6 w-6 text-muted-foreground" />
                </div>
                <h3 className="mt-4 font-semibold text-lg">No tasks found</h3>
                <p className="mt-2 max-w-sm text-muted-foreground text-sm">
                  {hasActiveFilters
                    ? 'Try adjusting your filters to see more results'
                    : 'You have no assigned tasks at the moment'}
                </p>
                {hasActiveFilters && (
                  <Button
                    className="mt-4"
                    onClick={clearAllFilters}
                    size="sm"
                    variant="outline"
                  >
                    Clear filters
                  </Button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {paginatedTasks?.map((task) => {
                  const statusView = mapTaskStatusToView(
                    task.status ?? 'pending'
                  );
                  const statusStyle = statusStyles(statusView);
                  const isOverdue =
                    task.endDate && new Date(task.endDate) < new Date();

                  return (
                    <Link href={`/tasks/${encryptId(task.id)}`} key={task.id}>
                      <Card className="h-full transition-all hover:border-primary/50 hover:shadow-md">
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between gap-2">
                            <CardTitle className="line-clamp-1 text-base">
                              {task.title}
                            </CardTitle>
                            <Badge
                              className="shrink-0 font-mono"
                              variant="outline"
                            >
                              Task No: {task.taskNo}
                            </Badge>
                          </div>
                          <CardDescription className="line-clamp-2 text-sm">
                            {task.description}
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3 text-sm">
                          <div className="flex items-center justify-between">
                            <span className="text-muted-foreground text-xs">
                              Status
                            </span>
                            <span
                              className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 font-medium text-xs ${statusStyle.chip}`}
                            >
                              <span
                                className={`h-1.5 w-1.5 rounded-full ${statusStyle.dot}`}
                              />
                              {statusStyle.text}
                            </span>
                          </div>

                          <div className="flex items-center justify-between">
                            <span className="text-muted-foreground text-xs">
                              Assigned To
                            </span>
                            <span className="font-medium text-xs">
                              {task.employeeName || 'Unassigned'}
                            </span>
                          </div>

                          {task.endDate && (
                            <div className="flex items-center justify-between">
                              <span className="text-muted-foreground text-xs">
                                Due Date
                              </span>
                              <span
                                className={`font-medium text-xs ${isOverdue ? 'text-red-600' : ''}`}
                              >
                                {new Date(task.endDate).toLocaleDateString()}
                              </span>
                            </div>
                          )}

                          <div className="flex items-center justify-between border-t pt-3">
                            <span className="text-muted-foreground text-xs">
                              Created
                            </span>
                            <span className="text-muted-foreground text-xs">
                              {new Date(task.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Pagination */}
        {!loading && tasks.length > 0 && (
          <div className="flex items-center justify-between border-t px-4 py-3">
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <span>
                Showing {startIndex + 1} to {Math.min(endIndex, tasks.length)}{' '}
                of {tasks.length} tasks
              </span>
            </div>

            <div className="flex items-center gap-2">
              <Button
                disabled={currentPage === 1}
                onClick={() => goToPage(1)}
                size="icon"
                variant="outline"
              >
                <ChevronsLeft className="h-4 w-4" />
              </Button>
              <Button
                disabled={currentPage === 1}
                onClick={() => goToPage(currentPage - 1)}
                size="icon"
                variant="outline"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>

              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter((page) => {
                    const distance = Math.abs(page - currentPage);
                    return (
                      distance === 0 ||
                      distance === 1 ||
                      page === 1 ||
                      page === totalPages
                    );
                  })
                  ?.map((page, index, array) => {
                    const showEllipsis =
                      index > 0 && page - array[index - 1] > 1;
                    return (
                      <div className="flex items-center" key={page}>
                        {showEllipsis && (
                          <span className="px-2 text-muted-foreground">
                            ...
                          </span>
                        )}
                        <Button
                          onClick={() => goToPage(page)}
                          size="icon"
                          variant={currentPage === page ? 'default' : 'outline'}
                        >
                          {page}
                        </Button>
                      </div>
                    );
                  })}
              </div>

              <Button
                disabled={currentPage === totalPages}
                onClick={() => goToPage(currentPage + 1)}
                size="icon"
                variant="outline"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button
                disabled={currentPage === totalPages}
                onClick={() => goToPage(totalPages)}
                size="icon"
                variant="outline"
              >
                <ChevronsRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
