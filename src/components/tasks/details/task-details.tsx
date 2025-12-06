'use client';
import { useRouter } from 'nextjs-toploader/app';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/use-auth';
import api from '@/lib/api';
import type { TaskData } from '@/types/task';
import TaskActivity from './activity-section';
import TaskAssignees from './assign-task';
import TaskDateRange from './date-range-select';
import TaskDependencies from './dependent-tasks';
import TaskDetailsHeader from './header-section';
import TaskMeta from './meta-section';
import TaskFiles from './task-files';
import TaskRequestsTab from './task-request-tab';

export default function TaskDetails({ id }: { id: string }) {
  const [taskData, setTaskData] = useState<TaskData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [permissions, setPermissions] = useState({
    canAssignTask: false,
    canDeadlineChange: false,
    canUpdateTask: false,
    canDeleteTask: false,
    canViewRequest: false,
    canCreateRequest: false,
    canUpdateRequest: false,
    canDeleteRequest: false,
  });
  const { hasPermission } = useAuth();
  const router = useRouter();

  const fetchTaskData = useCallback(async () => {
    try {
      setLoading(true);

      const response = await api.get(`/api/tasks/${id}`);

      if (response.data.success) {
        setTaskData(response.data.data);
      } else {
        toast.error(response.data.message || 'Failed to fetch task');
      }
    } catch (err) {
      toast.error(`Something went wrong. Please try again. ${err}`);
    } finally {
      setLoading(false);
    }
  }, [id]);

  /*
   * check permission of the current user for the task with less complexity code.
   */
  const checkPermission = useCallback(async () => {
    const permissionConfig = [
      { resource: 'TASK', action: 'TASK-REASSIGN', stateKey: 'canAssignTask' },
      {
        resource: 'TASK',
        action: 'TASK-DEADLINE-CHANGE',
        stateKey: 'canDeadlineChange',
      },
      { resource: 'TASK', action: 'TASK-UPDATE', stateKey: 'canUpdateTask' },
      { resource: 'TASK', action: 'TASK-DELETE', stateKey: 'canDeleteTask' },
      {
        resource: 'TASK_REQUEST',
        action: 'TASK-REQUEST-CREATE',
        stateKey: 'canCreateRequest',
      },
      {
        resource: 'TASK_REQUEST',
        action: 'TASK-REQUEST-UPDATE',
        stateKey: 'canUpdateRequest',
      },
      {
        resource: 'TASK_REQUEST',
        action: 'TASK-REQUEST-DELETE',
        stateKey: 'canDeleteRequest',
      },
      {
        resource: 'TASK_REQUEST',
        action: 'TASK-REQUEST-VIEW',
        stateKey: 'canViewRequest',
      },
    ] as const;

    // Execute all permission checks in parallel
    const permissionPromises = permissionConfig?.map(({ action }) =>
      hasPermission(action)
    );
    const results = await Promise.all(permissionPromises);

    const newPermissions: Record<string, boolean> = {};
    for (let i = 0; i < permissionConfig.length; i++) {
      const hasPermissionResult = results[i] ?? false;
      newPermissions[permissionConfig[i].stateKey] = hasPermissionResult;
    }

    setPermissions((prev) => ({
      ...prev,
      ...newPermissions,
    }));
  }, [hasPermission]);

  useEffect(() => {
    fetchTaskData();
    checkPermission();
  }, [fetchTaskData, checkPermission]);

  const proceedingTasks =
    taskData?.proceedingTasks?.map(({ proceedingTask }) => ({
      id: proceedingTask.id,
      title: proceedingTask.title,
    })) ?? [];

  const succeedingTasks =
    taskData?.succeedingTasks?.map(({ succeedingTask }) => ({
      id: succeedingTask.id,
      title: succeedingTask.title,
    })) ?? [];

  return (
    <div className="w-full space-y-6 ">
      <TaskDetailsHeader
        hasDeletePermission={permissions.canDeleteTask}
        hasUpdatePermission={permissions.canUpdateTask}
        loading={loading}
        onDelete={() => {
          router.back();
        }}
        onEdit={() => {
          fetchTaskData();
        }}
        taskData={taskData}
        taskId={id}
      />

      <div className="flex items-center justify-between gap-3">
        <TaskMeta
          category={taskData?.mainTask as { id: string; name: string }}
          endDate={taskData?.endDate ? new Date(taskData.endDate) : null}
          task={taskData as TaskData}
          taskAssigneeUserId={taskData?.employee?.user?.id as string}
          taskNo={taskData?.taskNo as string}
        />
      </div>

      <Tabs defaultValue="details">
        <TabsList>
          <TabsTrigger value="details">Details</TabsTrigger>
          {permissions.canViewRequest && (
            <TabsTrigger value="requests">
              Requests
              {(taskData?.taskRequest?.length as number) > 0 && (
                <span className="ml-2 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-primary/80 px-1 text-primary-foreground text-xs">
                  {taskData?.taskRequest?.length}
                </span>
              )}
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent className="mt-6 space-y-6" value="details">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <TaskAssignees
              assignedUserId={taskData?.employee?.user?.id as string}
              reassignPermission={permissions.canAssignTask}
              taskId={taskData?.id as string}
            />

            {permissions.canDeadlineChange && (
              <TaskDateRange
                endDate={taskData?.endDate ? new Date(taskData?.endDate) : null}
                taskId={taskData?.id as string}
              />
            )}
          </div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <TaskDependencies
              preceding={proceedingTasks}
              succeeding={succeedingTasks}
            />

            <TaskFiles files={taskData?.files ?? []} />
          </div>

          <TaskActivity
            taskAssigneeUserId={taskData?.employee?.user?.id as string}
            taskId={id}
          />
        </TabsContent>
        {permissions.canViewRequest && (
          <TabsContent className="mt-6" value="requests">
            <TaskRequestsTab
              hasCreatePermission={permissions.canCreateRequest}
              hasDeletePermission={permissions.canDeleteRequest}
              hasUpdatePermission={permissions.canUpdateRequest}
              taskId={id}
            />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
