'use client';

import { Activity, Clock, Plus } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { FileUploader } from '@/components/task-category/details/file-uploader';
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
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/hooks/use-auth';
import api from '@/lib/api';
import { authClient } from '@/lib/auth-client';
import type { ActivityFile, ActivityItem } from '@/types/main-task';
import type { ApiResponse } from '@/types/project';
import { decryptId } from '@/utils/aes-security-encryption';

export default function ProjectActivity({
  projectId,
  refetchTrigger,
}: {
  projectId: string;
  refetchTrigger: boolean | number;
}) {
  const [open, setOpen] = useState<boolean>(false);
  const [title, setTitle] = useState<string>('');
  const [content, setContent] = useState<string>('');
  const [files, setFiles] = useState<File[]>([]);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const prevRefetchTrigger = useRef(refetchTrigger);
  const [canCreateActivity, setCanCreateActivity] = useState<boolean>(false);
  const [canViewActivity, setCanViewActivity] = useState<boolean>(false);
  const { hasPermission } = useAuth();
  /**
   * Fetches the activities for a given project ID.
   * If the request is successful, it will set the activities state to the response data.
   * If the request is not successful, it will show a toast error and set the activities state to an empty array.
   */
  const fetchActivities = useCallback(async () => {
    if (!projectId) {
      return;
    }
    try {
      setLoading(true);
      const decryptedId = decryptId(projectId);

      const response = await api.get('/api/activity/project', {
        params: {
          projectId: decryptedId,
        },
      });

      if (response.data.success) {
        setActivities(response.data.data || []);
      } else {
        toast.error('Failed to fetch project activities');
      }
    } catch (error) {
      toast.error(`Failed to fetch activities: ${error}`);
      setActivities([]);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    if (!projectId) {
      return;
    }

    const checkPermission = () => {
      try {
        const createPermission = hasPermission('PROJECT-ACTIVITY-CREATE');
        const viewPermission = hasPermission('PROJECT-ACTIVITY-VIEW');

        if (viewPermission) {
          setCanViewActivity(viewPermission ?? false);
        }

        if (createPermission) {
          setCanCreateActivity(createPermission ?? false);
        }
      } catch (error) {
        toast.error(`Failed to check activity permissions ${error}`);
        setCanCreateActivity(false);
      }
    };

    const fetchActivitiesInProject = async () => {
      if (!projectId) {
        return;
      }
      try {
        setLoading(true);
        const decryptedId = decryptId(projectId);

        const response = await api.get('/api/activity/project', {
          params: {
            projectId: decryptedId,
          },
        });

        if (response.data.success) {
          setActivities(response.data.data || []);
        } else {
          toast.error('Failed to fetch project activities');
        }
      } catch (error) {
        toast.error(`Failed to fetch activities: ${error}`);
        setActivities([]);
      } finally {
        setLoading(false);
      }
    };

    checkPermission();
    fetchActivitiesInProject();
  }, [projectId, hasPermission]);

  useEffect(() => {
    if (!projectId) {
      return;
    }

    if (refetchTrigger !== prevRefetchTrigger.current) {
      prevRefetchTrigger.current = refetchTrigger;
      fetchActivities();
    }
  }, [projectId, refetchTrigger, fetchActivities]);

  const validateSubmission = (
    proId: string,
    ti: string,
    cot: string
  ): boolean => {
    return !!(proId && ti.trim() && cot.trim());
  };

  /**
   * Gets the current user from the session.
   * If the user is not logged in, it will show a toast error and return null.
   * @returns {Promise<User | null>}
   */
  const getCurrentUser = async () => {
    const session = await authClient.getSession();
    if (!session.data?.user?.id) {
      toast.error('You must be logged in to add activities');
      return null;
    }
    return session.data.user;
  };

  /**
   * Creates a FormData object from the current form state.
   * The FormData object will contain the title, description, userId, projectId, and files.
   * @param {string} formProjectId - The ID of the project.
   * @param {string} formTitle - The title of the activity.
   * @param {string} formContent - The description of the activity.
   * @param {string} formUserId - The ID of the user creating the activity.
   * @param {File[]} formFiles - The files to be uploaded.
   * @returns {FormData} - A FormData object containing the extracted values and files.
   */
  const createFormData = (
    formProjectId: string,
    formTitle: string,
    formContent: string,
    formUserId: string,
    formFiles: File[]
  ) => {
    const formData = new FormData();

    const decryptedProjectId = decryptId(formProjectId);
    if (decryptedProjectId) {
      formData.append('projectId', decryptedProjectId);
    }

    formData.append('title', formTitle.trim());
    formData.append('description', formContent.trim());
    formData.append('userId', formUserId);

    for (const file of formFiles) {
      formData.append('files[]', file);
    }

    return formData;
  };

  /**
   * Handles the response from the API when adding a new activity.
   * If the response is successful, it will show a success toast and reset the
   * forms and refresh the activities. If the response is not successful, it will
   * show an error toast with the error message.
   * @param {ApiResponse} response - The response from the API when adding a new activity.
   * @param {() => void} resetForms - A function to reset the forms.
   * @param {() => void} refreshActivities - A function to refresh the activities.
   */
  const handleApiResponse = (
    response: ApiResponse,
    resetForms: () => void,
    refreshActivities: () => void
  ) => {
    if (response.data.success) {
      toast.success(response.data.message || 'Activity added successfully');
      resetForms();
      refreshActivities();
    } else {
      toast.error(response.data.message || 'Failed to add activity');
    }
  };

  /**
   * Submits the activity form.
   * Validates the submission, creates a FormData object, sends a multipart/form-data request to the API to create a project activity,
   * and handles the response. If the response is successful, it resets the form and fetches new activities.
   * If there is an error other than a ZodError, it returns a 500 Internal Server Error response with the error message.
   * @param {React.FormEvent} e - The form event.
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateSubmission(projectId, title, content)) {
      return;
    }

    try {
      setSubmitting(true);

      const user = await getCurrentUser();
      if (!user) {
        return;
      }

      const formData = createFormData(
        projectId,
        title,
        content,
        user.id,
        files
      );

      const response = (await api.post('/api/activity/project', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })) as ApiResponse;

      const resetForm = () => {
        setOpen(false);
        setTitle('');
        setContent('');
        setFiles([]);
      };

      handleApiResponse(response, resetForm, fetchActivities);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error occurred';
      toast.error(`Failed to add activity: ${errorMessage}`);
    } finally {
      setSubmitting(false);
    }
  };

  /**
   * Converts a date string to a human-readable date string using the locale's date format.
   * If the date string is invalid, it returns the original date string.
   * @param {string} dateString - The date string to convert.
   * @returns {string} The human-readable date string.
   */
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

  /**
   * Opens a file in a new tab if the file has a URL.
   * @param {ActivityFile} file - The file to open.
   */
  const handleFileClick = (file: ActivityFile) => {
    if (file.url) {
      window.open(file.url, '_blank');
    }
  };

  /**
   * Resets the form state to its initial values.
   * Resets the title, content, and files states to empty strings and empty arrays respectively.
   */
  const resetForm = () => {
    setTitle('');
    setContent('');
    setFiles([]);
  };

  /**
   * Handles the dialog open state change event. Resets the form state to its initial values
   * when the dialog is closed and not submitting.
   * @param {boolean} newOpen - The new open state of the dialog.
   */
  const handleDialogOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!(newOpen || submitting)) {
      resetForm();
    }
  };

  if (!canViewActivity) {
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
            Recent actions and updates for this project
          </CardDescription>
        </div>
        <Dialog onOpenChange={handleDialogOpenChange} open={open}>
          {canCreateActivity && canViewActivity && (
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
                Create a new project activity entry with optional file
                attachments.
              </DialogDescription>
            </DialogHeader>
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="grid gap-2">
                <label className="font-medium text-sm" htmlFor="activity-title">
                  Title *
                </label>
                <Input
                  disabled={submitting}
                  id="activity-title"
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Activity title"
                  required
                  value={title}
                />
              </div>

              <div className="grid gap-2">
                <label
                  className="font-medium text-sm"
                  htmlFor="activity-description"
                >
                  Description *
                </label>
                <Textarea
                  disabled={submitting}
                  id="activity-description"
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Describe what happened or what was accomplished"
                  required
                  rows={3}
                  value={content}
                />
              </div>

              <div className="grid gap-2">
                <label
                  className="font-medium text-sm"
                  htmlFor="fileAttachments"
                >
                  File Attachments (Optional)
                </label>
                <FileUploader files={files} setFiles={setFiles} />
                {files.length > 0 && (
                  <div className="text-muted-foreground text-xs">
                    <p>{files.length} file(s) selected:</p>
                    <ul className="mt-1 list-disc pl-4">
                      {files?.map((file) => (
                        <li className="truncate" key={file.name}>
                          {file.name} ({(file.size / 1024).toFixed(1)} KB)
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              <DialogFooter className="gap-2">
                <Button
                  disabled={submitting}
                  onClick={() => setOpen(false)}
                  type="button"
                  variant="ghost"
                >
                  Cancel
                </Button>
                <Button
                  disabled={!(title.trim() && content.trim()) || submitting}
                  type="submit"
                >
                  {submitting ? 'Adding...' : 'Save Activity'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </CardHeader>

      <CardContent className="min-h-0 lg:col-span-1">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="h-6 w-6 animate-spin rounded-full border-primary border-b-2" />
            <span className="ml-2 text-muted-foreground text-sm">
              Loading activities...
            </span>
          </div>
        ) : (
          <ScrollArea className="h-80">
            <div className="relative py-1 pr-2 pl-4">
              <div className="absolute top-0 bottom-0 left-0 w-0.5 bg-border" />
              {activities.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground">
                  <Activity className="mx-auto mb-2 h-8 w-8 opacity-50" />
                  <p className="text-sm">No activities yet</p>
                  <p className="text-xs">
                    Add the first activity to track project progress
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
                        {activity.user && `${activity.user} • `}
                        {formatDate(activity.createdAt || '')}
                      </p>

                      {activity.files && activity.files.length > 0 && (
                        <div className="mt-2 flex flex-col flex-wrap gap-1">
                          {activity.files?.map((file) => (
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
        )}
      </CardContent>
    </Card>
  );
}
