'use client';

import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Checkbox } from '@/components/ui/checkbox';
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
import { cn } from '@/lib/utils';
import type {
  AddTimesheetFormProps,
  TimesheetFormData,
} from '@/types/dailysheet';
import { Card } from '../ui/card';

export default function AddTimesheetForm({
  projects,
  mainTasks,
  tasks,
  onSubmit,
  onMainTaskSelect,
  onProjectSelect,
}: AddTimesheetFormProps) {
  const [formData, setFormData] = useState<TimesheetFormData>({
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

  const [date, setDate] = useState<Date>(new Date());

  const filteredMainTasks = mainTasks.filter(
    (task) => task.projectId === formData.projectId
  );
  const filteredTasks = tasks.filter(
    (task) => task.mainTaskId === formData.mainTaskId
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const submitData = {
      ...formData,
      date: date || new Date(),
      taskId: formData.taskId || null,
      halfDayLeaveType: formData.onHalfDayLeave
        ? formData.halfDayLeaveType
        : null,
    };

    onSubmit(submitData);
  };

  const handleProjectChange = (projectId: string) => {
    setFormData((prev) => ({
      ...prev,
      projectId,
      taskCategoryId: '',
      taskId: null,
    }));
    onProjectSelect(projectId);
  };

  const handleMainTaskChange = (taskCategoryId: string) => {
    setFormData((prev) => ({
      ...prev,
      mainTaskId: taskCategoryId,
      taskId: null,
    }));
    onMainTaskSelect(taskCategoryId);
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
    <Card className="w-full rounded-lg border bg-card p-4">
      <div className="mb-4">
        <h2 className="font-semibold text-lg">Add Timesheet Entry</h2>
        <p className="text-muted-foreground text-xs">
          Fill in your daily work details
        </p>
      </div>

      <form className="space-y-3" onSubmit={handleSubmit}>
        {/* Primary Fields - 3 columns */}
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <div className="space-y-1">
            <Label className="font-medium text-xs">Project *</Label>
            <Select
              onValueChange={handleProjectChange}
              value={formData.projectId || undefined}
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
              disabled={!formData.projectId}
              onValueChange={handleMainTaskChange}
              value={formData.mainTaskId || undefined}
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
              disabled={!formData.mainTaskId}
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

        <div className="grid grid-cols-1 items-end gap-3 md:grid-cols-4 lg:grid-cols-6">
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
                  onSelect={(selectedDate) =>
                    setDate(selectedDate || new Date())
                  }
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
              onCheckedChange={handleFullDayLeaveChange}
            />
            <Label className="text-xs" htmlFor="fullDay">
              Full Day Leave
            </Label>
          </div>

          <div className="flex h-8 items-center space-x-2">
            <Checkbox
              checked={formData.onHalfDayLeave}
              onCheckedChange={handleHalfDayLeaveChange}
            />
            <Label className="text-xs" htmlFor="halfDay">
              Half Day
            </Label>
          </div>

          {formData.onHalfDayLeave && (
            <div className="col-span-2 space-y-1">
              <Label className="font-medium text-xs">Leave Type *</Label>
              <Select
                onValueChange={(value: 'firstHalf' | 'secondHalf') =>
                  setFormData((prev) => ({ ...prev, halfDayLeaveType: value }))
                }
                value={formData.halfDayLeaveType || undefined}
              >
                <SelectTrigger className="h-8">
                  <SelectValue placeholder="Select half" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="firstHalf">First Half</SelectItem>
                  <SelectItem value="secondHalf">Second Half</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        {/* Description - Full width but compact */}
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
            rows={2}
            value={formData.description}
          />
        </div>

        {/* Action Buttons - Compact */}
        <div className="flex gap-2 pt-2">
          <Button className="flex-1" size="sm" type="submit">
            Add Entry
          </Button>
          <Button
            onClick={() => {
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
              setDate(new Date());
            }}
            size="sm"
            type="button"
            variant="outline"
          >
            Reset
          </Button>
        </div>
      </form>
    </Card>
  );
}
