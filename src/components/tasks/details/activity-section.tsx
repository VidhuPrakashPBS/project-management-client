'use client';

import { ScrollArea } from '@radix-ui/react-scroll-area';
import { Activity, Clock, Paperclip, Plus, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/hooks/use-auth';
import api from '@/lib/api';
import { authClient } from '@/lib/auth-client';
import type { ActivityFile } from '@/types/main-task';
import type { ActivityItem } from '@/types/task';

export default function TaskActivity({
  taskId,
  taskAssigneeUserId,
}: {
  taskId: string;
  taskAssigneeUserId: string;
}) {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState<boolean>(false);
  const [form, setForm] = useState<{
    title: string;
    content: string;
    date: string;
    user: string;
    files: File[];
    filePreviews: { id: string; name: string; file: File }[];
  }>({
    title: '',
    content: '',
    date: '',
    user: '',
    files: [],
    filePreviews: [],
  });
  const [canPerformStatusChange, setCanPerformStatusChange] =
    useState<boolean>(false);
  const { hasPermission } = useAuth();

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
      const permission = hasPermission('TASK-ACTIVITY-CREATE');

      if (taskAssigneeUserId === authUserId && permission) {
        setCanPerformStatusChange(true);
      } else if (authUserRole === 'admin' && permission) {
        setCanPerformStatusChange(true);
      }
    };

    fetchSessionAndCheck();
  }, [taskAssigneeUserId, hasPermission]);

  useEffect(() => {
    const fetchActivities = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await api.get('/api/activity/task', {
          params: { taskId },
        });

        if (response.data.success) {
          setActivities(response.data.data);
        } else {
          throw new Error(
            response.data.message || 'Failed to fetch activities'
          );
        }
      } catch (err) {
        toast.error(`Failed to fetch activities ${err}`);
      } finally {
        setLoading(false);
      }
    };

    if (taskId) {
      fetchActivities();
    }
  }, [taskId]);

  const handleFilePick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const list = e.target.files ? Array.from(e.target.files) : [];
    if (!list.length) {
      return;
    }
    setForm((p) => ({
      ...p,
      files: list,
      filePreviews: list?.map((file, idx) => ({
        id: `local-${Date.now()}-${idx}`,
        name: file.name,
        file,
      })),
    }));
    e.currentTarget.value = '';
  };

  const removePickedFile = (id: string) => {
    setForm((p) => {
      const nextPreviews = p.filePreviews.filter((x) => x.id !== id);
      const nextFiles = nextPreviews?.map((x) => x.file);
      return { ...p, filePreviews: nextPreviews, files: nextFiles };
    });
  };

  const resetForm = () => {
    setForm({
      title: '',
      content: '',
      date: '',
      user: '',
      files: [],
      filePreviews: [],
    });
  };

  const canSave = form.title.trim() && form.content.trim();

  /**
   * Handles the submit button click event. Validates the form, creates FormData
   * with files, and sends a multipart/form-data request to the API to create
   * a new activity.
   *
   * If the request body is invalid according to the createActivitySchema, it
   * returns a 400 Bad Request response with the error message.
   *
   * If there is an error other than a ZodError, it returns a 500 Internal Server
   * Error response with the error message.
   */

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSave) {
      return;
    }

    try {
      const session = await authClient.getSession();

      const formData = new FormData();
      formData.append('taskId', taskId);
      formData.append('title', form.title.trim());
      formData.append('description', form.content.trim());
      formData.append('userId', session.data?.user.id as string);

      for (const file of form.files) {
        formData.append('files[]', file);
      }

      const response = await api.post('/api/activity/task', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to create activity');
      }

      toast.success('Activity created successfully');

      const updatedResponse = await api.get('/api/activity/task', {
        params: { taskId },
      });

      if (updatedResponse.data.success) {
        setActivities(updatedResponse.data.data);
      }

      resetForm();
      setOpen(false);
    } catch (err) {
      toast.error(`Failed to fetch projects, ${err}`);
    }
  };

  const handleFileClick = (file: ActivityFile) => {
    if (file.url) {
      window.open(file.url, '_blank');
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) {
      return '';
    }
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateString;
    }
  };

  const handleDialogOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) {
      resetForm();
    }
  };
  if (loading) {
    return (
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <CardHeader className="py-3">
          <CardTitle className="text-base">Activity Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center p-8">
            <div className="h-8 w-8 animate-spin rounded-full border-primary border-b-2" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <CardHeader className="py-3">
          <CardTitle className="text-base">Activity Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md bg-destructive/15 p-4">
            <div className="text-destructive text-sm">Error: {error}</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border bg-card shadow-lg">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2 text-card-foreground">
            <Activity className="h-5 w-5" />
            Activity Timeline
          </CardTitle>
          <CardDescription>
            Recent actions and updates for this task
          </CardDescription>
        </div>
        <Dialog onOpenChange={handleDialogOpenChange} open={open}>
          {canPerformStatusChange && (
            <DialogTrigger asChild>
              <Button className="gap-1" size="sm" variant="outline">
                <Plus className="h-4 w-4" />
                Add
              </Button>
            </DialogTrigger>
          )}
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Add Activity</DialogTitle>
              <DialogDescription>
                Create a new task activity entry with optional file attachments.
              </DialogDescription>
            </DialogHeader>
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="grid gap-2">
                <Label className="font-medium text-sm" htmlFor="activity-title">
                  Title *
                </Label>
                <Input
                  id="activity-title"
                  onChange={(e) =>
                    setForm((p) => ({ ...p, title: e.target.value }))
                  }
                  placeholder="e.g., Status changed to In Review"
                  required
                  value={form.title}
                />
              </div>

              <div className="grid gap-2">
                <Label
                  className="font-medium text-sm"
                  htmlFor="activity-description"
                >
                  Description *
                </Label>
                <Textarea
                  id="activity-description"
                  onChange={(e) =>
                    setForm((p) => ({ ...p, content: e.target.value }))
                  }
                  placeholder="Write what happened..."
                  required
                  rows={3}
                  value={form.content}
                />
              </div>

              <div className="grid gap-2">
                <Label
                  className="font-medium text-sm"
                  htmlFor="fileAttachments"
                >
                  File Attachments (Optional)
                </Label>
                <Input multiple onChange={handleFilePick} type="file" />
                {form.filePreviews.length > 0 && (
                  <div className="text-muted-foreground text-xs">
                    <p>{form.filePreviews.length} file(s) selected:</p>
                    <ul className="mt-1 list-disc pl-4">
                      {form?.filePreviews?.map((f) => (
                        <li
                          className="flex items-center justify-between truncate"
                          key={f.id}
                        >
                          <span className="truncate">
                            {f.name} ({(f.file.size / 1024).toFixed(1)} KB)
                          </span>
                          <Button
                            className="ml-2 h-6 w-6 p-0"
                            onClick={() => removePickedFile(f.id)}
                            size="sm"
                            type="button"
                            variant="ghost"
                          >
                            <X className="h-3.5 w-3.5" />
                          </Button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              <DialogFooter className="gap-2">
                <DialogClose asChild>
                  <Button type="button" variant="ghost">
                    Cancel
                  </Button>
                </DialogClose>
                <Button disabled={!canSave} type="submit">
                  Save Activity
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </CardHeader>

      <CardContent className="max-h-80 overflow-hidden lg:col-span-1">
        <ScrollArea className="h-80 overflow-auto">
          <div className="relative overflow-auto py-1 pr-2 pl-4">
            <div className="absolute top-0 bottom-0 left-0 w-0.5 bg-border" />
            {activities.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground">
                <Activity className="mx-auto mb-2 h-8 w-8 opacity-50" />
                <p className="text-sm">No activities yet</p>
                <p className="text-xs">
                  Add the first activity to track task progress
                </p>
              </div>
            ) : (
              activities?.map((activity) => (
                <div className="relative mb-4 last:mb-0" key={activity.id}>
                  <div className="-left-2.5 absolute top-1.5 flex h-5 w-5 items-center justify-center rounded-full border-2 border-background bg-primary">
                    <Clock className="h-3 w-3 text-primary-foreground" />
                  </div>
                  <div className="ml-4">
                    <p className="font-medium text-card-foreground text-sm">
                      {activity.title}
                    </p>
                    <p className="mb-1 text-muted-foreground text-xs">
                      {activity.description}
                    </p>
                    <p className="text-muted-foreground text-xs">
                      {activity.postedBy?.name || 'Unknown'} •{' '}
                      {formatDate(activity.createdAt)}
                    </p>

                    {activity.files && activity.files.length > 0 && (
                      <div className="mt-2 flex flex-col flex-wrap gap-1">
                        {activity?.files?.map((file) => (
                          <button
                            className="flex cursor-pointer items-center gap-1 rounded bg-muted px-2 py-1 text-[11px] text-muted-foreground transition-colors hover:bg-muted/80"
                            key={file.id}
                            onClick={() => handleFileClick(file)}
                            title={`Download ${file.originalFilename}`}
                            type="button"
                          >
                            <Paperclip className="h-3.5 w-3.5" />
                            <span className="max-w-20 truncate">
                              {file.originalFilename}
                            </span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
