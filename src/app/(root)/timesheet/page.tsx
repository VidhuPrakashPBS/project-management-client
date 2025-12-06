'use client';
import { format } from 'date-fns';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import AddTimesheetForm from '@/components/time-sheet/add-time-sheet-form';
import type { UpdateTimesheetData } from '@/components/time-sheet/edit-timesheet-dialogbox';
import EditTimesheetDialog from '@/components/time-sheet/edit-timesheet-dialogbox';
import TimesheetList, {
  type TimesheetEntry,
} from '@/components/time-sheet/list-time-sheet';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/hooks/use-auth';
import api from '@/lib/api';
import { authClient } from '@/lib/auth-client';
import type {
  ApiListResponse,
  DailySheetApiResponse,
  DailySheetMainTask,
  DailySheetPayload,
  DailySheetProject,
  DailySheetTask,
  Session,
  TimesheetFormData,
} from '@/types/dailysheet';

export default function TimesheetPage() {
  const [session, setSession] = useState<Session | null>(null);
  const [isSessionLoading, setIsSessionLoading] = useState(true);

  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [selectedMainTask, setSelectedMainTask] = useState<string>('');
  const [dateRangeFilter, setDateRangeFilter] = useState<string>('');
  const [selectedUser, setSelectedUser] = useState<string>('all');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const [projects, setProjects] = useState<DailySheetProject[]>([]);
  const [mainTasks, setMainTasks] = useState<DailySheetMainTask[]>([]);
  const [tasks, setTasks] = useState<DailySheetTask[]>([]);
  const [timesheets, setTimesheets] = useState<TimesheetEntry[]>([]);

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isFetchingProjects, setIsFetchingProjects] = useState<boolean>(false);
  const [isFetchingMainTasks, setIsFetchingMainTasks] =
    useState<boolean>(false);
  const [isFetchingTasks, setIsFetchingTasks] = useState<boolean>(false);
  const [isFetchingTimesheets, setIsFetchingTimesheets] =
    useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [isEditDialogOpen, setIsEditDialogOpen] = useState<boolean>(false);
  const [selectedTimesheet, setSelectedTimesheet] =
    useState<TimesheetEntry | null>(null);

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });
  const [permissions, setPermissions] = useState<{
    create: boolean;
    edit: boolean;
    delete: boolean;
    view: boolean;
    specialFilter: boolean;
  }>({
    create: false,
    edit: false,
    delete: false,
    view: false,
    specialFilter: false,
  });
  const { hasPermission } = useAuth();

  const totalHours = timesheets.reduce((sum, entry) => sum + entry.hours, 0);

  useEffect(() => {
    authClient.getSession().then((result) => {
      setSession(
        result.data?.user
          ? {
              user: {
                ...result.data.user,
                image: result.data.user.image ?? null,
                role: result.data.user.role ?? '',
                organisationId:
                  (result.data.user as { organisationId?: string })
                    .organisationId ?? '',
              },
            }
          : null
      );
      setIsSessionLoading(false);
    });
  }, []);

  // Fetch Projects
  useEffect(() => {
    const fetchProjects = async () => {
      if (!session?.user?.id) {
        return;
      }

      setIsFetchingProjects(true);
      setError(null);

      try {
        const response = await api.get('/api/project', {
          params: {
            userId: session.user.id,
          },
        });

        if (response.data.success && response.data.data) {
          setProjects(response.data.data.data);
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to fetch projects';
        setError(errorMessage);
      } finally {
        setIsFetchingProjects(false);
      }
    };

    if (session?.user?.id) {
      fetchProjects();
    }
  }, [session?.user?.id]);

  // Fetch Main Tasks
  useEffect(() => {
    const fetchMainTasks = async () => {
      if (!selectedProject) {
        setMainTasks([]);
        return;
      }

      setIsFetchingMainTasks(true);
      setError(null);

      try {
        const response = await api.get('/api/maintask', {
          params: {
            projectId: selectedProject,
          },
        });

        if (response.data.success && response.data.data) {
          const transformedMainTasks = response?.data?.data?.map(
            (mainTask: DailySheetMainTask) => ({
              id: mainTask.id,
              title: mainTask.title,
              projectId: selectedProject,
            })
          );
          setMainTasks(transformedMainTasks);
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to fetch main tasks';
        setError(errorMessage);
      } finally {
        setIsFetchingMainTasks(false);
      }
    };

    fetchMainTasks();
  }, [selectedProject]);

  // Fetch Tasks
  const fetchTasks = useCallback(async () => {
    if (!(selectedProject && selectedMainTask && session?.user?.id)) {
      setTasks([]);
      return;
    }

    setIsFetchingTasks(true);
    setError(null);

    try {
      const response = await api.get('/api/tasks', {
        params: {
          projectId: selectedProject,
          mainTaskId: selectedMainTask,
          assignedTo: session.user.id,
        },
      });

      if (response.data.success && response.data.data) {
        const transformedTasks = response?.data?.data?.map(
          (task: DailySheetTask) => ({
            id: task.id,
            title: task.title,
            mainTaskId: selectedMainTask,
          })
        );

        setTasks(transformedTasks);
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to fetch tasks';
      setError(errorMessage);
    } finally {
      setIsFetchingTasks(false);
    }
  }, [selectedProject, selectedMainTask, session?.user?.id]);

  const fetchPermissions = useCallback(() => {
    if (!session?.user?.id) {
      return;
    }

    const createPermission = hasPermission('TIME-SHEET-CREATE');

    const editPermission = hasPermission('TIME-SHEET-UPDATE');

    const deletePermission = hasPermission('TIME-SHEET-DELETE');
    const viewPermission = hasPermission('TIME-SHEET-VIEW');
    const employeesFilterPermission = hasPermission(
      'TIME-SHEET-EMPLOYEES-FILTER'
    );

    const perm = {
      create: (createPermission as boolean) ?? false,
      edit: (editPermission as boolean) ?? false,
      delete: (deletePermission as boolean) ?? false,
      view: (viewPermission as boolean) ?? false,
      specialFilter: (employeesFilterPermission as boolean) ?? false,
    };

    setPermissions(perm);
  }, [session?.user?.id, hasPermission]);

  useEffect(() => {
    fetchTasks();
    fetchPermissions();
  }, [fetchTasks, fetchPermissions]);

  // Helper function to determine if user has privileged role
  const isPrivilegedRole = useCallback((role: string | undefined): boolean => {
    return role === 'owner' || role === 'admin' || role === 'workingOwner';
  }, []);

  // Helper function to add user filter params
  const addUserParams = useCallback(
    (params: Record<string, string | number>): void => {
      const userHasPrivileges = isPrivilegedRole(session?.user?.role as string);

      if (!userHasPrivileges) {
        params.userId = session?.user?.id as string;
      } else if (selectedUser && selectedUser !== 'all') {
        params.userId = selectedUser;
      }
    },
    [isPrivilegedRole, session?.user?.role, session?.user?.id, selectedUser]
  );

  // Helper function to add date filter params
  const addDateParams = useCallback(
    (params: Record<string, string | number>): void => {
      if (selectedDate) {
        const formattedDate = format(selectedDate, 'yyyy-MM-dd');
        params.dateFrom = formattedDate;
        params.dateTo = formattedDate;
        return;
      }

      if (dateRangeFilter) {
        const today = new Date();
        if (dateRangeFilter === 'week') {
          const weekStart = new Date(today);
          weekStart.setDate(today.getDate() - 7);
          params.dateFrom = format(weekStart, 'yyyy-MM-dd');
        } else if (dateRangeFilter === 'month') {
          const monthStart = new Date(today);
          monthStart.setMonth(today.getMonth() - 1);
          params.dateFrom = format(monthStart, 'yyyy-MM-dd');
        }
        params.dateTo = format(new Date(), 'yyyy-MM-dd');
      }
    },
    [selectedDate, dateRangeFilter]
  );

  // Helper function to build API parameters
  const buildTimesheetParams = useCallback((): Record<
    string,
    string | number
  > => {
    const params: Record<string, string | number> = {
      organisationId: session?.user?.organisationId as string,
      page: pagination.page as number,
      limit: pagination.limit as number,
    };

    addUserParams(params);
    addDateParams(params);

    if (selectedProject) {
      params.projectId = selectedProject;
    }
    if (selectedMainTask) {
      params.mainTaskId = selectedMainTask;
    }

    return params;
  }, [
    session?.user?.organisationId,
    pagination.page,
    pagination.limit,
    selectedProject,
    selectedMainTask,
    addUserParams,
    addDateParams,
  ]);

  // Helper function to transform half day leave type
  const transformHalfDayLeaveTypeFromApi = useCallback(
    (leaveType: 'first_half' | 'second_half' | null) => {
      if (leaveType === 'first_half') {
        return 'firstHalf';
      }
      if (leaveType === 'second_half') {
        return 'secondHalf';
      }
      return;
    },
    []
  );

  // Helper function to transform API response to TimesheetEntry
  const transformTimesheetEntry = useCallback(
    (item: DailySheetApiResponse): TimesheetEntry => ({
      id: item.id,
      projectId: item.projectId || '',
      projectName: item.project?.title || 'N/A',
      mainTaskId: item.mainTaskId || '',
      mainTaskName: item.mainTask?.title || 'N/A',
      taskId: item.taskId || undefined,
      taskName: item.task?.title || undefined,
      userName: item.userName || 'N/A',
      userId: item.userId,
      hours: Number.parseFloat(item.hours) || 0,
      description: item.description || '',
      onFullDayLeave: item.onFullDayLeave,
      onHalfDayLeave: item.onHalfDayLeave,
      halfDayLeaveType: transformHalfDayLeaveTypeFromApi(item.halfDayLeaveType),
      date: new Date(item.date),
      createdAt: new Date(item.createdAt),
      updatedAt: new Date(item.updatedAt),
    }),
    [transformHalfDayLeaveTypeFromApi]
  );

  // Helper function to sort timesheets
  const sortTimesheets = useCallback(
    (entries: TimesheetEntry[]): TimesheetEntry[] => {
      return entries.sort((a, b) => {
        const dateA = new Date(a.date).getTime();
        const dateB = new Date(b.date).getTime();
        return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
      });
    },
    [sortOrder]
  );

  // Fetch Timesheets
  const fetchTimesheets = useCallback(async () => {
    if (!session?.user?.id) {
      return;
    }

    setIsFetchingTimesheets(true);
    setError(null);

    try {
      const params = buildTimesheetParams();
      const response = await api.get<ApiListResponse<DailySheetApiResponse>>(
        '/api/daily-sheet',
        { params }
      );

      if (response.data.success && response.data.data) {
        const transformedTimesheets = response?.data?.data?.map(
          transformTimesheetEntry
        );
        const sortedTimesheets = sortTimesheets(transformedTimesheets);

        setTimesheets(sortedTimesheets);

        if (response.data.pagination) {
          setPagination(response.data.pagination);
        }
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to fetch timesheets';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsFetchingTimesheets(false);
    }
  }, [
    session?.user?.id,
    buildTimesheetParams,
    transformTimesheetEntry,
    sortTimesheets,
  ]);

  useEffect(() => {
    fetchTimesheets();
  }, [fetchTimesheets]);

  /**
   * Returns a success message based on the provided TimesheetFormData.
   */
  const getSuccessMessage = (data: TimesheetFormData): string => {
    if (data.onFullDayLeave) {
      return 'Full day leave recorded successfully!';
    }
    if (data.onHalfDayLeave) {
      return 'Half day leave and timesheet entry added successfully!';
    }
    return 'Timesheet entry added successfully!';
  };

  /**
   * Builds a DailySheetPayload object from the provided TimesheetFormData.
   */
  const buildPayload = (
    data: TimesheetFormData,
    userId: string,
    organisationId: string
  ): DailySheetPayload => {
    const payload: DailySheetPayload = {
      userId,
      organisationId,
      date: data.date.toString(),
      hours: data.hours.toString(),
      description: data.description,
      onFullDayLeave: data.onFullDayLeave,
      onHalfDayLeave: data.onHalfDayLeave,
    };

    if (data.onHalfDayLeave && data.halfDayLeaveType) {
      payload.halfDayLeaveType =
        data.halfDayLeaveType === 'firstHalf' ? 'first_half' : 'second_half';
    }

    if (!data.onFullDayLeave) {
      payload.projectId = data.projectId;
      payload.mainTaskId = data.mainTaskId;

      if (data.taskId) {
        payload.taskId = data.taskId;
      }
    }

    return payload;
  };

  /**
   * Submits a daily sheet entry to the backend API.
   */
  const handleTimesheetSubmit = async (data: TimesheetFormData) => {
    setIsLoading(true);
    setError(null);

    try {
      const payload = buildPayload(
        data,
        session?.user?.id as string,
        session?.user?.organisationId || ''
      );

      const response = await api.post('/api/daily-sheet', payload);

      if (response.data.success) {
        const successMessage = getSuccessMessage(data);
        toast.success(successMessage);

        // Refetch timesheets after successful submission
        await fetchTimesheets();
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to submit daily sheet';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditTimesheet = (timesheet: TimesheetEntry) => {
    setSelectedTimesheet(timesheet);
    setIsEditDialogOpen(true);
  };

  // Helper function to transform half day leave type
  const transformHalfDayLeaveType = (leaveType: 'firstHalf' | 'secondHalf') => {
    return leaveType === 'firstHalf' ? 'first_half' : 'second_half';
  };

  // Helper function to build base payload
  const buildBasePayload = (data: UpdateTimesheetData) => ({
    id: data.id,
    date: format(new Date(data.date), 'yyyy-MM-dd'),
    description: data.description,
    hours: data.hours.toString(),
    onFullDayLeave: data.onFullDayLeave,
    onHalfDayLeave: data.onHalfDayLeave,
  });

  // Helper function to add half day leave type
  const addHalfDayLeaveType = (
    payload: Record<string, unknown>,
    data: UpdateTimesheetData
  ) => {
    if (data.onHalfDayLeave && data.halfDayLeaveType) {
      payload.halfDayLeaveType = transformHalfDayLeaveType(
        data.halfDayLeaveType
      );
    }
  };

  // Helper function to add project fields
  const addProjectFields = (
    payload: Record<string, unknown>,
    data: UpdateTimesheetData
  ) => {
    if (!data.onFullDayLeave) {
      payload.projectId = data.projectId;
      payload.mainTaskId = data.mainTaskId;

      if (data.taskId) {
        payload.taskId = data.taskId;
      }
    }
  };

  // Helper function to build complete update payload
  const buildUpdatePayload = (
    data: UpdateTimesheetData
  ): Record<string, unknown> => {
    const payload = buildBasePayload(data);
    addHalfDayLeaveType(payload, data);
    addProjectFields(payload, data);
    return payload;
  };

  // Helper function to handle success
  const handleUpdateSuccess = async (
    setEditDialogOpen: (open: boolean) => void,
    setTimesheet: (timesheet: null) => void,
    refetchTimesheets: () => Promise<void>
  ) => {
    toast.success('Timesheet updated successfully!');
    setEditDialogOpen(false);
    setTimesheet(null);
    await refetchTimesheets();
  };

  // Helper function to handle error
  const handleUpdateError = (
    err: unknown,
    setErrorState: (errorMessage: string) => void
  ) => {
    const errorMessage =
      err instanceof Error ? err.message : 'Failed to update timesheet';
    setErrorState(errorMessage);
    toast.error(errorMessage);
  };

  // Simplified main function
  const handleUpdateTimesheet = async (data: UpdateTimesheetData) => {
    if (!data.id) {
      toast.error('Timesheet ID is required');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const updatePayload = buildUpdatePayload(data);

      const response = await api.put(
        `/api/daily-sheet/${data.id}`,
        updatePayload
      );

      if (response.data.success) {
        await handleUpdateSuccess(
          setIsEditDialogOpen,
          setSelectedTimesheet,
          fetchTimesheets
        );
      }
    } catch (err) {
      handleUpdateError(err, setError);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteTimesheet = async (id: string) => {
    try {
      setIsLoading(true);
      await api.delete(`/api/daily-sheet/${id}`);
      toast.success('Timesheet entry deleted successfully');

      // Refetch timesheets
      await fetchTimesheets();
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to delete timesheet entry';
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleProjectFilter = (projectId: string) => {
    setSelectedProject(projectId);
    setSelectedMainTask('');
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handleMainTaskSelect = (mainTaskId: string) => {
    setSelectedMainTask(mainTaskId);
  };

  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date);
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handleDateRangeFilter = (range: string) => {
    setDateRangeFilter(range);
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handleUserFilter = (userId: string) => {
    setSelectedUser(userId);
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handleSortChange = (sort: string) => {
    setSortOrder(sort as 'asc' | 'desc');
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handlePageChange = (newPage: number) => {
    setPagination((prev) => ({ ...prev, page: newPage }));
  };

  if (isSessionLoading) {
    return (
      <div className="flex flex-col gap-4">
        {/* Header */}
        <div>
          <Skeleton className="mb-2 h-8 w-64" />
          <Skeleton className="h-4 w-48" />
        </div>

        {/* Add Timesheet Form Skeleton */}
        <div className="space-y-4 rounded-lg border bg-card p-6">
          <Skeleton className="mb-4 h-6 w-48" />

          {/* Form fields in grid */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-10 w-full" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-10 w-full" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-10 w-full" />
            </div>
          </div>

          {/* Date and Hours row */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            <div className="space-y-2">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-10 w-full" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-10 w-full" />
            </div>
            <div className="flex items-end">
              <Skeleton className="h-10 w-32" />
            </div>
            <div className="flex items-end">
              <Skeleton className="h-10 w-32" />
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-24 w-full" />
          </div>

          {/* Submit button */}
          <div className="flex justify-end">
            <Skeleton className="h-10 w-32" />
          </div>
        </div>

        {/* Timesheet List Skeleton */}
        <div className="rounded-lg border bg-card">
          {/* Filters bar */}
          <div className="border-b p-4">
            <div className="flex flex-wrap gap-2">
              <Skeleton className="h-10 w-40" />
              <Skeleton className="h-10 w-40" />
              <Skeleton className="h-10 w-40" />
              <Skeleton className="h-10 w-32" />
            </div>
          </div>

          {/* Stats */}
          <div className="border-b p-4">
            <div className="flex items-center justify-between">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-6 w-32" />
            </div>
          </div>

          {/* Table skeleton */}
          <div className="space-y-3 p-4">
            {[...new Array(5)]?.map((_, i) => (
              <div
                className="flex items-center justify-between rounded-lg border p-4"
                key={`skeleton-${i as number}`}
              >
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-4">
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="h-5 w-24" />
                    <Skeleton className="h-5 w-28" />
                  </div>
                  <Skeleton className="h-4 w-full max-w-md" />
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-4 w-16" />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Skeleton className="h-8 w-8" />
                  <Skeleton className="h-8 w-8" />
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          <div className="border-t p-4">
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-32" />
              <div className="flex gap-2">
                <Skeleton className="h-10 w-24" />
                <Skeleton className="h-10 w-24" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!session?.user?.id) {
    return (
      <div className="flex items-center justify-center p-8">
        <p>Please sign in to access timesheet management.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="font-bold text-2xl">Timesheet Management</h1>
        <span className="text-muted-foreground">Manage your timesheet</span>
      </div>

      {error && (
        <div className="rounded border border-red-200 bg-red-50 px-4 py-3 text-red-800">
          {error}
        </div>
      )}

      <div className="flex flex-col gap-4">
        {permissions.create && (
          <AddTimesheetForm
            isLoading={
              isFetchingProjects || isFetchingMainTasks || isFetchingTasks
            }
            mainTasks={mainTasks}
            onMainTaskSelect={handleMainTaskSelect}
            onProjectSelect={handleProjectFilter}
            onSubmit={handleTimesheetSubmit}
            projects={projects}
            tasks={tasks}
          />
        )}

        {permissions.view && (
          <TimesheetList
            dateRangeFilter={dateRangeFilter}
            deletePermission={permissions.delete}
            editPermission={permissions.edit}
            isLoading={isFetchingTimesheets}
            onDateRangeFilter={handleDateRangeFilter}
            onDateSelect={handleDateSelect}
            onDelete={handleDeleteTimesheet}
            onEdit={handleEditTimesheet}
            onPageChange={handlePageChange}
            onProjectFilter={handleProjectFilter}
            onSortChange={handleSortChange}
            onUserFilter={handleUserFilter}
            pagination={pagination}
            projects={projects}
            selectedDate={selectedDate}
            selectedProject={selectedProject}
            selectedUser={selectedUser}
            sortOrder={sortOrder}
            timesheets={timesheets}
            topAccessFilter={permissions.specialFilter}
            totalHours={totalHours}
          />
        )}

        {permissions.edit && (
          <EditTimesheetDialog
            isLoading={isLoading}
            isOpen={isEditDialogOpen}
            onClose={() => {
              setIsEditDialogOpen(false);
              setSelectedTimesheet(null);
            }}
            onSave={handleUpdateTimesheet}
            projects={projects}
            timesheet={selectedTimesheet}
          />
        )}
      </div>
    </div>
  );
}
