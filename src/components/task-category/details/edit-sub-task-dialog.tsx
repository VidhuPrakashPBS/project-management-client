'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
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
import type { ApiError, Employee, Task } from '@/types/main-task';
import { DatePickerField } from './date-picker-field';
import { FileList } from './file-list';
import { FileUploader } from './file-uploader';
import { TaskSelector } from './task-selector';

export default function EditSubTaskDialog({
  taskId,
  onTaskUpdated,
  children,
}: {
  taskId: string;
  onTaskUpdated?: () => void;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(false);

  // Data states
  const [task, setTask] = useState<Task | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [availableTasks, setAvailableTasks] = useState<Task[]>([]);

  // Form states
  const [form, setForm] = useState({
    name: '',
    description: '',
    assigneeId: '',
    startDate: undefined as Date | undefined,
    endDate: undefined as Date | undefined,
    precedingTaskIds: [] as string[],
    succeedingTaskIds: [] as string[],
    existingFiles: [],
    addFiles: [] as File[],
    removeFileIds: [] as string[],
  });

  // Fetch task details
  const fetchTask = useCallback(async () => {
    try {
      const response = await api.get(`/api/tasks/${taskId}`);
      if (response.data.success && response.data.data) {
        const taskData = response.data.data;
        setTask(taskData);

        // Populate form with task data
        setForm({
          name: taskData.title || '',
          description: taskData.description || '',
          assigneeId: taskData.employee?.user?.id || '',
          startDate: taskData.startDate
            ? new Date(taskData.startDate)
            : undefined,
          endDate: taskData.endDate ? new Date(taskData.endDate) : undefined,
          precedingTaskIds: taskData?.proceedingTasks?.map(
            (t: {
              proceedingTask: { id: string; taskNo: string; title: string };
            }) => t.proceedingTask.id
          ),
          succeedingTaskIds: taskData?.succeedingTasks?.map(
            (t: {
              succeedingTask: { id: string; taskNo: string; title: string };
            }) => t.succeedingTask.id
          ),
          existingFiles: taskData.files || [],
          addFiles: [],
          removeFileIds: [],
        });
      }
    } catch (error) {
      toast.error(`Failed to load task details ${error}`);
    }
  }, [taskId]);

  // Fetch employees
  const fetchEmployees = useCallback(async () => {
    try {
      const response = await api.get('/api/employee');
      if (response.data.data) {
        setEmployees(response.data.data.data);
      }
    } catch (error) {
      toast.error(`Failed to load employees ${error}`);
    }
  }, []);

  // Fetch available tasks for dependencies
  const fetchAvailableTasks = useCallback(async () => {
    if (!task?.mainTaskId) {
      return;
    }

    try {
      const params = new URLSearchParams();
      params.append('mainTaskId', task.mainTaskId);

      const response = await api.get(`/api/tasks?${params.toString()}`);
      if (response.data.success && response.data.data) {
        // Filter out current task
        const filteredTasks = response.data.data.filter(
          (t: Task) => t.id !== taskId
        );
        setAvailableTasks(filteredTasks);
      }
    } catch (error) {
      toast.error(`Failed to load available tasks ${error}`);
    }
  }, [task?.mainTaskId, taskId]);

  // Load data when dialog opens
  useEffect(() => {
    if (open) {
      setLoading(true);
      Promise.all([fetchTask(), fetchEmployees()]).finally(() =>
        setLoading(false)
      );
    }
  }, [open, fetchTask, fetchEmployees]);

  // Fetch available tasks after task data is loaded
  useEffect(() => {
    if (task?.mainTaskId) {
      fetchAvailableTasks();
    }
  }, [task?.mainTaskId, fetchAvailableTasks]);

  const setField = <K extends keyof typeof form>(
    key: K,
    value: (typeof form)[K]
  ) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const toggleInArray =
    (arr: string[], setArr: (next: string[]) => void) => (id: string) => {
      setArr(arr.includes(id) ? arr.filter((x) => x !== id) : [...arr, id]);
    };

  const handleRemoveExistingFile = (id: string) => {
    setField('removeFileIds', [...form.removeFileIds, id]);
    setField(
      'existingFiles',
      form.existingFiles.filter((f: { id: string }) => f.id !== id)
    );
  };

  /**
   * Creates a FormData object from the current form state.
   * @returns {FormData} - A FormData object containing the task title, description, status, user ID, and files.
   */
  const createFormData = () => {
    const formData = new FormData();

    // Helper function to append if value exists
    const appendIfExists = (key: string, value: string | undefined) => {
      if (value?.trim()) {
        formData.append(key, value.trim());
      }
    };

    // Helper function to append arrays
    const appendArray = (key: string, items: string[]) => {
      for (const item of items) {
        formData.append(key, item);
      }
    };

    // Required fields
    formData.append('id', taskId);
    formData.append('title', form.name.trim());

    // Optional single fields
    appendIfExists('mainTaskId', task?.mainTaskId);
    appendIfExists('description', form.description);
    appendIfExists('reAssignedToEmployeeId', form.assigneeId);

    // Date fields
    if (form.startDate) {
      formData.append('startDate', form.startDate.toISOString());
    }
    if (form.endDate) {
      formData.append('dueDate', form.endDate.toISOString());
    }

    // Array fields
    appendArray('proceedingTasksId[]', form.precedingTaskIds);
    appendArray('succeedingTasksId[]', form.succeedingTaskIds);
    appendArray('deletedFilesId[]', form.removeFileIds);

    // Files
    for (const file of form.addFiles) {
      formData.append('files[]', file);
    }

    return formData;
  };

  const validateForm = () => {
    if (!form.name.trim()) {
      toast.error('Task name is required');
      return false;
    }
    return true;
  };

  const handleSubmitError = (apiError: ApiError) => {
    if (apiError.response?.status === 400) {
      toast.error(apiError.response.data?.error || 'Invalid data provided');
    } else if (apiError.response?.status === 403) {
      toast.error('You do not have permission to update this task');
    } else if (apiError.response?.status === 404) {
      toast.error('Task not found');
    } else {
      toast.error(
        `Failed to update task: ${apiError.message || 'Unknown error'}`
      );
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setSubmitting(true);

    try {
      const formData = createFormData();

      const response = await api.put('/api/tasks', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.success) {
        toast.success(response.data.message || 'Task updated successfully');
        setOpen(false);
        onTaskUpdated?.();
      } else {
        toast.error(response.data.message || 'Failed to update task');
      }
    } catch (error: unknown) {
      const apiError = error as ApiError;
      handleSubmitError(apiError);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDialogOpenChange = (newOpen: boolean) => {
    if (!submitting) {
      setOpen(newOpen);
      if (!newOpen) {
        // Reset form when dialog closes
        setTask(null);
        setForm({
          name: '',
          description: '',
          assigneeId: '',
          startDate: undefined,
          endDate: undefined,
          precedingTaskIds: [],
          succeedingTaskIds: [],
          existingFiles: [],
          addFiles: [],
          removeFileIds: [],
        });
      }
    }
  };

  // Transform available tasks for TaskSelector
  const taskSelectorTasks = useMemo(
    () =>
      availableTasks?.map((t) => ({
        id: t.id,
        name: t.title,
      })),
    [availableTasks]
  );

  return (
    <Dialog onOpenChange={handleDialogOpenChange} open={open}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="bg-card/90 backdrop-blur-sm sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit Task</DialogTitle>
          <DialogDescription>
            {task ? (
              <>
                Task:{' '}
                <span className="font-semibold text-primary">
                  {task.taskNo}
                </span>
              </>
            ) : (
              'Loading task details...'
            )}
          </DialogDescription>
        </DialogHeader>

        {loading || !task ? (
          <div className="flex items-center justify-center p-8">
            <div className="text-muted-foreground">Loading...</div>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="max-h-[70vh] space-y-6 overflow-y-auto p-1 pr-4">
              {/* Task Name */}
              <div className="space-y-2">
                <Label htmlFor="edit-st-name">Sub-task Name *</Label>
                <Input
                  disabled={submitting}
                  onChange={(e) => setField('name', e.target.value)}
                  placeholder="e.g., Update login page"
                  required
                  value={form.name}
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="edit-st-desc">Description</Label>
                <Textarea
                  disabled={submitting}
                  onChange={(e) => setField('description', e.target.value)}
                  placeholder="Describe the sub-task updates"
                  value={form.description}
                />
              </div>

              {/* Assignee */}
              <div className="space-y-2">
                <Label>Assigned To</Label>
                <Select
                  disabled={submitting}
                  onValueChange={(value) => setField('assigneeId', value)}
                  value={form.assigneeId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select an employee" />
                  </SelectTrigger>
                  <SelectContent>
                    {employees?.map((emp) => (
                      <SelectItem key={emp.id} value={emp.id}>
                        <div className="flex flex-col items-start">
                          <span className="font-medium">{emp.name}</span>
                          <span className="text-muted-foreground text-xs">
                            {emp.email}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <DatePickerField
                  label="Start Date"
                  onChange={(date) => setField('startDate', date as Date)}
                  value={form.startDate}
                />
                <DatePickerField
                  label="End Date"
                  onChange={(date) => setField('endDate', date as Date)}
                  value={form.endDate}
                />
              </div>

              {/* Dependencies */}
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <TaskSelector
                  label="Preceding Tasks"
                  placeholder="Select preceding tasks..."
                  selected={form.precedingTaskIds}
                  tasks={taskSelectorTasks}
                  toggle={toggleInArray(form.precedingTaskIds, (ids) =>
                    setField('precedingTaskIds', ids)
                  )}
                />
                <TaskSelector
                  label="Succeeding Tasks"
                  placeholder="Select succeeding tasks..."
                  selected={form.succeedingTaskIds}
                  tasks={taskSelectorTasks}
                  toggle={toggleInArray(form.succeedingTaskIds, (ids) =>
                    setField('succeedingTaskIds', ids)
                  )}
                />
              </div>

              {/* Files */}
              <FileList
                files={form.existingFiles}
                onRemove={handleRemoveExistingFile}
              />
              <div className="space-y-2">
                <Label>Add Files</Label>
                <FileUploader
                  files={form.addFiles}
                  setFiles={(files) => setField('addFiles', files)}
                />
                {form.addFiles.length > 0 && (
                  <p className="text-muted-foreground text-sm">
                    {form.addFiles.length} new file
                    {form.addFiles.length !== 1 ? 's' : ''} selected
                  </p>
                )}
              </div>
            </div>

            <DialogFooter className="pt-6">
              <DialogClose asChild>
                <Button disabled={submitting} type="button" variant="ghost">
                  Cancel
                </Button>
              </DialogClose>
              <Button disabled={submitting || !form.name.trim()} type="submit">
                {submitting ? 'Updating...' : 'Save Changes'}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
