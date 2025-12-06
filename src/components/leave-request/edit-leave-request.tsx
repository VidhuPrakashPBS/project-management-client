'use client';

import { format } from 'date-fns';
import { CalendarIcon, Upload, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { authClient } from '@/lib/auth-client';
import { cn } from '@/lib/utils';
import type { LeaveType } from '@/types/leave-management';

type HalfDayType = 'first_half' | 'second_half';

interface EditLeaveDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  leaveRequestId: string;
  onSuccess: () => void;
}

const useLeaveRequestData = (
  open: boolean,
  leaveRequestId: string,
  onOpenChange: (isOpen: boolean) => void
) => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [reason, setReason] = useState<string>('');
  const [type, setType] = useState<LeaveType>('casual');
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [isHalfDay, setIsHalfDay] = useState<boolean>(false);
  const [halfDayType, setHalfDayType] = useState<HalfDayType>('first_half');
  const [existingFiles, setExistingFiles] = useState<
    Array<{
      id: string;
      url: string;
      originalFileName: string;
      fileType: string;
    }>
  >([]);

  useEffect(() => {
    const handleSuccessResponse = (leaveData: {
      reason: string;
      type: LeaveType;
      startDate: string;
      endDate: string;
      duration: string;
      halfDayType: HalfDayType | null;
      files: Array<{
        id: string;
        url: string;
        originalFileName: string;
        fileType: string;
      }>;
    }) => {
      setReason(leaveData.reason);
      setType(leaveData.type);
      setStartDate(new Date(leaveData.startDate));
      setEndDate(new Date(leaveData.endDate));
      setIsHalfDay(leaveData.duration === 'half');
      setHalfDayType(leaveData.halfDayType || 'first_half');
      setExistingFiles(leaveData.files || []);
    };

    const handleError = (error: unknown) => {
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Failed to fetch leave request';
      toast.error(errorMessage);
      onOpenChange(false);
    };

    const fetchLeaveRequest = async (): Promise<void> => {
      if (!(open && leaveRequestId)) {
        return;
      }

      setIsLoading(true);

      try {
        const response = await api.get(`/api/leave/${leaveRequestId}`);

        if (response.data.success) {
          handleSuccessResponse(response.data.data);
        } else {
          toast.error('Failed to load leave request data');
          onOpenChange(false);
        }
      } catch (error) {
        handleError(error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLeaveRequest();
  }, [open, leaveRequestId, onOpenChange]);

  return {
    isLoading,
    reason,
    setReason,
    type,
    setType,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    isHalfDay,
    setIsHalfDay,
    halfDayType,
    setHalfDayType,
    existingFiles,
  };
};

const useFileUpload = () => {
  const [attachment, setAttachment] = useState<File | null>(null);

  const validateFile = (file: File): boolean => {
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File size must be less than 10MB');
      return false;
    }

    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'image/jpeg',
      'image/jpg',
      'image/png',
    ];

    if (!allowedTypes.includes(file.type)) {
      toast.error(
        'Invalid file type. Only PDF, DOC, DOCX, JPG, and PNG are allowed'
      );
      return false;
    }

    return true;
  };

  const handleFileChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ): void => {
    const file = event.target.files?.[0] || null;

    if (file && validateFile(file)) {
      setAttachment(file);
    }
  };

  const removeAttachment = (): void => {
    setAttachment(null);
    const fileInput = document.getElementById(
      'edit-attachment'
    ) as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  };

  return { attachment, handleFileChange, removeAttachment };
};

