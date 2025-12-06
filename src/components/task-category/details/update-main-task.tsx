'use client';

import { Edit3 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import api from '@/lib/api';
import { authClient } from '@/lib/auth-client';
import type { ApiError, UpdateMainTaskProps } from '@/types/main-task';

export function UpdateMainTaskDialog({
  mainTask,
  onTaskUpdated,
  children,
}: UpdateMainTaskProps) {
  const [open, setOpen] = useState<boolean>(false);
  const [form, setForm] = useState({
    title: mainTask?.title,
    description: mainTask?.description,
    status: mainTask?.status,
    files: [] as File[],
    deletedFilesId: [] as string[],
  });
  const [submitting, setSubmitting] = useState(false);

  const setField = <K extends keyof typeof form>(
    key: K,
    value: (typeof form)[K]
  ) => setForm((prev) => ({ ...prev, [key]: value }));

  const onPickFiles = (files: FileList | null) => {
    if (!files || files.length === 0) {
      return;
    }

    setForm((prev) => {
      const added = Array.from(files);
      const existing = new Set(
        prev.files?.map((f) => `${f.name}-${f.size}-${f.type}`)
      );
      const merged = [
        ...prev.files,
        ...added.filter((f) => !existing.has(`${f.name}-${f.size}-${f.type}`)),
      ];
      return { ...prev, files: merged };
    });
  };

  const removeNewFileAt = (index: number) => {
    setForm((prev) => ({
      ...prev,
      files: prev.files.filter((_, i) => i !== index),
    }));
  };

  const removeExistingFile = (fileId: string) => {
    setForm((prev) => ({
      ...prev,
      deletedFilesId: [...prev.deletedFilesId, fileId],
    }));
  };

  const restoreFile = (fileId: string) => {
    setForm((prev) => ({
      ...prev,
      deletedFilesId: prev.deletedFilesId.filter((id) => id !== fileId),
    }));
  };

  const resetForm = () => {
    setForm({
      title: mainTask?.title,
      description: mainTask?.description,
      status: mainTask?.status,
      files: [],
      deletedFilesId: [],
    });
  };

  const validateForm = () => {
    if (!form.title.trim()) {
      toast.error('Title is required');
      return false;
    }
    if (!form.description.trim()) {
      toast.error('Description is required');
      return false;
    }
    if (!form.status) {
      toast.error('Status is required');
      return false;
    }
    return true;
  };

  const getCurrentUser = async () => {
    const session = await authClient.getSession();
    if (!session.data?.user?.id) {
      toast.error('You must be logged in to update tasks');
      return null;
    }
    return session.data.user;
  };

  const createFormData = (userId: string) => {
    const formData = new FormData();

    formData.append('id', mainTask.id);
    formData.append('title', form.title.trim());
    formData.append('description', form.description.trim());
    formData.append('status', form.status);
    formData.append('userId', userId);

    // Add deleted file IDs
    for (const fileId of form.deletedFilesId) {
      formData.append('deletedFilesId', fileId);
    }

    // Add new files
    for (const file of form.files) {
      formData.append('files', file);
    }

    return formData;
  };

  const handleSubmitError = (apiError: ApiError) => {
    if (apiError.response?.status === 400) {
      toast.error(apiError.response.data?.error || 'Invalid data provided');
    } else if (apiError.response?.status === 403) {
      toast.error('You do not have permission to update this task');
    } else if (apiError.response?.status === 404) {
      toast.error('Main task not found');
    } else {
      toast.error(
        `Failed to update main task: ${apiError.message || 'Unknown error'}`
      );
    }
  };

  /**
   * Handles the submit button click event. Validates the form, creates FormData
   * with files, and sends a multipart/form-data request to the API to update
   * an existing main task.
   *
   * If the request body is invalid according to the updateMainTaskSchema, it
   * returns a 400 Bad Request response with the error message.
   *
   * If there is an error other than a ZodError, it returns a 500 Internal Server
   * Error response with the error message.
   */
  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setSubmitting(true);

    try {
      const user = await getCurrentUser();
      if (!user) {
        return;
      }

      const formData = createFormData(user.id);

      const response = await api.patch('/api/maintask', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.success) {
        toast.success(
          response.data.message || 'Main task updated successfully'
        );
        resetForm();
        setOpen(false);
        onTaskUpdated();
      } else {
        toast.error(response.data.message || 'Failed to update main task');
      }
    } catch (error) {
      const apiError = error as ApiError;
      handleSubmitError(apiError);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (!submitting) {
      resetForm();
      setOpen(false);
    }
  };

  const handleDialogOpenChange = (newOpen: boolean) => {
    if (!submitting) {
      setOpen(newOpen);
      if (!newOpen) {
        resetForm();
      }
    }
  };

  const statusOptions = [
    { value: 'pending', label: 'Pending' },
    { value: 'in_progress', label: 'In Progress' },
    { value: 'on_hold', label: 'On Hold' },
    { value: 'completed', label: 'Completed' },
  ];

  const existingFiles =
    mainTask?.files?.filter((file) => !form.deletedFilesId.includes(file.id)) ||
    [];

  return (
    <Dialog onOpenChange={handleDialogOpenChange} open={open}>
      <DialogTrigger asChild>
        {children || (
          <Button size="sm" variant="outline">
            <Edit3 className="mr-2 h-4 w-4" />
            Edit Task
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Update Main Task</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          {/* Title input */}
          <div className="grid gap-2">
            <Label htmlFor="update-task-title">Title *</Label>
            <Input
              disabled={submitting}
              id="update-task-title"
              onChange={(e) => setField('title', e.target.value)}
              placeholder="e.g. Paperwork for LOI"
              required
              value={form.title}
            />
          </div>

          {/* Description textarea */}
          <div className="grid gap-2">
            <Label htmlFor="update-task-description">Description *</Label>
            <Textarea
              disabled={submitting}
              id="update-task-description"
              onChange={(e) => setField('description', e.target.value)}
              placeholder="Detailed description of the main task"
              required
              rows={3}
              value={form.description}
            />
          </div>

          {/* Status dropdown */}
          <div className="grid gap-2">
            <Label htmlFor="update-task-status">Status *</Label>
            <Select
              disabled={submitting}
              onValueChange={(value) => setField('status', value)}
              required
              value={form.status}
            >
              <SelectTrigger id="update-task-status">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                {statusOptions?.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Existing Files */}
          {existingFiles.length > 0 && (
            <div className="grid gap-2">
              <Label>Current Files ({existingFiles.length})</Label>
              <div className="space-y-1">
                {existingFiles?.map((file) => (
                  <div
                    className="flex items-center justify-between rounded-md bg-muted p-2"
                    key={file.id}
                  >
                    <div className="min-w-0 flex-1">
                      <span className="block truncate text-sm">
                        {file.originalFilename}
                      </span>
                    </div>
                    <Button
                      disabled={submitting}
                      onClick={() => removeExistingFile(file.id)}
                      size="sm"
                      type="button"
                      variant="ghost"
                    >
                      Remove
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Files to be deleted */}
          {form.deletedFilesId.length > 0 && (
            <div className="grid gap-2">
              <Label className="text-red-600">
                Files to be deleted ({form.deletedFilesId.length})
              </Label>
              <div className="space-y-1">
                {form?.deletedFilesId?.map((fileId) => {
                  const file = mainTask.files?.find((f) => f.id === fileId);
                  return (
                    <div
                      className="flex items-center justify-between rounded-md border border-red-200 bg-red-50 p-2"
                      key={fileId}
                    >
                      <div className="min-w-0 flex-1">
                        <span className="block truncate text-red-700 text-sm">
                          {file?.originalFilename || fileId}
                        </span>
                      </div>
                      <Button
                        disabled={submitting}
                        onClick={() => restoreFile(fileId)}
                        size="sm"
                        type="button"
                        variant="ghost"
                      >
                        Restore
                      </Button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* New File upload */}
          <div className="grid gap-2">
            <Label htmlFor="update-task-files">Add New Files (Optional)</Label>
            <Input
              accept=".jpg,.jpeg,.png,.gif,.webp,.pdf,.txt,.doc,.docx,.xls,.xlsx"
              className="file:border-0 file:bg-transparent file:font-medium file:text-sm"
              disabled={submitting}
              id="update-task-files"
              multiple
              onChange={(e) => onPickFiles(e.currentTarget.files)}
              type="file"
            />

            {form.files.length > 0 && (
              <div className="space-y-1">
                <p className="font-medium text-sm">
                  {form.files.length} new file
                  {form.files.length !== 1 ? 's' : ''} to upload:
                </p>
                {form?.files?.map((f, idx) => (
                  <div
                    className="flex items-center justify-between rounded-md border border-green-200 bg-green-50 p-2"
                    key={`${f.name}-${f.size}-${idx}`}
                  >
                    <div className="min-w-0 flex-1">
                      <span className="block truncate text-green-700 text-sm">
                        {f.name}
                      </span>
                      <span className="text-green-600 text-xs">
                        {(f.size / 1024).toFixed(1)} KB
                      </span>
                    </div>
                    <Button
                      disabled={submitting}
                      onClick={() => removeNewFileAt(idx)}
                      size="sm"
                      type="button"
                      variant="ghost"
                    >
                      Remove
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button
            disabled={submitting}
            onClick={handleCancel}
            variant="outline"
          >
            Cancel
          </Button>
          <Button
            disabled={
              submitting ||
              !form.title.trim() ||
              !form.description.trim() ||
              !form.status
            }
            onClick={handleSubmit}
          >
            {submitting ? 'Updating...' : 'Update Task'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
