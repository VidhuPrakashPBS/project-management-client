'use client';

import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
import type { CreateMainTaskProps } from '@/types/main-task';
import type { ApiResponse } from '@/types/project';
import { decryptId } from '@/utils/aes-security-encryption';

export function CreateTaskCategory({
  open,
  onOpenChange,
  projectId,
  createFromList,
  onTaskCreated,
}: CreateMainTaskProps) {
  const [form, setForm] = useState({
    title: '',
    description: '',
    project: '',
    status: '',
    files: [] as File[],
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

  /**
   * Removes the file at the given index from the form state.
   * @param {number} index - The index of the file to be removed.
   */
  const removeFileAt = (index: number) => {
    setForm((prev) => ({
      ...prev,
      files: prev.files.filter((_, i) => i !== index),
    }));
  };

  /**
   * Resets the form state to its initial values.
   */
  const resetForm = () => {
    setForm({
      title: '',
      description: '',
      project: '',
      status: '',
      files: [],
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
    if (createFromList && !form.project) {
      toast.error('Project is required');
      return false;
    }
    if (!(createFromList || projectId)) {
      toast.error('Project ID is required');
      return false;
    }
    return true;
  };

  const getCurrentUser = async () => {
    const session = await authClient.getSession();
    if (!session.data?.user?.id) {
      toast.error('You must be logged in to create tasks');
      return null;
    }
    return session.data.user;
  };

  /**
   * Creates a FormData object from the current form state.
   * @param {string} userId - The ID of the user creating the task.
   * @returns {FormData} - A FormData object containing the task title, description, status, user ID, and files.
   */
  const createFormData = (userId: string) => {
    const formData = new FormData();

    // Add text fields
    formData.append('title', form.title.trim());
    formData.append('description', form.description.trim());
    formData.append('status', form.status);
    formData.append('userId', userId);

    // Add projectId
    const finalProjectId = decryptId(projectId as string);
    if (finalProjectId !== null) {
      formData.append('projectId', finalProjectId);
    }
    // Add files as File objects
    for (const file of form.files) {
      formData.append('files', file);
    }

    return formData;
  };

  const handleApiError = (error: unknown) => {
    interface ApiError {
      response?: {
        status?: number;
        data?: {
          error?: string;
          message?: string;
          success?: boolean;
        };
      };
      message?: string;
    }

    const apiError = error as ApiError;

    const serverMessage =
      apiError.response?.data?.error ||
      apiError.response?.data?.message ||
      apiError.message ||
      'Unknown error occurred';

    if (apiError.response?.status === 400) {
      toast.error(serverMessage);
    } else if (apiError.response?.status === 403) {
      toast.error(
        'You do not have permission to create tasks for this project.'
      );
    } else if (apiError.response?.status === 404) {
      toast.error('Project not found.');
    } else if (apiError.response?.status === 500) {
      toast.error(serverMessage);
    } else {
      toast.error(`Failed to create main task: ${serverMessage}`);
    }
  };

  const handleApiResponse = (
    response: ApiResponse,
    resetForms: () => void,
    onOpChange: (op: boolean) => void,
    onTaskCreate?: () => void
  ) => {
    if (response.data.success) {
      toast.success(response.data.message || 'Main task created successfully');
      resetForms();
      onOpChange(false);
      onTaskCreate?.();
    } else {
      toast.error(response.data.message || 'Failed to create main task');
    }
  };

  /**
   * Handles the OK button click event. Validates the form, creates FormData with files,
   * and sends a multipart/form-data request to the API to create a main task.
   */
  const handleOk = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      setSubmitting(true);

      const user = await getCurrentUser();
      if (!user) {
        return;
      }

      // Create FormData with File objects
      const formData = createFormData(user.id);

      // Send multipart/form-data request
      const response = (await api.post('/api/maintask', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })) as ApiResponse;

      handleApiResponse(response, resetForm, onOpenChange, onTaskCreated);
    } catch (error) {
      handleApiError(error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (!submitting) {
      resetForm();
      onOpenChange(false);
    }
  };

  const handleDialogOpenChange = (newOpen: boolean) => {
    if (!submitting) {
      onOpenChange(newOpen);
      if (!newOpen) {
        resetForm();
      }
    }
  };

  const projectOptions = useMemo(() => {
    return ['Project-1', 'Project-2', 'Project-3', 'Project-4'];
  }, []);

  const statusOptions = [
    { value: 'pending', label: 'Pending' },
    { value: 'in_progress', label: 'In Progress' },
    { value: 'on_hold', label: 'On Hold' },
    { value: 'completed', label: 'Completed' },
    { value: 'cancelled', label: 'Cancelled' },
  ];

  return (
    <Dialog onOpenChange={handleDialogOpenChange} open={open}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Create Main Task</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          {/* Title input */}
          <div className="grid gap-2">
            <Label htmlFor="task-title">Title *</Label>
            <Input
              disabled={submitting}
              id="task-title"
              onChange={(e) => setField('title', e.target.value)}
              placeholder="e.g. Paperwork for LOI"
              required
              value={form.title}
            />
          </div>

          {/* Description textarea */}
          <div className="grid gap-2">
            <Label htmlFor="task-description">Description *</Label>
            <Textarea
              disabled={submitting}
              id="task-description"
              onChange={(e) => setField('description', e.target.value)}
              placeholder="Detailed description of the main task"
              required
              rows={3}
              value={form.description}
            />
          </div>

          {createFromList && (
            <div className="grid gap-2">
              <Label htmlFor="task-project">Project *</Label>
              <Select
                disabled={submitting}
                onValueChange={(v) => setField('project', v)}
                required
                value={form.project}
              >
                <SelectTrigger id="task-project">
                  <SelectValue placeholder="Select project" />
                </SelectTrigger>
                <SelectContent>
                  {projectOptions?.map((p) => (
                    <SelectItem key={p} value={p}>
                      {p}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Status dropdown */}
          <div className="grid gap-2">
            <Label htmlFor="task-status">Status *</Label>
            <Select
              disabled={submitting}
              onValueChange={(value) => setField('status', value)}
              required
              value={form.status}
            >
              <SelectTrigger id="task-status">
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

          {/* File upload */}
          <div className="grid gap-2">
            <Label htmlFor="task-files">Files (Optional)</Label>
            <Input
              accept=".jpg,.jpeg,.png,.gif,.webp,.pdf,.txt,.doc,.docx,.xls,.xlsx"
              className="file:border-0 file:bg-transparent file:font-medium file:text-sm"
              disabled={submitting}
              id="task-files"
              multiple
              onChange={(e) => onPickFiles(e.currentTarget.files)}
              type="file"
            />

            <div className="space-y-2">
              {form.files.length === 0 ? (
                <p className="text-muted-foreground text-sm">
                  No files selected
                </p>
              ) : (
                <div className="max-h-32 space-y-1 overflow-y-auto">
                  <p className="font-medium text-sm">
                    {form.files.length} file{form.files.length !== 1 ? 's' : ''}{' '}
                    selected:
                  </p>
                  {form.files?.map((f, idx) => (
                    <div
                      className="flex items-center justify-between gap-2 rounded-md bg-muted p-2"
                      key={`${f.name}-${f.size}-${idx}`}
                    >
                      <div className="min-w-0 flex-1">
                        <span className="block truncate text-foreground text-sm">
                          {f.name}
                        </span>
                        <span className="text-muted-foreground text-xs">
                          {(f.size / 1024).toFixed(1)} KB
                        </span>
                      </div>
                      <Button
                        disabled={submitting}
                        onClick={() => removeFileAt(idx)}
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
            onClick={handleOk}
          >
            {submitting ? 'Creating...' : 'Create Task'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