const useLeaveRequestSubmission = (
  leaveRequestId: string,
  onOpenChange: (open: boolean) => void,
  onSuccess: () => void
) => {
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const validateSession = async () => {
    const session = await authClient.getSession();
    const userData = await api.get(`/api/user/${session.data?.user.id}`);

    if (
      !(session.data?.user?.id && userData.data?.data?.data[0].organisationId)
    ) {
      toast.error('User session not found. Please login again.');
      return null;
    }
    return {
      id: session.data.user.id,
      organisationId: userData.data?.data?.data[0].organisationId,
    };
  };

  const submitLeaveRequest = async (formData: FormData) => {
    const response = await api.put(`/api/leave/${leaveRequestId}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    if (response.data.success) {
      toast.success(
        response.data.message || 'Leave request updated successfully!'
      );
      onOpenChange(false);
      onSuccess();
    } else {
      toast.error('Failed to update leave request');
    }
  };

  const handleSubmit = async (formData: FormData): Promise<void> => {
    try {
      setIsSubmitting(true);

      const user = await validateSession();
      if (!user) {
        return;
      }

      await submitLeaveRequest(formData);
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message || 'Failed to update leave request');
      } else {
        toast.error('An unexpected error occurred');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return { isSubmitting, handleSubmit };
};

const LoadingSpinner = () => (
  <div className="flex items-center justify-center py-8">
    <div className="text-center">
      <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600" />
      <p className="text-muted-foreground text-sm">Loading leave request...</p>
    </div>
  </div>
);

const LeaveTypeSelector = ({
  type,
  setType,
  isSubmitting,
}: {
  type: LeaveType;
  setType: (value: LeaveType) => void;
  isSubmitting: boolean;
}) => (
  <div className="space-y-2">
    <Label htmlFor="edit-type">Leave Type</Label>
    <Select
      disabled={isSubmitting}
      onValueChange={(value: LeaveType) => setType(value)}
      value={type}
    >
      <SelectTrigger>
        <SelectValue placeholder="Select leave type" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="casual">Casual Leave</SelectItem>
        <SelectItem value="sick">Sick Leave</SelectItem>
        <SelectItem value="unpaid">Unpaid Leave</SelectItem>
      </SelectContent>
    </Select>
  </div>
);

const HalfDaySelector = ({
  isHalfDay,
  halfDayType,
  setHalfDayType,
  onHalfDayChange,
  isSubmitting,
}: {
  isHalfDay: boolean;
  halfDayType: HalfDayType;
  setHalfDayType: (value: HalfDayType) => void;
  onHalfDayChange: (checked: boolean) => void;
  isSubmitting: boolean;
}) => (
  <>
    <div className="flex items-center space-x-2">
      <Checkbox
        checked={isHalfDay}
        disabled={isSubmitting}
        id="edit-halfDay"
        onCheckedChange={onHalfDayChange}
      />
      <Label
        className="cursor-pointer font-medium text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
        htmlFor="edit-halfDay"
      >
        Half Day Leave
      </Label>
    </div>

    {isHalfDay && (
      <div className="space-y-2">
        <Label htmlFor="edit-halfDayType">Half Day Type</Label>
        <Select
          disabled={isSubmitting}
          onValueChange={(value: HalfDayType) => setHalfDayType(value)}
          value={halfDayType}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select half day type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="first_half">First Half</SelectItem>
            <SelectItem value="second_half">Second Half</SelectItem>
          </SelectContent>
        </Select>
      </div>
    )}
  </>
);

const DateSelector = ({
  startDate,
  endDate,
  isHalfDay,
  onStartDateChange,
  onEndDateChange,
  isSubmitting,
  today,
}: {
  startDate: Date | undefined;
  endDate: Date | undefined;
  isHalfDay: boolean;
  onStartDateChange: (date: Date | undefined) => void;
  onEndDateChange: (date: Date | undefined) => void;
  isSubmitting: boolean;
  today: Date;
}) => (
  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
    <div className="space-y-2">
      <Label>Start Date</Label>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            className={cn(
              'w-full justify-start text-left font-normal',
              !startDate && 'text-muted-foreground'
            )}
            disabled={isSubmitting}
            variant="outline"
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {startDate ? format(startDate, 'PPP') : 'Pick a date'}
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-auto p-0">
          <Calendar
            disabled={(date) => date < today}
            initialFocus
            mode="single"
            onSelect={onStartDateChange}
            selected={startDate}
          />
        </PopoverContent>
      </Popover>
    </div>

    <div className="space-y-2">
      <Label>End Date</Label>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            className={cn(
              'w-full justify-start text-left font-normal',
              !endDate && 'text-muted-foreground'
            )}
            disabled={isSubmitting || isHalfDay}
            variant="outline"
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {endDate ? format(endDate, 'PPP') : 'Pick a date'}
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-auto p-0">
          <Calendar
            disabled={(date) => {
              return date < today || (startDate ? date < startDate : false);
            }}
            initialFocus
            mode="single"
            onSelect={onEndDateChange}
            selected={endDate}
          />
        </PopoverContent>
      </Popover>
      {isHalfDay && (
        <p className="text-muted-foreground text-xs">
          End date is same as start date for half-day leave
        </p>
      )}
    </div>
  </div>
);

const ReasonInput = ({
  reason,
  setReason,
  isSubmitting,
}: {
  reason: string;
  setReason: (value: string) => void;
  isSubmitting: boolean;
}) => (
  <div className="space-y-2">
    <Label htmlFor="edit-reason">Reason</Label>
    <Textarea
      disabled={isSubmitting}
      id="edit-reason"
      maxLength={500}
      onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
        setReason(e.target.value)
      }
      placeholder="Please provide the reason for your leave request..."
      required
      rows={4}
      value={reason}
    />
    <p className="text-muted-foreground text-xs">
      {reason.length}/500 characters
    </p>
  </div>
);

const ExistingFiles = ({
  files,
}: {
  files: Array<{
    id: string;
    url: string;
    originalFileName: string;
    fileType: string;
  }>;
}) => (
  <div className="space-y-2">
    <Label>Current Attachments</Label>
    <div className="space-y-2">
      {files?.map((file) => (
        <a
          className="flex items-center gap-2 rounded-md border p-3 text-blue-600 text-sm hover:bg-gray-50"
          href={file.url}
          key={file.id}
          rel="noopener noreferrer"
          target="_blank"
        >
          <span>{file.originalFileName}</span>
        </a>
      ))}
    </div>
  </div>
);

const AttachmentUpload = ({
  attachment,
  existingFiles,
  onFileChange,
  onRemoveAttachment,
  isSubmitting,
}: {
  attachment: File | null;
  existingFiles: Array<{ id: string }>;
  onFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveAttachment: () => void;
  isSubmitting: boolean;
}) => (
  <div className="space-y-2">
    <Label htmlFor="edit-attachment">
      {existingFiles.length > 0
        ? 'Replace Attachment (Optional)'
        : 'New Attachment (Optional)'}
    </Label>
    {attachment ? (
      <div className="flex items-center justify-between rounded-md border p-3">
        <div className="flex flex-col">
          <span className="text-sm">{attachment.name}</span>
          <span className="text-muted-foreground text-xs">
            {(attachment.size / 1024 / 1024).toFixed(2)} MB
          </span>
        </div>
        <Button
          disabled={isSubmitting}
          onClick={onRemoveAttachment}
          size="sm"
          type="button"
          variant="ghost"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    ) : (
      <div className="flex items-center gap-2">
        <Input
          accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
          className="hidden"
          disabled={isSubmitting}
          id="edit-attachment"
          onChange={onFileChange}
          type="file"
        />
        <Button
          className="w-full"
          disabled={isSubmitting}
          onClick={() => document.getElementById('edit-attachment')?.click()}
          type="button"
          variant="outline"
        >
          <Upload className="mr-2 h-4 w-4" />
          {existingFiles.length > 0 ? 'Upload New Document' : 'Upload Document'}
        </Button>
      </div>
    )}
    <p className="text-muted-foreground text-xs">
      Supported formats: PDF, DOC, DOCX, JPG, PNG (Max 10MB)
    </p>
  </div>
);

const useEditLeaveHandlers = (
  startDate: Date | undefined,
  setStartDate: (date: Date | undefined) => void,
  setEndDate: (date: Date | undefined) => void,
  setIsHalfDay: (value: boolean) => void,
  setHalfDayType: (value: HalfDayType) => void,
  isHalfDay: boolean,
  reason: string,
  endDate: Date | undefined
) => {
  const handleHalfDayChange = (checked: boolean): void => {
    setIsHalfDay(checked);

    if (checked && startDate) {
      setEndDate(startDate);
    } else if (!checked) {
      setHalfDayType('first_half');
    }
  };

  const handleStartDateChange = (date: Date | undefined): void => {
    setStartDate(date);

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

  return { handleHalfDayChange, handleStartDateChange, validateFormData };
};

const EditLeaveDialog = ({
  open,
  onOpenChange,
  leaveRequestId,
  onSuccess,
}: EditLeaveDialogProps) => {
  const {
    isLoading,
    reason,
    setReason,
    type,
    setType,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    isHalfDay,
    setIsHalfDay,
    halfDayType,
    setHalfDayType,
    existingFiles,
  } = useLeaveRequestData(open, leaveRequestId, onOpenChange);

  const { attachment, handleFileChange, removeAttachment } = useFileUpload();
  const { isSubmitting, handleSubmit: submitRequest } =
    useLeaveRequestSubmission(leaveRequestId, onOpenChange, onSuccess);

  const { handleHalfDayChange, handleStartDateChange, validateFormData } =
    useEditLeaveHandlers(
      startDate,
      setStartDate,
      setEndDate,
      setIsHalfDay,
      setHalfDayType,
      isHalfDay,
      reason,
      endDate
    );

  const createFormData = () => {
    const formData = new FormData();
    formData.append('id', leaveRequestId);
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

  const handleSubmit = async (
    event: React.FormEvent<HTMLFormElement>
  ): Promise<void> => {
    event.preventDefault();

    if (!validateFormData()) {
      return;
    }

    const formData = createFormData();
    await submitRequest(formData);
  };

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Edit Leave Request</DialogTitle>
          <DialogDescription>
            Update your leave request details and submit for approval
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <LoadingSpinner />
        ) : (
          <form className="space-y-4" onSubmit={handleSubmit}>
            <LeaveTypeSelector
              isSubmitting={isSubmitting}
              setType={setType}
              type={type}
            />

            <HalfDaySelector
              halfDayType={halfDayType}
              isHalfDay={isHalfDay}
              isSubmitting={isSubmitting}
              onHalfDayChange={handleHalfDayChange}
              setHalfDayType={setHalfDayType}
            />

            <DateSelector
              endDate={endDate}
              isHalfDay={isHalfDay}
              isSubmitting={isSubmitting}
              onEndDateChange={setEndDate}
              onStartDateChange={handleStartDateChange}
              startDate={startDate}
              today={today}
            />

            <ReasonInput
              isSubmitting={isSubmitting}
              reason={reason}
              setReason={setReason}
            />

            {existingFiles.length > 0 && (
              <ExistingFiles files={existingFiles} />
            )}

            <AttachmentUpload
              attachment={attachment}
              existingFiles={existingFiles}
              isSubmitting={isSubmitting}
              onFileChange={handleFileChange}
              onRemoveAttachment={removeAttachment}
            />

            <div className="flex justify-end gap-2 pt-4">
              <Button
                disabled={isSubmitting}
                onClick={() => onOpenChange(false)}
                type="button"
                variant="outline"
              >
                Cancel
              </Button>
              <Button
                disabled={
                  !(reason.trim() && startDate && endDate) || isSubmitting
                }
                type="submit"
              >
                {isSubmitting ? 'Updating...' : 'Update Leave Request'}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default EditLeaveDialog;
