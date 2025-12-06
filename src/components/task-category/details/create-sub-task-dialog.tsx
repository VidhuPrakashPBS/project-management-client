'use client';

import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import { useRouter } from 'nextjs-toploader/app';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
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
import type {
  ApiError,
  CreateTaskResponse,
  Employee,
  ListResponse,
  Task,
} from '@/types/main-task';
import { FileUploader } from './file-uploader';
import { TaskSelector } from './task-selector';

export function CreateSubTaskDialog({
  mainTaskId,
  children,
  onTaskCreated,
}: {
  mainTaskId: string;
  children: React.ReactNode;
  onTaskCreated?: () => void;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    title: '',
    description: '',
    assignedToEmployeeId: '',
    startDate: undefined as Date | undefined,
    dueDate: undefined as Date | undefined,
    proceedingTasksId: [] as string[],
    succeedingTasksId: [] as string[],
    files: [] as File[],
  });
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [availableTasks, setAvailableTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);

  const setField = <K extends keyof typeof form>(
    key: K,
    value: (typeof form)[K]
  ) => setForm((prev) => ({ ...prev, [key]: value }));

  // Fetch employees
  const fetchEmployees = useCallback(async () => {
    try {
      const response = await api.get('/api/employee');
      if (response.data.data) {
        setEmployees(response.data.data.data);
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      toast.error(`Failed to load employees: ${errorMessage}`);
    }
  }, []);

  // Fetch existing tasks for the main task
  const fetchAvailableTasks = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      params.append('mainTaskId', mainTaskId);

      const response = (await api.get(`/api/tasks?${params.toString()}`)) as {
        data: ListResponse<Task>;
      };
      if (response.data.data) {
        setAvailableTasks(response.data.data);
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      toast.error(`Failed to load existing tasks: ${errorMessage}`);
    }
  }, [mainTaskId]);

  // Load data when dialog opens
  useEffect(() => {
    if (open) {
      setLoading(true);
      Promise.all([fetchEmployees(), fetchAvailableTasks()]).finally(() =>
        setLoading(false)
      );
    }
  }, [open, fetchEmployees, fetchAvailableTasks]);

  const resetForm = () => {
    setForm({
      title: '',
      description: '',
      assignedToEmployeeId: '',
      startDate: undefined,
      dueDate: undefined,
      proceedingTasksId: [],
      succeedingTasksId: [],
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
    return true;
  };

  const createFormData = (userId: string) => {
    const formData = new FormData();

    // Basic fields
    formData.append('title', form.title.trim());
    formData.append('description', form.description.trim());
    formData.append('mainTaskId', mainTaskId);
    formData.append('userId', userId);

    // Optional fields
    if (form.assignedToEmployeeId) {
      formData.append('assignedToEmployeeId', form.assignedToEmployeeId);
    }

    if (form.startDate) {
      formData.append('startDate', form.startDate.toISOString());
    }

    if (form.dueDate) {
      formData.append('dueDate', form.dueDate.toISOString());
    }

    for (const taskId of form.proceedingTasksId) {
      formData.append('proceedingTasksId[]', taskId);
    }

    for (const taskId of form.succeedingTasksId) {
      formData.append('succeedingTasksId[]', taskId);
    }

    for (const file of form.files) {
      formData.append('files[]', file);
    }

    return formData;
  };

  const handleSubmitError = (apiError: ApiError) => {
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
        toast.error('You must be logged in to create tasks');
        return;
      }

      const formData = createFormData(session.data.user.id);

      const response = (await api.post('/api/tasks', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })) as { data: CreateTaskResponse };

      if (response.data.success) {
        toast.success('Sub-task created successfully');
        resetForm();
        setOpen(false);
        onTaskCreated?.();
        router.refresh();
      } else {
        toast.error(response.data.message || 'Failed to create sub-task');
      }
    } catch (error: unknown) {
      const apiError = error as ApiError;
      handleSubmitError(apiError);
    } finally {
      setSubmitting(false);
    }
  };

  // Task selection handlers
  const handleProceedingTaskToggle = (taskId: string) => {
    const newSelected = form.proceedingTasksId.includes(taskId)
      ? form.proceedingTasksId.filter((id) => id !== taskId)
      : [...form.proceedingTasksId, taskId];
    setField('proceedingTasksId', newSelected);
  };

  const handleSucceedingTaskToggle = (taskId: string) => {
    const newSelected = form.succeedingTasksId.includes(taskId)
      ? form.succeedingTasksId.filter((id) => id !== taskId)
      : [...form.succeedingTasksId, taskId];
    setField('succeedingTasksId', newSelected);
  };

  const handleDialogOpenChange = (newOpen: boolean) => {
    if (!submitting) {
      setOpen(newOpen);
      if (!newOpen) {
        resetForm();
      }
    }
  };

  return (
    <Dialog onOpenChange={handleDialogOpenChange} open={open}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="bg-card/90 backdrop-blur-sm sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create New Sub-task</DialogTitle>
          <DialogDescription>
            Create a new sub-task for the selected main task.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="max-h-[70vh] space-y-6 overflow-y-auto p-1 pr-4">
            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">Sub-task Title *</Label>
              <Input
                disabled={submitting}
                id="title"
                onChange={(e) => setField('title', e.target.value)}
                placeholder="e.g., Develop login page"
                required
                value={form.title}
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                disabled={submitting}
                id="description"
                onChange={(e) => setField('description', e.target.value)}
                placeholder="Describe the sub-task requirements"
                required
                rows={3}
                value={form.description}
              />
            </div>

            {/* Employee Assignment */}
            <div className="space-y-2">
              <Label>Assigned To (Optional)</Label>
              <Select
                disabled={submitting || loading}
                onValueChange={(value) =>
                  setField('assignedToEmployeeId', value)
                }
                value={form.assignedToEmployeeId}
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={
                      loading ? 'Loading employees...' : 'Select an employee'
                    }
                  />
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

            {/* Date Selection */}
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Start Date (Optional)</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      className="w-full justify-start text-left font-normal"
                      disabled={submitting}
                      variant="outline"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {form.startDate
                        ? format(form.startDate, 'PPP')
                        : 'Pick a date'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      initialFocus
                      mode="single"
                      onSelect={(date) => setField('startDate', date)}
                      selected={form.startDate}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label>Due Date (Optional)</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      className="w-full justify-start text-left font-normal"
                      disabled={submitting}
                      variant="outline"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {form.dueDate
                        ? format(form.dueDate, 'PPP')
                        : 'Pick a date'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      initialFocus
                      mode="single"
                      onSelect={(date) => setField('dueDate', date)}
                      selected={form.dueDate}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {/* Task Dependencies */}
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <TaskSelector
                label="Preceding Tasks (Optional)"
                placeholder="Select preceding tasks..."
                selected={form.proceedingTasksId}
                tasks={availableTasks?.map((task) => ({
                  id: task.id,
                  name: task.title,
                }))}
                toggle={handleProceedingTaskToggle}
              />

              <TaskSelector
                label="Succeeding Tasks (Optional)"
                placeholder="Select succeeding tasks..."
                selected={form.succeedingTasksId}
                tasks={availableTasks?.map((task) => ({
                  id: task.id,
                  name: task.title,
                }))}
                toggle={handleSucceedingTaskToggle}
              />
            </div>

            {/* File Upload */}
            <div className="space-y-2">
              <Label>Supporting Documents (Optional)</Label>
              <FileUploader
                files={form.files}
                setFiles={(files: File[]) => setField('files', files)}
              />
              {form.files.length > 0 && (
                <p className="text-muted-foreground text-sm">
                  {form.files.length} file{form.files.length !== 1 ? 's' : ''}{' '}
                  selected
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
            <Button
              disabled={
                submitting || !form.title.trim() || !form.description.trim()
              }
              type="submit"
            >
              {submitting ? 'Creating...' : 'Create Sub-task'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
