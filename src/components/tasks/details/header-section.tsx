'use client';

import { AlertTriangle, ArrowLeft, Edit, Trash2 } from 'lucide-react';
import { useRouter } from 'nextjs-toploader/app';
import { useState } from 'react';
import { toast } from 'sonner';
import EditSubTaskDialog from '@/components/task-category/details/edit-sub-task-dialog';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import api from '@/lib/api';
import type { TaskData } from '@/types/task';

export default function TaskDetailsHeader({
  taskId,
  onEdit,
  loading,
  taskData,
  onDelete,
  hasDeletePermission,
  hasUpdatePermission,
}: {
  taskId: string;
  onEdit: () => void;
  onDelete: () => void;
  loading: boolean;
  taskData: TaskData | null;
  hasDeletePermission: boolean;
  hasUpdatePermission: boolean;
}) {
  const router = useRouter();
  const [openConfirm, setOpenConfirm] = useState<boolean>(false);
  const [deleting, setDeleting] = useState<boolean>(false);

  /**
   * Handles deletion of a task by calling the deleteTask API and updating the task list after a successful deletion.
   * If the user does not have permission to delete the task, it throws an error.
   * If the deletion fails, it throws an error and displays a toast with the error message.
   * After a successful deletion, it navigates back to the previous page.
   * @returns {Promise<void>}
   */
  const handleConfirmDelete = async () => {
    try {
      setDeleting(true);
      if (!hasDeletePermission) {
        throw new Error('You do not have permission to delete this task');
      }

      const response = await api.delete(`/api/tasks/${taskId}`);

      if (!response.data?.success) {
        throw new Error(response.data?.message || 'Failed to delete task');
      }

      await onDelete();

      setOpenConfirm(false);

      router.back();
    } catch (err) {
      toast.error(`Something went wrong. Please try again. ${err}`);
    } finally {
      setDeleting(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="h-8 w-8 animate-spin rounded-full border-primary border-b-2" />
      </div>
    );
  }

  // Task not found
  if (!taskData) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        Task not found
      </div>
    );
  }

  const { title, mainTask } = taskData;

  return (
    <div className="items-center gap-4 md:flex">
      <Button onClick={() => router.back()} size="icon" variant="outline">
        <ArrowLeft className="h-4 w-4" />
      </Button>
      <div className="flex-grow">
        <h1 className="max-w-full truncate font-bold text-3xl">{title}</h1>
        <p className="text-muted-foreground">
          <span className="max-w-full truncate font-semibold text-primary">
            main task : {mainTask?.name}
          </span>
        </p>
      </div>
      <div className="flex items-center gap-2">
        {hasUpdatePermission && (
          <EditSubTaskDialog onTaskUpdated={onEdit} taskId={taskId}>
            <button
              aria-label="Edit sub-task"
              className="inline-flex h-8 w-8 items-center justify-center rounded-md border bg-background transition-colors hover:bg-accent hover:text-accent-foreground"
              type="button"
            >
              <Edit className="h-4 w-4" />
            </button>
          </EditSubTaskDialog>
        )}

        {hasUpdatePermission && (
          <Dialog onOpenChange={setOpenConfirm} open={openConfirm}>
            <DialogTrigger asChild>
              <Button
                aria-label="Delete task"
                disabled={deleting || loading}
                size="icon"
                variant="destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-amber-500" />
                  Confirm deletion
                </DialogTitle>
                <DialogDescription>
                  This action cannot be undone. This will permanently delete
                  task{' '}
                  <span className="font-semibold text-foreground">{title}</span>{' '}
                  and its related data.
                </DialogDescription>
              </DialogHeader>

              <div className="rounded-md border border-border/50 bg-background/50 p-3 text-sm">
                <p>
                  Are you sure to delete{' '}
                  <span className="font-medium">{title}</span>?
                </p>
                <p className="mt-1 text-muted-foreground text-xs">
                  Consider archiving instead if the task may be needed later.
                </p>
              </div>

              <DialogFooter className="gap-2 sm:gap-0">
                <DialogClose asChild>
                  <Button disabled={deleting} type="button" variant="outline">
                    No, keep task
                  </Button>
                </DialogClose>
                <Button
                  className="min-w-28"
                  disabled={deleting}
                  onClick={handleConfirmDelete}
                  type="button"
                  variant="destructive"
                >
                  {deleting ? 'Deleting...' : 'Yes, delete'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </div>
  );
}
