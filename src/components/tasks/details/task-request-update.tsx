'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import type { TaskRequestDialogProps, TaskRequestStatus } from '@/types/task';

export default function TaskRequestDialog({
  open,
  onOpenChange,
  request,
  onSuccess,
}: TaskRequestDialogProps) {
  const [editStatus, setEditStatus] = useState<TaskRequestStatus>(
    request?.status || 'requested'
  );
  const [editMessage, setEditMessage] = useState(request?.response || '');
  const [saving, setSaving] = useState(false);
  const [editFiles, setEditFiles] = useState<File[]>([]);

  const resetForm = () => {
    setEditMessage(request?.response || '');
    setEditStatus(request?.status || 'requested');
    setEditFiles([]);
  };

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      resetForm();
    }
    onOpenChange(isOpen);
  };

  const saveDialog = async () => {
    if (!(request?.id && editMessage.trim())) {
      return;
    }

    setSaving(true);
    try {
      const session = await authClient.getSession();

      const formData = new FormData();
      formData.append('id', request.id);
      formData.append('status', editStatus);
      formData.append('response', editMessage.trim());
      formData.append('respondedById', session?.data?.user?.id as string);

      for (const file of editFiles) {
        formData.append('files', file);
      }

      const response = await api.put('/api/tasks/request', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to update request');
      }

      toast.success('Request updated successfully');
      onOpenChange(false);
      onSuccess();
    } catch (err) {
      toast.error(`Failed to update request. ${err}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog onOpenChange={handleOpenChange} open={open}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Change status / Add response</DialogTitle>
          <DialogDescription>
            Update the request's status and leave a response visible to the
            requester for auditability.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 gap-4 py-2 sm:grid-cols-3">
          <div className="sm:col-span-1">
            <Label
              className="mb-1 block font-medium text-muted-foreground text-xs"
              htmlFor="status"
            >
              Status
            </Label>
            <Select
              onValueChange={(v: TaskRequestStatus) => setEditStatus(v)}
              value={editStatus}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="requested">Requested</SelectItem>
                <SelectItem value="in_review">In Review</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="sm:col-span-2">
            <Label
              className="mb-1 block font-medium text-muted-foreground text-xs"
              htmlFor="response"
            >
              Response message
            </Label>
            <Textarea
              className="min-h-[120px]"
              onChange={(e) => setEditMessage(e.target.value)}
              placeholder="Provide a reason, next steps, or additional context..."
              required
              value={editMessage}
            />
            <p className="mt-1 text-[11px] text-muted-foreground">
              This message will be shown to the requester and logged for audit
              history.
            </p>
          </div>
        </div>

        {request && (
          <div className="rounded-md border border-border/50 bg-muted/30 p-2 text-muted-foreground text-xs">
            Affects request for {request.type} • Created{' '}
            {new Date(request.createdAt).toLocaleString()}
          </div>
        )}

        <DialogFooter className="mt-2">
          <Button
            disabled={saving}
            onClick={() => onOpenChange(false)}
            variant="secondary"
          >
            Cancel
          </Button>
          <Button
            className="min-w-24"
            disabled={!editMessage.trim() || saving}
            onClick={saveDialog}
          >
            {saving ? 'Saving...' : 'Save'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
