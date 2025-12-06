'use client';

import { DialogDescription } from '@radix-ui/react-dialog';
import type { AxiosResponse } from 'axios';
import { Activity, Clock, Plus } from 'lucide-react';
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
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/hooks/use-auth';
import api from '@/lib/api';
import { authClient } from '@/lib/auth-client';
import type {
  ActivityFile,
  ListMainTaskActivitiesResponse,
  MainTaskActivity,
  MainTaskActivitySectionProps,
} from '@/types/main-task';
import { ActivitySkeleton } from './main-task-activity-skeleton';

export function MainTaskActivitySection({
  mainTaskId,
}: MainTaskActivitySectionProps) {
  const [activities, setActivities] = useState<MainTaskActivity[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [createPermission, setCreatePermission] = useState<boolean>(false);
  const [viewPermission, setViewPermission] = useState<boolean>(false);
  const [form, setForm] = useState({
    title: '',
    description: '',
    files: [] as File[],
  });
  const { hasPermission } = useAuth();

  const checkPermission = useCallback(() => {
    const createPermissionCheck = hasPermission('MAIN-TASK-ACTIVITY-CREATE');
    const viewPermissionCheck = hasPermission('MAIN-TASK-ACTIVITY-VIEW');

    if (viewPermissionCheck) {
      setViewPermission(viewPermissionCheck);
    }

    if (createPermissionCheck) {
      setCreatePermission(createPermissionCheck);
    }
  }, [hasPermission]);

  /**
   * Sets a field in the form state
   * @template K - The key of the field to set
   * @param {K} key - The key of the field to set
   * @param {(typeof form)[K]} value - The value to set the field to
   */
  const setField = <K extends keyof typeof form>(
    key: K,
    value: (typeof form)[K]
  ) => setForm((prev) => ({ ...prev, [key]: value }));

  // Fetch activities
  const fetchActivities = useCallback(async () => {
    if (!mainTaskId) {
      return;
    }

    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append('mainTaskId', mainTaskId);

      const response = (await api.get(
        `/api/activity/main-task?${params.toString()}`
      )) as { data: ListMainTaskActivitiesResponse };

      if (response.data.success) {
        setActivities(response.data.data || []);
      } else {
        toast.error(response.data.message || 'Failed to fetch activities');
      }
    } catch (error) {
      toast.error(`Failed to fetch activities: ${error}`);
    } finally {
      setLoading(false);
    }
  }, [mainTaskId]);

  useEffect(() => {
    fetchActivities();
    checkPermission();
  }, [fetchActivities, checkPermission]);

  /**
   * Resets the form state to its initial values.
   */
  const resetForm = () => {
    setForm({
      title: '',
      description: '',
      files: [],
    });
  };

  /**
   * Validates the form state by checking if the title and description are filled.
   * If either of these fields are empty, an error toast is shown and the function returns false.
   * Otherwise, the function returns true.
   * @returns {boolean} Whether the form is valid or not.
   */
  const validateForm = () => {
    if (!form.title.trim()) {
      toast.error('Title is required');
      return false;
    }
    if (!form.description.trim()) {
      toast.error('Description is required');
      return false;
    }
    return true;
  };

  const handleFilePick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files) : [];
    setField('files', files);
    e.currentTarget.value = ''; // Reset input
  };

  /**
   * Removes the file at the given index from the form state.
   * @param {number} index - The index of the file to be removed.
   */
  const removeFile = (index: number) => {
    setField(
      'files',
      form.files.filter((_, i) => i !== index)
    );
  };

  /**
   * Handles API errors by displaying error toasts to the user.
   * If the error response status is 400, an error toast is shown with the error message from the API response data.
   * If the error response status is 403, an error toast is shown with the message "You do not have permission to create activities".
   * Otherwise, an error toast is shown with the message "Failed to create activity: {error message || 'Unknown error'}".
   * @param {unknown} error - The error object from the API request.
   */
  const handleError = (error: unknown) => {
    const apiError = error as {
      response?: {
        status?: number;
        data?: {
          message?: string;
          error?: string;
        };
      };
      message?: string;
    };

    if (apiError.response?.status === 400) {
      toast.error(apiError.response.data?.error || 'Invalid data provided');
    } else if (apiError.response?.status === 403) {
      toast.error('You do not have permission to create activities');
    } else {
      toast.error(
        `Failed to create activity: ${apiError.message || 'Unknown error'}`
      );
    }
  };

  /**
   * Handles the response from the API after submitting a new activity.
   * If the response is successful, it will show a success toast and reset the form, close the dialog, and fetch new activities.
   * If the response is not successful, it will show an error toast with the error message from the API response data.
   * @param {AxiosResponse} response - The response from the API after submitting a new activity.
   */
  const handleResponse = (response: AxiosResponse) => {
    if (response.data.success) {
      toast.success(response.data.message || 'Activity created successfully');
      resetForm();
      setOpen(false);
      fetchActivities();
    } else {
      toast.error(response.data.message || 'Failed to create activity');
    }
  };
  /**
   * Handles the submit button click event. Validates the form, creates FormData
   * with files, and sends a multipart/form-data request to the API to create
   * a new activity.
   *
   * If the request body is invalid according to the createMainTaskActivitySchema, it
   * returns a 400 Bad Request response with the error message.
   *
   * If there is an error other than a ZodError, it returns a 500 Internal Server
   * Error response with the error message.
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setSubmitting(true);

    try {
      // Get current user
      const session = await authClient.getSession();
      if (!session.data?.user?.id) {
        toast.error('You must be logged in to create activities');
        return;
      }

      // Create FormData for file upload
      const formData = new FormData();
      formData.append('title', form.title.trim());
      formData.append('description', form.description.trim());
      formData.append('mainTaskId', mainTaskId);
      formData.append('userId', session.data.user.id);

      // Add files - ensure consistent naming
      if (form.files && form.files.length > 0) {
        for (const file of form.files) {
          formData.append('files[]', file);
        }
      }

      const response = await api.post('/api/activity/main-task', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      handleResponse(response);
    } catch (error: unknown) {
      handleError(error);
    } finally {
      setSubmitting(false);
    }
  };

  /**
   * Handles the dialog open/close event. Resets the form when the dialog is closed.
   * @param {boolean} newOpen - The new open state of the dialog.
   */
  const handleDialogOpenChange = (newOpen: boolean) => {
    if (!submitting) {
      setOpen(newOpen);
      if (!newOpen) {
        resetForm();
      }
    }
  };

  /**
   * Converts a date string to a human-readable date string using the locale's date format.
   * If the date string is invalid, it returns the original date string.
   * @param {string} dateString - The date string to convert.
   * @returns {string} The human-readable date string.
   */
  const formatDate = (dateString?: string) => {
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

  // Loading skeleton

  if (loading) {
    return <ActivitySkeleton />;
  }

  /**
   * Opens a file in a new tab if the file has a URL.
   * @param {ActivityFile} file - The file to open.
   */
  const handleFileClick = (file: ActivityFile) => {
    if (file.url) {
      window.open(file.url, '_blank');
    }
  };

  if (!viewPermission) {
    return null;
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
          {createPermission && (
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
                  disabled={submitting}
                  id="activity-title"
                  onChange={(e) => setField('title', e.target.value)}
                  placeholder="e.g., Document reviewed"
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
                  disabled={submitting}
                  id="activity-description"
                  onChange={(e) => setField('description', e.target.value)}
                  placeholder="Write what happened..."
                  required
                  rows={3}
                  value={form.description}
                />
              </div>

              <div className="grid gap-2">
                <Label className="font-medium text-sm" htmlFor="activity-files">
                  Files (Optional)
                </Label>
                <Input
                  accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.xls,.xlsx"
                  disabled={submitting}
                  id="activity-files"
                  multiple
                  onChange={handleFilePick}
                  type="file"
                />

                {/* Show selected files */}
                {form.files.length > 0 && (
                  <div className="text-muted-foreground text-xs">
                    <p>
                      {form.files.length} file
                      {form.files.length !== 1 ? 's' : ''} selected:
                    </p>
                    <ul className="mt-1 list-disc pl-4">
                      {form?.files?.map((file, index) => (
                        <li
                          className="flex items-center justify-between"
                          key={file.name}
                        >
                          <span className="truncate">
                            {file.name} ({(file.size / 1024).toFixed(1)} KB)
                          </span>
                          <Button
                            className="ml-2 h-6 w-6 p-0"
                            disabled={submitting}
                            onClick={() => removeFile(index)}
                            size="sm"
                            type="button"
                            variant="ghost"
                          >
                            ×
                          </Button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              <DialogFooter className="gap-2">
                <DialogClose asChild>
                  <Button disabled={submitting} type="button" variant="ghost">
                    Cancel
                  </Button>
                </DialogClose>
                <Button
                  disabled={
                    submitting || !form.title.trim() || !form.description.trim()
                  }
                  type="submit"
                >
                  {submitting ? 'Creating...' : 'Save Activity'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </CardHeader>

      <CardContent className="min-h-0 lg:col-span-1">
        <ScrollArea className="h-120 pr-4">
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
                      {activity.postedBy.name} •{' '}
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
                            <span>📎</span>
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
