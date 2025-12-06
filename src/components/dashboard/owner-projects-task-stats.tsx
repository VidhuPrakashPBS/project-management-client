'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { CommonTableColumn } from '@/components/app-table';
import { AppTable } from '@/components/app-table';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import api from '@/lib/api';
import { authClient } from '@/lib/auth-client';
import type {
  ProjectTaskOverview,
  TaskStatusOverviewResponse,
} from '@/types/dashboard';
import type { Project } from '@/types/project';

// Extend ProjectTaskOverview to include id for AppTable
interface ProjectTaskOverviewWithId extends ProjectTaskOverview {
  id: string;
}

export default function OwnerProjectsTaskStats() {
  const [selectedProjectId, setSelectedProjectId] = useState<string>('all');
  const [projects, setProjects] = useState<Project[]>([]);
  const [overview, setOverview] = useState<TaskStatusOverviewResponse | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageLimit, setPageLimit] = useState(10);
  const [projectsLimit, setProjectsLimit] = useState(10);
  const { data: session } = authClient.useSession();
  const userId = session?.user?.id;

  // Fetch projects for dropdown
  useEffect(() => {
    if (!userId) {
      return;
    }

    const fetchProjects = async () => {
      try {
        const response = await api.get('/api/project', {
          params: {
            userId,
            limit: projectsLimit,
          },
        });
        setProjects(response.data.data.data || []);
      } catch {
        setProjects([]);
      }
    };

    fetchProjects();
  }, [userId, projectsLimit]);

  // Fetch task overview
  useEffect(() => {
    if (!userId) {
      return;
    }

    const fetchTaskOverview = async () => {
      setIsLoading(true);
      try {
        const params: Record<string, string | number> = {
          userId,
          page: currentPage,
          limit: pageLimit,
        };
        if (selectedProjectId && selectedProjectId !== 'all') {
          params.projectId = selectedProjectId;
        }

        const response = await api.get('/api/dashboard/task-status-overview', {
          params,
        });
        setOverview(response.data.data as TaskStatusOverviewResponse);
      } catch {
        setOverview(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTaskOverview();
  }, [userId, selectedProjectId, currentPage, pageLimit]);

  // Reset to page 1 when project filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, []);

  // Handle loading more projects
  const handleLoadMoreProjects = () => {
    setProjectsLimit((prev) => prev + 10);
  };

  // Handle changing page limit
  const handlePageLimitChange = (limit: number) => {
    setPageLimit(limit);
    setCurrentPage(1);
  };

  // Get project managers for a specific project
  const getProjectManagers = (
    managers: Array<{
      id: string;
      name: string;
      email: string;
      image: string | null;
    }>
  ): string => {
    if (!managers || managers.length === 0) {
      return 'No managers assigned';
    }
    return managers.map((m) => m.name || m.email).join(', ');
  };

  // Calculate due rate (tasks that are not completed / total tasks)
  const getDueRate = (project: {
    totalTasks: number;
    completedTasks: number;
  }): number => {
    if (project.totalTasks === 0) {
      return 0;
    }
    const dueTasks = project.totalTasks - project.completedTasks;
    return (dueTasks / project.totalTasks) * 100;
  };

  // Handle pagination
  const handlePreviousPage = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  };

  const handleNextPage = () => {
    if (overview?.pagination) {
      setCurrentPage((prev) =>
        Math.min(prev + 1, overview.pagination.totalPages)
      );
    }
  };

  // Define table columns
  const columns: CommonTableColumn<ProjectTaskOverviewWithId>[] = [
    {
      key: 'projectName',
      label: 'Project Name',
      headClassName: 'min-w-[150px]',
      className: 'font-medium',
      render: (_value, row) => {
        const dueRate = getDueRate(row);
        const isHighDueRate = dueRate > 80;
        return (
          <div className="flex items-center gap-2">
            {isHighDueRate && (
              <span className="text-red-600 dark:text-red-400">⚠️</span>
            )}
            {row.projectName}
          </div>
        );
      },
    },
    {
      key: 'projectId',
      label: 'Managers',
      headClassName: 'min-w-[150px]',
      render: (_value, row) => (
        <div className="text-muted-foreground text-xs">
          {getProjectManagers(row?.managers ?? [])}
        </div>
      ),
    },
    {
      key: 'totalTasks',
      label: 'Total',
      headClassName: 'min-w-[80px] text-center',
      className: 'text-center',
      render: (value) => (
        <span className="inline-flex items-center justify-center rounded-md bg-blue-50 px-2 py-1 font-semibold text-blue-700 text-xs dark:bg-blue-950/30 dark:text-blue-400">
          {value as number}
        </span>
      ),
    },
    {
      key: 'completedTasks',
      label: 'Completed',
      headClassName: 'min-w-[100px] text-center',
      className: 'text-center',
      render: (value) => (
        <span className="inline-flex items-center justify-center rounded-md bg-green-50 px-2 py-1 font-semibold text-green-700 text-xs dark:bg-green-950/30 dark:text-green-400">
          {value as number}
        </span>
      ),
    },
    {
      key: 'pendingTasks',
      label: 'In Progress',
      headClassName: 'min-w-[110px] text-center',
      className: 'text-center',
      render: (_value, row) => {
        const inProgressTasks = row.pendingTasks + row.overdueTasks;
        return (
          <span className="inline-flex items-center justify-center rounded-md bg-amber-50 px-2 py-1 font-semibold text-amber-700 text-xs dark:bg-amber-950/30 dark:text-amber-400">
            {inProgressTasks}
          </span>
        );
      },
    },
    {
      key: 'overdueTasks',
      label: 'Overdue',
      headClassName: 'min-w-[90px] text-center',
      className: 'text-center',
      render: (value) => (
        <span className="inline-flex items-center justify-center rounded-md bg-red-50 px-2 py-1 font-semibold text-red-700 text-xs dark:bg-red-950/30 dark:text-red-400">
          {value as number}
        </span>
      ),
    },
    {
      key: 'completionRate',
      label: 'Due Rate',
      headClassName: 'min-w-[90px] text-center',
      className: 'text-center',
      render: (_value, row) => {
        const dueRate = getDueRate(row);
        const isHighDueRate = dueRate > 80;
        return (
          <span
            className={`inline-flex items-center justify-center rounded-md px-2 py-1 font-semibold text-xs ${
              isHighDueRate
                ? 'bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-400'
                : 'bg-gray-50 text-gray-700 dark:bg-gray-950/30 dark:text-gray-400'
            }`}
          >
            {dueRate.toFixed(0)}%
          </span>
        );
      },
    },
    {
      key: 'completionRate',
      label: 'Progress',
      headClassName: 'min-w-[150px]',
      render: (value) => {
        const completionPercentage = value as number;
        return (
          <div className="space-y-1">
            <Progress className="h-2" value={completionPercentage} />
            <div className="text-muted-foreground text-xs">
              {completionPercentage.toFixed(0)}% complete
            </div>
          </div>
        );
      },
    },
  ];

  return (
    <Card className="flex w-full flex-col overflow-hidden">
      <CardHeader className="pb-4">
        <div className="flex w-full flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0 flex-1">
            <CardTitle className="truncate">Project Task Overview</CardTitle>
            <CardDescription className="truncate">
              Track project progress and task completion
            </CardDescription>
          </div>
          <Select
            onValueChange={setSelectedProjectId}
            value={selectedProjectId}
          >
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue placeholder="Select project" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Projects</SelectItem>
              {projects?.map((project) => (
                <SelectItem key={project.id} value={project.id}>
                  {project.title}
                </SelectItem>
              ))}
              {projects && projects.length >= projectsLimit && (
                <button
                  className="relative flex w-full cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground"
                  onClick={(e) => {
                    e.preventDefault();
                    handleLoadMoreProjects();
                  }}
                  type="button"
                >
                  Load more...
                </button>
              )}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent className="flex-1 overflow-hidden">
        {isLoading && (
          <div className="flex h-[300px] items-center justify-center">
            <p className="text-muted-foreground">Loading...</p>
          </div>
        )}
        {!isLoading && (!overview || overview.projects.length === 0) && (
          <div className="flex h-[300px] items-center justify-center">
            <p className="text-muted-foreground">No projects found</p>
          </div>
        )}
        {!isLoading && overview && overview.projects.length > 0 && (
          <div className="space-y-4">
            {/* Table with AppTable component */}
            <div className="max-h-[400px] overflow-y-auto sm:max-h-[500px]">
              <AppTable
                columns={columns}
                data={overview.projects.map(
                  (project): ProjectTaskOverviewWithId => ({
                    ...project,
                    id: project.projectId,
                  })
                )}
                emptyMessage="No projects found"
                getRowClassName={(row) => {
                  const dueRate = getDueRate(row);
                  return dueRate > 80 ? 'bg-red-50/50 dark:bg-red-950/20' : '';
                }}
                loading={false}
              />
            </div>

            {/* Pagination Controls */}
            {overview.pagination && overview.pagination.totalPages > 1 && (
              <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
                <div className="flex items-center gap-4">
                  <div className="text-center text-muted-foreground text-sm sm:text-left">
                    <span className="hidden sm:inline">
                      Showing {(currentPage - 1) * pageLimit + 1} to{' '}
                      {Math.min(
                        currentPage * pageLimit,
                        overview.pagination.total
                      )}{' '}
                      of {overview.pagination.total} projects
                    </span>
                    <span className="sm:hidden">
                      {(currentPage - 1) * pageLimit + 1}-
                      {Math.min(
                        currentPage * pageLimit,
                        overview.pagination.total
                      )}{' '}
                      of {overview.pagination.total}
                    </span>
                  </div>
                  <Select
                    onValueChange={(value) =>
                      handlePageLimitChange(Number.parseInt(value, 10))
                    }
                    value={pageLimit.toString()}
                  >
                    <SelectTrigger className="h-8 w-[70px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5">5</SelectItem>
                      <SelectItem value="10">10</SelectItem>
                      <SelectItem value="20">20</SelectItem>
                      <SelectItem value="50">50</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    disabled={currentPage === 1}
                    onClick={handlePreviousPage}
                    size="sm"
                    variant="outline"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    <span className="hidden sm:inline">Previous</span>
                  </Button>
                  <div className="text-muted-foreground text-sm">
                    Page {currentPage} of {overview.pagination.totalPages}
                  </div>
                  <Button
                    disabled={currentPage === overview.pagination.totalPages}
                    onClick={handleNextPage}
                    size="sm"
                    variant="outline"
                  >
                    <span className="hidden sm:inline">Next</span>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
