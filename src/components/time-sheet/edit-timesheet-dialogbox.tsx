'use client';

import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Checkbox } from '@/components/ui/checkbox';
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
import { cn } from '@/lib/utils';

interface Project {
  id: string;
  title: string;
}

interface MainTask {
  id: string;
  title: string;
  projectId: string;
}

interface Task {
  id: string;
  title: string;
  mainTaskId: string;
}

export interface TimesheetEntry {
  id: string;
  projectId: string;
  projectName: string;
  mainTaskId: string;
  mainTaskName: string;
  taskId?: string;
  taskName?: string;
  userId: string;
  hours: number;
  description: string;
  onFullDayLeave: boolean;
  onHalfDayLeave: boolean;
  halfDayLeaveType?: 'firstHalf' | 'secondHalf';
  date: Date;
  createdAt: Date;
  updatedAt: Date;
}

interface EditTimesheetDialogProps {
  isOpen: boolean;
  onClose: () => void;
  timesheet: TimesheetEntry | null;
  projects: Project[];
  onSave: (data: UpdateTimesheetData) => void;
  isLoading?: boolean;
}

export interface UpdateTimesheetData {
  id: string;
  projectId: string;
  mainTaskId: string;
  taskId: string | null;
  hours: number;
  description: string;
  onFullDayLeave: boolean;
  onHalfDayLeave: boolean;
  halfDayLeaveType: 'firstHalf' | 'secondHalf' | null;
  date: Date;
}

interface DailySheetApiResponse {
  id: string;
  projectId: string | null;
  mainTaskId: string | null;
  taskId: string | null;
  userId: string;
  organisationId: string;
  hours: string;
  description: string;
  onFullDayLeave: boolean;
  onHalfDayLeave: boolean;
  halfDayLeaveType: 'first_half' | 'second_half' | null;
  date: string;
  createdAt: string;
  updatedAt: string;
}

