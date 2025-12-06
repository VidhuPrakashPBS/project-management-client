'use client';

import { ArrowLeft, Edit3, Plus } from 'lucide-react';
import { notFound, useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { StatusSelect } from '@/components/status-badge';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/use-auth';
import api from '@/lib/api';
import { authClient } from '@/lib/auth-client';
import type { MainTask, PageParams } from '@/types/main-task';
import { CreateSubTaskDialog } from './create-sub-task-dialog';
import { MainTaskEmptySubTasks } from './empty-task';
import { MainTaskActivitySection } from './main-task-activity-section';
import { LoadingSkeleton } from './main-task-loader';
import { MainTaskMeta } from './main-task-meta';
import { MainTaskSubTasks } from './main-task-sub-tasks';
import { UpdateMainTaskDialog } from './update-main-task';

export default function MainTaskDetails({ id }: PageParams) {
  const [mainTask, setMainTask] = useState<MainTask | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [status, setStatus] = useState<string>('');
  const [updating, setUpdating] = useState<boolean>(false);
  const router = useRouter();
  const [hasEditPermisson, setHasEditPermission] = useState<boolean>(false);
  const [hasCreatePermission, setHasCreatePermission] =
    useState<boolean>(false);
  const { hasPermission } = useAuth();

  const fetchPermissions = useCallback(() => {
    const permissions = hasPermission('MAIN-TASK-UPDATE');
    const taskCreatePermission = hasPermission('MAIN-TASK-CREATE');
    setHasCreatePermission(taskCreatePermission);
    setHasEditPermission(permissions);
  }, [hasPermission]);

  const fetchMainTask = useCallback(async () => {
    if (!id) {
      toast.error('Main task ID is required');
      notFound();
      return;
    }

    try {
      setLoading(true);
      const response = await api.get(`/api/maintask/${id}`);

      if (response.data.success) {
        setMainTask(response.data.data);
        setStatus(response.data.data.status);
      } else {
        toast.error(response.data.message || 'Failed to fetch main task');
        notFound();
      }
    } catch (error) {
      toast.error(`Failed to fetch main task: ${error}`);
      router.back();
    } finally {
      setLoading(false);
    }
  }, [id, router]);

  /**
   * Updates the status of the main task.
   * @param {string} newStatus - The new status of the main task.
   * @returns {Promise<void>} - A promise that resolves when the main task status is updated successfully.
   * @throws {Error} - If the main task status update fails.
   */
  const updateMainTaskStatus = async (newStatus: string) => {
    if (!mainTask || updating) {
      return;
    }

    try {
      setUpdating(true);

      const user = await authClient.getSession();
      if (!user.data?.user?.id) {
        toast.error('You must be logged in to update tasks');
        return;
      }

      const formData = new FormData();
      formData.append('id', mainTask.id);
      formData.append('title', mainTask.title);
      formData.append('description', mainTask.description);
      formData.append('status', newStatus);
      formData.append('userId', user.data.user.id);

      const response = await api.patch('/api/maintask', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.success) {
        setStatus(newStatus);
        setMainTask((prev) => (prev ? { ...prev, status: newStatus } : null));
        toast.success('Status updated successfully');
      } else {
        toast.error(response.data.message || 'Failed to update status');
      }
    } catch (error) {
      toast.error(`Failed to update status: ${error}`);
    } finally {
      setUpdating(false);
    }
  };

  /**
   * Fetches the main task again after a task has been created.
   */
  const handleTaskCreated = () => {
    fetchMainTask();
  };

  useEffect(() => {
    fetchMainTask();
    fetchPermissions();
  }, [fetchMainTask, fetchPermissions]);

  if (loading) {
    return <LoadingSkeleton />;
  }

  const tasksCount = mainTask?.tasks?.length || 0;

  return (
    <div className="container">
      <div className="mb-6 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div className="items-center gap-4 md:flex">
          <Button onClick={() => router.back()} size="icon" variant="outline">
            <ArrowLeft className="h-4 w-4" />
          </Button>

          <div>
            <h1 className="font-bold text-3xl">{mainTask?.title}</h1>
            <p className="text-muted-foreground">{mainTask?.description}</p>
          </div>
        </div>
        <div className="items-center gap-2 space-y-2 md:flex md:space-y-0">
          {hasEditPermisson && (
            <>
              <StatusSelect
                disabled={updating}
                onChange={updateMainTaskStatus}
                value={status}
              />
              <UpdateMainTaskDialog
                mainTask={mainTask as MainTask}
                onTaskUpdated={fetchMainTask}
              >
                <Button size="sm" variant="outline">
                  <Edit3 className="mr-2 h-4 w-4" />
                  Edit
                </Button>
              </UpdateMainTaskDialog>
            </>
          )}
          {tasksCount > 0 && hasCreatePermission && (
            <CreateSubTaskDialog
              mainTaskId={id}
              onTaskCreated={handleTaskCreated}
            >
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Sub-task
              </Button>
            </CreateSubTaskDialog>
          )}
        </div>
      </div>

      <MainTaskMeta
        description={mainTask?.description}
        files={mainTask?.files || []}
        project={mainTask?.project?.title ?? ''}
        startDate={mainTask?.createdAt as string}
        subTaskCount={mainTask?.tasks.length || 0}
        title="Main Task Details"
      />

      <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-2">
        {tasksCount > 0 && (
          <MainTaskSubTasks
            mainTaskId={id}
            mainTaskName={mainTask?.title as string}
          />
        )}
        {tasksCount === 0 && (
          <MainTaskEmptySubTasks
            mainTaskId={id}
            onTaskCreated={handleTaskCreated}
            permission={hasCreatePermission}
            projectId={mainTask?.projectId as string}
          />
        )}
        <MainTaskActivitySection mainTaskId={id} />
      </div>
    </div>
  );
}
