'use client';

import { useCallback, useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/use-auth';
import { authClient } from '@/lib/auth-client';
import type { TaskData } from '@/types/task';
import TaskStatusControl from './status-section';

export default function TaskMeta({
  taskNo,
  category,
  endDate,
  task,
  taskAssigneeUserId,
}: {
  taskNo: string;
  category: {
    id: string;
    name: string;
  };
  task: TaskData;
  endDate: Date | null;
  taskAssigneeUserId: string;
}) {
  const [hasStatusUpdatePermission, setHasStatusUpdatePermission] =
    useState<boolean>(false);
  const { hasPermission } = useAuth();

  const fetchPermissions = useCallback(() => {
    const statusUpdatePermission = hasPermission('TASK-UPDATE-STATUS');
    setHasStatusUpdatePermission(statusUpdatePermission);
  }, [hasPermission]);
  const [canPerformStatusChange, setCanPerformStatusChange] =
    useState<boolean>(false);

  useEffect(() => {
    /**
     * Checks if the current user has permission to update the task status.
     * It checks if the current user is the same as the task assignee user ID,
     * or if the current user is an admin or workingManager.
     * If the current user has permission, it sets canPerformStatusChange to true.
     * @returns {Promise<void>} - A promise that resolves when the permission check is done.
     */
    const fetchSessionAndCheck = async () => {
      const authSession = await authClient.getSession();
      const authUserId = authSession.data?.user?.id;
      const authUserRole = authSession.data?.user?.role;

      if (taskAssigneeUserId === authUserId || authUserRole === 'admin') {
        setCanPerformStatusChange(true);
      }
    };

    fetchSessionAndCheck();
  }, [taskAssigneeUserId]);

  useEffect(() => {
    fetchPermissions();
  }, [fetchPermissions]);
  return (
    <Card className="w-full border-border/50 bg-card/50 backdrop-blur-sm">
      <CardHeader className="py-3">
        <div className="justify-between md:flex">
          <CardTitle className="items-center gap-10 truncate text-base md:flex">
            {task?.title}
          </CardTitle>
          {hasStatusUpdatePermission && canPerformStatusChange && (
            <TaskStatusControl taskId={task?.id} value={task?.status} />
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        <div>
          <span className="text-muted-foreground">No:</span>{' '}
          <strong>{taskNo}</strong>
        </div>
        <div>
          <span className="text-muted-foreground">Description:</span>{' '}
          <strong>{task?.description}</strong>
        </div>
        <div>
          <span className="text-muted-foreground">Category:</span>{' '}
          <strong>{category?.name}</strong>
        </div>
        <div>
          <span className="text-muted-foreground">End date:</span>{' '}
          <strong>{endDate ? endDate?.toDateString() : '—'}</strong>
        </div>
      </CardContent>
    </Card>
  );
}