export default function EditTimesheetDialog({
  isOpen,
  onClose,
  timesheet,
  projects,
  onSave,
  isLoading = false,
}: EditTimesheetDialogProps) {
  const [formData, setFormData] = useState({
    projectId: '',
    mainTaskId: '',
    taskId: null as string | null,
    hours: 8,
    description: '',
    onFullDayLeave: false,
    onHalfDayLeave: false,
    halfDayLeaveType: null as 'firstHalf' | 'secondHalf' | null,
    date: new Date(),
  });

  const [date, setDate] = useState<Date>();
  const [isFetchingData, setIsFetchingData] = useState(false);
  const [mainTasks, setMainTasks] = useState<MainTask[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);

  useEffect(() => {
    // Early return if dependencies don't exist
    if (!(timesheet?.id && isOpen)) {
      return;
    }

    let isMounted = true;

    const transformHalfDayLeaveType = (
      halfDayLeaveType: 'first_half' | 'second_half' | null
    ): 'firstHalf' | 'secondHalf' | null => {
      if (halfDayLeaveType === 'first_half') {
        return 'firstHalf';
      }
      if (halfDayLeaveType === 'second_half') {
        return 'secondHalf';
      }
      return null;
    };

    const transformApiResponseToFormData = (data: DailySheetApiResponse) => ({
      projectId: data.projectId || '',
      mainTaskId: data.mainTaskId || '',
      taskId: data.taskId || null,
      hours: Number.parseFloat(data.hours) || 0,
      description: data.description || '',
      onFullDayLeave: data.onFullDayLeave,
      onHalfDayLeave: data.onHalfDayLeave,
      halfDayLeaveType: transformHalfDayLeaveType(data.halfDayLeaveType),
      date: new Date(data.date),
    });

    const updateFormState = (data: DailySheetApiResponse) => {
      const transformedData = transformApiResponseToFormData(data);
      setFormData(transformedData);
      setDate(transformedData.date);
    };

    const showError = (err: unknown) => {
      const errorMessage =
        err instanceof Error
          ? err.message
          : 'Failed to fetch timesheet details';
      toast.error(errorMessage);
    };

    /**
     * Fetches a timesheet entry from the backend API.
     *
     * If the API call is successful, updates the form state with the fetched data.
     * If the API call fails, shows an error message.
     */
    const fetchTimesheetData = async () => {
      setIsFetchingData(true);

      try {
        const response = await api.get<{
          success: boolean;
          message: string;
          data: DailySheetApiResponse;
        }>(`/api/daily-sheet/${timesheet.id}`);

        if (isMounted && response.data.success && response.data.data) {
          updateFormState(response.data.data);
        }
      } catch (err) {
        if (isMounted) {
          showError(err);
        }
      } finally {
        if (isMounted) {
          setIsFetchingData(false);
        }
      }
    };

    fetchTimesheetData();

    return () => {
      isMounted = false;
    };
  }, [timesheet?.id, isOpen]);

  useEffect(() => {
    const fetchMainTasks = async () => {
      if (!formData.projectId) {
        setMainTasks([]);
        return;
      }

      try {
        const response = await api.get<{
          success: boolean;
          data: MainTask[];
        }>(`/api/maintask?projectId=${formData.projectId}`);

        if (response.data.success) {
          setMainTasks(response.data.data);
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to fetch main tasks';
        toast.error(errorMessage);
        setMainTasks([]);
      }
    };

    fetchMainTasks();
  }, [formData.projectId]);

  // Fetch tasks when mainTaskId changes
  useEffect(() => {
    const fetchTasks = async () => {
      if (!formData.mainTaskId) {
        setTasks([]);
        return;
      }

      try {
        const response = await api.get<{
          success: boolean;
          data: Task[];
        }>(`/api/tasks?mainTaskId=${formData.mainTaskId}`);

        if (response.data.success) {
          setTasks(response.data.data);
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to fetch tasks';
        toast.error(errorMessage);
        setTasks([]);
      }
    };

    fetchTasks();
  }, [formData.mainTaskId]);

  // Reset form when dialog closes
  useEffect(() => {
    if (!isOpen) {
      setFormData({
        projectId: '',
        mainTaskId: '',
        taskId: null,
        hours: 8,
        description: '',
        onFullDayLeave: false,
        onHalfDayLeave: false,
        halfDayLeaveType: null,
        date: new Date(),
      });
      setDate(undefined);
    }
  }, [isOpen]);

  const filteredMainTasks = mainTasks.filter(
    (task) => task.projectId === formData.projectId
  );
  const filteredTasks = tasks.filter(
    (task) => task.mainTaskId === formData.mainTaskId
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!(timesheet && date)) {
      return;
    }

    const updateData: UpdateTimesheetData = {
      id: timesheet.id,
      projectId: formData.projectId,
      mainTaskId: formData.mainTaskId,
      taskId: formData.taskId,
      hours: formData.hours,
      description: formData.description,
      onFullDayLeave: formData.onFullDayLeave,
      onHalfDayLeave: formData.onHalfDayLeave,
      halfDayLeaveType: formData.onHalfDayLeave
        ? formData.halfDayLeaveType
        : null,
      date,
    };

    onSave(updateData);
  };

  const handleProjectChange = (projectId: string) => {
    setFormData((prev) => ({
      ...prev,
      projectId,
      mainTaskId: '',
      taskId: null,
    }));
  };

  const handleMainTaskChange = (mainTaskId: string) => {
    setFormData((prev) => ({
      ...prev,
      mainTaskId,
      taskId: null,
    }));
  };

  const handleFullDayLeaveChange = (checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      onFullDayLeave: checked,
      onHalfDayLeave: checked ? false : prev.onHalfDayLeave,
      halfDayLeaveType: checked ? null : prev.halfDayLeaveType,
      hours: checked ? 0 : 8,
    }));
  };

  const handleHalfDayLeaveChange = (checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      onHalfDayLeave: checked,
      onFullDayLeave: checked ? false : prev.onFullDayLeave,
      halfDayLeaveType: checked ? 'firstHalf' : null,
      hours: checked ? 4 : 8,
    }));
  };

  return (
    <Dialog onOpenChange={onClose} open={isOpen}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit Timesheet Entry</DialogTitle>
        </DialogHeader>

        {isFetchingData ? (
          <div className="flex items-center justify-center py-8">
            <p className="text-muted-foreground text-sm">
              Loading timesheet data...
            </p>
          </div>
        ) : (
          <form className="space-y-4" onSubmit={handleSubmit}>
            {/* Primary Fields - 3 columns */}
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              <div className="space-y-1">
                <Label className="font-medium text-xs">Project *</Label>
                <Select
                  disabled={formData.onFullDayLeave}
                  onValueChange={handleProjectChange}
                  value={formData.projectId}
                >
                  <SelectTrigger className="h-8">
                    <SelectValue placeholder="Select project" />
                  </SelectTrigger>
                  <SelectContent>
                    {projects?.map((project) => (
                      <SelectItem key={project.id} value={project.id}>
                        {project.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label className="font-medium text-xs">Main Task *</Label>
                <Select
                  disabled={!formData.projectId || formData.onFullDayLeave}
                  onValueChange={handleMainTaskChange}
                  value={formData.mainTaskId}
                >
                  <SelectTrigger className="h-8">
                    <SelectValue placeholder="Select main task" />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredMainTasks?.map((task) => (
                      <SelectItem key={task.id} value={task.id}>
                        {task.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label className="font-medium text-xs">Task</Label>
                <Select
                  disabled={!formData.mainTaskId || formData.onFullDayLeave}
                  onValueChange={(value) =>
                    setFormData((prev) => ({
                      ...prev,
                      taskId: value === '__none__' ? null : value,
                    }))
                  }
                  value={formData.taskId || '__none__'}
                >
                  <SelectTrigger className="h-8">
                    <SelectValue placeholder="Select task" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">
                      <span className="text-muted-foreground italic">
                        No specific task
                      </span>
                    </SelectItem>
                    {filteredTasks?.map((task) => (
                      <SelectItem key={task.id} value={task.id}>
                        {task.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Date, Hours, Leave Options */}
            <div className="grid grid-cols-1 items-end gap-3 md:grid-cols-4">
              <div className="space-y-1">
                <Label className="font-medium text-xs">Date *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      className={cn(
                        'h-8 w-full justify-start text-left font-normal text-xs',
                        !date && 'text-muted-foreground'
                      )}
                      variant="outline"
                    >
                      <CalendarIcon className="mr-1 h-3 w-3" />
                      {date ? format(date, 'dd/MM/yy') : 'Pick date'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      initialFocus
                      mode="single"
                      onSelect={setDate}
                      required
                      selected={date}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-1">
                <Label className="font-medium text-xs">Hours *</Label>
                <Input
                  className="h-8 text-xs"
                  disabled={formData.onFullDayLeave}
                  max="24"
                  min="0"
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      hours: Number.parseFloat(e.target.value) || 0,
                    }))
                  }
                  step="0.5"
                  type="number"
                  value={formData.hours}
                />
              </div>

              <div className="flex h-8 items-center space-x-2">
                <Checkbox
                  checked={formData.onFullDayLeave}
                  id="editFullDay"
                  onCheckedChange={handleFullDayLeaveChange}
                />
                <Label className="text-xs" htmlFor="editFullDay">
                  Full Day Leave
                </Label>
              </div>

              <div className="flex h-8 items-center space-x-2">
                <Checkbox
                  checked={formData.onHalfDayLeave}
                  id="editHalfDay"
                  onCheckedChange={handleHalfDayLeaveChange}
                />
                <Label className="text-xs" htmlFor="editHalfDay">
                  Half Day
                </Label>
              </div>
            </div>

            {formData.onHalfDayLeave && (
              <div className="space-y-1">
                <Label className="font-medium text-xs">Leave Type *</Label>
                <Select
                  onValueChange={(value: 'firstHalf' | 'secondHalf') =>
                    setFormData((prev) => ({
                      ...prev,
                      halfDayLeaveType: value,
                    }))
                  }
                  value={formData.halfDayLeaveType || undefined}
                >
                  <SelectTrigger className="h-8 w-48">
                    <SelectValue placeholder="Select half" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="firstHalf">First Half</SelectItem>
                    <SelectItem value="secondHalf">Second Half</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Description */}
            <div className="space-y-1">
              <Label className="font-medium text-xs">Description *</Label>
              <Textarea
                className="resize-none text-xs"
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                placeholder="Describe your work..."
                rows={3}
                value={formData.description}
              />
            </div>

            <DialogFooter className="gap-2">
              <Button
                disabled={isLoading}
                onClick={onClose}
                type="button"
                variant="outline"
              >
                Cancel
              </Button>
              <Button
                disabled={
                  isLoading ||
                  isFetchingData ||
                  !date ||
                  !(formData.onFullDayLeave || formData.projectId) ||
                  !(formData.onFullDayLeave || formData.mainTaskId) ||
                  !formData.description.trim()
                }
                type="submit"
              >
                {isLoading ? 'Saving...' : 'Save Changes'}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
