import { format } from 'date-fns';
import { CalendarIcon, Upload, X } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
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
import api from '@/lib/api';
import { authClient } from '@/lib/auth-client';
import { cn } from '@/lib/utils';
import type {
  HalfDayType,
  LeaveRequestResponse,
  LeaveType,
} from '@/types/leave-management';

const LeaveRequestCard = ({ onSubmit }: { onSubmit: () => void }) => {
  const [reason, setReason] = useState<string>('');
  const [type, setType] = useState<LeaveType>('casual');
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [attachment, setAttachment] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isHalfDay, setIsHalfDay] = useState<boolean>(false);
  const [halfDayType, setHalfDayType] = useState<HalfDayType>('first_half');

  const handleFileChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ): void => {
    const file = event.target.files?.[0] || null;

    // Validate file size (10MB max)
    if (file && file.size > 10 * 1024 * 1024) {
      toast.error('File size must be less than 10MB');
      return;
    }

    // Validate file type
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'image/jpeg',
      'image/jpg',
      'image/png',
    ];

    if (file && !allowedTypes.includes(file.type)) {
      toast.error(
        'Invalid file type. Only PDF, DOC, DOCX, JPG, and PNG are allowed'
      );
      return;
    }

    setAttachment(file);
  };

  const removeAttachment = (): void => {
    setAttachment(null);
    const fileInput = document.getElementById('attachment') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  };

  const resetForm = (): void => {
    setReason('');
    setType('casual');
    setStartDate(undefined);
    setEndDate(undefined);
    setAttachment(null);
    setIsHalfDay(false);
    setHalfDayType('first_half');
    const fileInput = document.getElementById('attachment') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  };

  // Handle half-day checkbox change
  const handleHalfDayChange = (checked: boolean): void => {
    setIsHalfDay(checked);

    // If half-day is enabled, set end date to same as start date
    if (checked && startDate) {
      setEndDate(startDate);
    } else if (!checked) {
      // Reset halfDayType when unchecked
      setHalfDayType('first_half');
    }
  };

  // Handle start date change
  const handleStartDateChange = (date: Date | undefined): void => {
    setStartDate(date);

    // If half-day is enabled, automatically set end date to same as start date
    if (isHalfDay && date) {
      setEndDate(date);
    }
  };

  const validateFormData = (): boolean => {
    if (reason.trim() === '' || !startDate || !endDate) {
      toast.error('Please fill in all required fields');
      return false;
    }

    if (endDate < startDate) {
      toast.error('End date must be after start date');
      return false;
    }

    return true;
  };

  const getSessionData = async () => {
    const session = await authClient.getSession();
    const userData = await api.get(`/api/user/${session.data?.user.id}`);

    if (
      !(session.data?.user?.id && userData.data?.data?.data[0].organisationId)
    ) {
      toast.error('User session not found. Please login again.');
      return null;
    }
    return session.data.user;
  };

  const createFormData = (user: {
    id: string;
    organisationId?: string | null | undefined;
  }): FormData => {
    const formData = new FormData();

    formData.append('employeeId', user.id);
    formData.append('organisationId', user.organisationId as string);
    formData.append('startDate', format(startDate as Date, 'yyyy-MM-dd'));
    formData.append('endDate', format(endDate as Date, 'yyyy-MM-dd'));
    formData.append('reason', reason.trim());
    formData.append('type', type);
    formData.append('duration', isHalfDay ? 'half' : 'full');

    if (isHalfDay) {
      formData.append('halfDayType', halfDayType);
    }

    if (attachment) {
      formData.append('file', attachment);
    }

    return formData;
  };

  const submitLeaveRequest = async (formData: FormData): Promise<void> => {
    try {
      const response = await api.post<LeaveRequestResponse>(
        '/api/leave',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      if (response.data.success) {
        toast.success(
          response.data.message || 'Leave request submitted successfully!'
        );
        resetForm();
        onSubmit();
      } else {
        toast.error(response.data.message ?? 'Failed to submit leave request');
      }
    } catch (error) {
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as {
          response?: { data?: { error?: string } };
        };
        toast.error(
          axiosError.response?.data?.error ?? 'Failed to submit leave request'
        );
      }
    }
  };
  const handleError = (error: unknown): void => {
    if (error instanceof Error) {
      toast.error(error.message || 'Failed to submit leave request');
    } else {
      toast.error('An unexpected error occurred');
    }
  };

  const handleSubmit = async (
    event: React.FormEvent<HTMLFormElement>
  ): Promise<void> => {
    event.preventDefault();

    if (!validateFormData()) {
      return;
    }

    try {
      setIsSubmitting(true);

      const user = await getSessionData();
      if (!user) {
        return;
      }

      const formData = createFormData(user);
      await submitLeaveRequest(formData);
    } catch (error) {
      handleError(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Get today's date at midnight for comparison
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return (
    <Card className="w-full">
      <CardHeader className="px-4 sm:px-6">
        <CardTitle className="text-lg sm:text-xl">Request New Leave</CardTitle>
        <CardDescription className="text-sm sm:text-base">
          Submit a new leave request for approval
        </CardDescription>
      </CardHeader>
      <CardContent className="px-4 sm:px-6">
        <form className="space-y-4 sm:space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label className="font-medium text-sm" htmlFor="type">
              Leave Type
            </Label>
            <Select
              disabled={isSubmitting}
              onValueChange={(value: LeaveType) => setType(value)}
              value={type}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select leave type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="casual">Casual Leave</SelectItem>
                <SelectItem value="sick">Sick Leave</SelectItem>
                <SelectItem value="unpaid">Unpaid Leave</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Half Day Leave Checkbox */}
          <div className="flex items-center space-x-2">
            <Checkbox
              checked={isHalfDay}
              disabled={isSubmitting}
              id="halfDay"
              onCheckedChange={handleHalfDayChange}
            />
            <Label
              className="cursor-pointer font-medium text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              htmlFor="halfDay"
            >
              Half Day Leave
            </Label>
          </div>

          {/* Half Day Type Selection - Only show if half day is checked */}
          {isHalfDay && (
            <div className="space-y-2">
              <Label className="font-medium text-sm" htmlFor="halfDayType">
                Half Day Type
              </Label>
              <Select
                disabled={isSubmitting}
                onValueChange={(value: HalfDayType) => setHalfDayType(value)}
                value={halfDayType}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select half day type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="first_half">First Half</SelectItem>
                  <SelectItem value="second_half">Second Half</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label className="font-medium text-sm">Start Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    className={cn(
                      'h-10 w-full justify-start text-left font-normal',
                      !startDate && 'text-muted-foreground'
                    )}
                    disabled={isSubmitting}
                    type="button"
                    variant="outline"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4 flex-shrink-0" />
                    <span className="truncate">
                      {startDate ? format(startDate, 'PPP') : 'Pick a date'}
                    </span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent align="start" className="w-auto p-0">
                  <Calendar
                    disabled={(date) => date < today}
                    initialFocus
                    mode="single"
                    onSelect={handleStartDateChange}
                    selected={startDate}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label className="font-medium text-sm">End Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    className={cn(
                      'h-10 w-full justify-start text-left font-normal',
                      !endDate && 'text-muted-foreground'
                    )}
                    disabled={isSubmitting || isHalfDay}
                    type="button"
                    variant="outline"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4 flex-shrink-0" />
                    <span className="truncate">
                      {endDate ? format(endDate, 'PPP') : 'Pick a date'}
                    </span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent align="start" className="w-auto p-0">
                  <Calendar
                    disabled={(date) => {
                      return (
                        date < today || (startDate ? date < startDate : false)
                      );
                    }}
                    initialFocus
                    mode="single"
                    onSelect={setEndDate}
                    selected={endDate}
                  />
                </PopoverContent>
              </Popover>
              {isHalfDay && (
                <p className="break-words text-muted-foreground text-xs">
                  End date is same as start date for half-day leave
                </p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label className="font-medium text-sm" htmlFor="reason">
              Reason
            </Label>
            <Textarea
              className="min-h-[100px] resize-none"
              disabled={isSubmitting}
              id="reason"
              maxLength={500}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                setReason(e.target.value)
              }
              placeholder="Please provide the reason for your leave request..."
              required
              rows={4}
              value={reason}
            />
            <p className="text-right text-muted-foreground text-xs">
              {reason.length}/500 characters
            </p>
          </div>

          <div className="space-y-2">
            <Label className="font-medium text-sm" htmlFor="attachment">
              Attachment (Optional)
            </Label>
            {attachment ? (
              <div className="flex flex-col gap-3 rounded-md border p-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate font-medium text-sm">
                    {attachment.name}
                  </span>
                  <span className="text-muted-foreground text-xs">
                    {(attachment.size / 1024 / 1024).toFixed(2)} MB
                  </span>
                </div>
                <Button
                  className="w-full sm:w-auto"
                  disabled={isSubmitting}
                  onClick={removeAttachment}
                  size="sm"
                  type="button"
                  variant="ghost"
                >
                  <X className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Remove</span>
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                <Input
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                  className="hidden"
                  disabled={isSubmitting}
                  id="attachment"
                  onChange={handleFileChange}
                  type="file"
                />
                <Button
                  className="h-12 w-full sm:h-10"
                  disabled={isSubmitting}
                  onClick={() => document.getElementById('attachment')?.click()}
                  type="button"
                  variant="outline"
                >
                  <Upload className="mr-2 h-4 w-4 flex-shrink-0" />
                  <span className="truncate">Upload Document</span>
                </Button>
              </div>
            )}
            <p className="break-words text-muted-foreground text-xs">
              Supported formats: PDF, DOC, DOCX, JPG, PNG (Max 10MB)
            </p>
          </div>

          <Button
            className="h-12 w-full font-medium sm:h-10"
            disabled={!(reason.trim() && startDate && endDate) || isSubmitting}
            type="submit"
          >
            {isSubmitting ? (
              <>
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                Submitting...
              </>
            ) : (
              'Submit Leave Request'
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default LeaveRequestCard;
