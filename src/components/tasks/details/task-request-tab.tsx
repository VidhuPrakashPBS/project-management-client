'use client';

import { Paperclip, X } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import type { TaskRequest, TaskRequestFilePreview } from '@/types/task';
import TaskRequestDialog from './task-request-update';

type TaskRequestType = 'date extention' | 'reassign' | 'other';
type TaskRequestStatus = 'requested' | 'in_review' | 'approved' | 'rejected';

export default function TaskRequestsTab({
  taskId,
  hasCreatePermission,
  hasUpdatePermission,
  hasDeletePermission,
}: {
  taskId: string;
  hasCreatePermission: boolean;
  hasUpdatePermission: boolean;
  hasDeletePermission: boolean;
}) {
  const [requests, setRequests] = useState<TaskRequest[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [type, setType] = useState<TaskRequestType>('date extention');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [filePreviews, setFilePreviews] = useState<TaskRequestFilePreview[]>(
    []
  );
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<TaskRequest | null>(
    null
  );
  const [filter, setFilter] = useState<TaskRequestStatus | 'all'>('all');

  /**
   * Format a file size in bytes to a human-readable string.
   * @param bytes The file size in bytes.
   * @returns A string representing the file size, e.g. "1.23 KB".
   */
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) {
      return '0 Bytes';
    }
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${Number.parseFloat((bytes / k ** i).toFixed(2))} ${sizes[i]}`;
  };

  /**
   * Handles file selection event from file uploader.
   * If selectedFiles is null, it does nothing.
   * Otherwise, it creates a new array of FilePreview objects from the selected files
   * and updates the state of files and filePreviews.
   */
  const handleFileSelect = (selectedFiles: FileList | null) => {
    if (!selectedFiles) {
      return;
    }

    const fileArray = Array.from(selectedFiles);
    const newPreviews: TaskRequestFilePreview[] = fileArray?.map(
      (file, idx) => ({
        id: `${Date.now()}-${idx}`,
        name: file.name,
        file,
        size: formatFileSize(file.size),
      })
    );

    setFiles((prev) => [...prev, ...fileArray]);
    setFilePreviews((prev) => [...prev, ...newPreviews]);
  };

  /**
   * Removes a file from the file previews and files state.
   * @param {string} id - The id of the file to be removed.
   */
  const removeFile = (id: string) => {
    setFilePreviews((prev) => {
      const updated = prev.filter((f) => f.id !== id);
      setFiles(updated?.map((f) => f.file));
      return updated;
    });
  };

  const resetForm = () => {
    setDescription('');
    setType('date extention');
    setFiles([]);
    setFilePreviews([]);
  };

  /*
   * fetch requests by task id
   */
  const fetchRequests = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params: {
        taskId: string;
        status?: string;
      } = { taskId };
      if (filter !== 'all') {
        params.status = filter;
      }

      const response = await api.get('/api/tasks/request/list', {
        params,
      });

      if (response.data.success) {
        setRequests(response.data.data);
      } else {
        throw new Error(response.data.message || 'Failed to fetch requests');
      }
    } catch (err) {
      toast.error(`Something went wrong: ${err}`);
    } finally {
      setLoading(false);
    }
  }, [taskId, filter]);

  useEffect(() => {
    if (taskId) {
      fetchRequests();
    }
  }, [fetchRequests, taskId]);

  const typeBadge = (t: TaskRequestType) => {
    const base =
      'uppercase tracking-wide text-[10px] px-1.5 py-0.5 rounded border';
    switch (t) {
      case 'date extention':
        return `${base} border-amber-200 text-amber-900 dark:border-amber-900/40 dark:text-amber-200 bg-amber-500/10`;
      case 'reassign':
        return `${base} border-blue-200 text-blue-900 dark:border-blue-900/40 dark:text-blue-200 bg-blue-500/10`;
      default:
        return `${base} border-gray-200 text-gray-900 dark:border-gray-700 dark:text-gray-200 bg-gray-500/10`;
    }
  };

  const getDotClass = (s: TaskRequestStatus) => {
    switch (s) {
      case 'approved':
        return 'bg-emerald-500';
      case 'rejected':
        return 'bg-rose-500';
      case 'in_review':
        return 'bg-yellow-500';
      default:
        return 'bg-sky-500';
    }
  };

  const getSchemeClass = (s: TaskRequestStatus) => {
    switch (s) {
      case 'approved':
        return 'border-emerald-200 text-emerald-900 dark:border-emerald-900/40 dark:text-emerald-200 bg-emerald-500/10';
      case 'rejected':
        return 'border-rose-200 text-rose-900 dark:border-rose-900/40 dark:text-rose-200 bg-rose-500/10';
      case 'in_review':
        return 'border-yellow-200 text-yellow-900 dark:border-yellow-900/40 dark:text-yellow-200 bg-yellow-500/10';
      default:
        return 'border-sky-200 text-sky-900 dark:border-sky-900/40 dark:text-sky-200 bg-sky-500/10';
    }
  };

  const statusBadge = (s: TaskRequestStatus) => {
    const base =
      'inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-wide';
    return (
      <span className={`${base} ${getSchemeClass(s)}`}>
        <span className={`h-1.5 w-1.5 rounded-full ${getDotClass(s)}`} />
        {s.replace('_', ' ')}
      </span>
    );
  };

  const filtered = requests.filter((r) =>
    filter === 'all' ? true : r.status === filter
  );

  const onSubmitNew = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) {
      return;
    }

    setSubmitting(true);
    try {
      const session = await authClient.getSession();

      const formData = new FormData();
      formData.append('taskId', taskId);
      formData.append('type', type);
      formData.append('description', description.trim());
      formData.append('requestedById', session?.data?.user?.id as string);

      for (const file of files) {
        formData.append('files[]', file);
      }

      const response = await api.post('/api/tasks/request', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to create request');
      }

      toast.success('Request created successfully');
      resetForm();
      await fetchRequests();
    } catch (err) {
      toast.error(`Failed to create request. ${err}`);
    } finally {
      setSubmitting(false);
    }
  };

  const openDialogFor = (r: TaskRequest) => {
    setSelectedRequest(r);
    setDialogOpen(true);
  };

  const deleteRequest = async (requestId: string) => {
    try {
      const response = await api.delete(`/api/tasks/request/${requestId}`);

      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to delete request');
      }

      toast.success('Request deleted successfully');
      await fetchRequests();
    } catch (err) {
      toast.error(`Failed to delete request. ${err}`);
    }
  };
  const handleDialogSuccess = async () => {
    setSelectedRequest(null);
    await fetchRequests();
  };
  if (loading) {
    return (
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <CardHeader className="py-3">
          <CardTitle className="text-base">Employee Requests</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center p-8">
            <div className="h-8 w-8 animate-spin rounded-full border-primary border-b-2" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <CardHeader className="py-3">
          <CardTitle className="text-base">Employee Requests</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md bg-destructive/15 p-4">
            <div className="text-destructive text-sm">Error: {error}</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
      <CardHeader className="py-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Employee Requests</CardTitle>
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground text-xs">
              {requests.length} total
            </span>
            <div className="hidden items-center gap-1 sm:flex">
              <Button
                onClick={() => setFilter('all')}
                size="sm"
                type="button"
                variant={filter === 'all' ? 'default' : 'outline'}
              >
                All
              </Button>
              <Button
                onClick={() => setFilter('requested')}
                size="sm"
                type="button"
                variant={filter === 'requested' ? 'default' : 'outline'}
              >
                Requested
              </Button>
              <Button
                onClick={() => setFilter('in_review')}
                size="sm"
                type="button"
                variant={filter === 'in_review' ? 'default' : 'outline'}
              >
                In Review
              </Button>
              <Button
                onClick={() => setFilter('approved')}
                size="sm"
                type="button"
                variant={filter === 'approved' ? 'default' : 'outline'}
              >
                Approved
              </Button>
              <Button
                onClick={() => setFilter('rejected')}
                size="sm"
                type="button"
                variant={filter === 'rejected' ? 'default' : 'outline'}
              >
                Rejected
              </Button>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {filtered.length ? (
          <ul className="space-y-2">
            {filtered?.map((r) => (
              <li
                className="rounded-md border border-border/50 bg-background/50 p-3 transition-colors focus-within:ring-2 focus-within:ring-ring hover:bg-accent/40"
                key={r.id}
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className={typeBadge(r.type)}>{r.type}</span>
                  {statusBadge(r.status)}
                  <span className="text-muted-foreground text-xs">
                    Requested by {r.requestedBy.name} •{' '}
                    {new Date(r.createdAt).toLocaleString()}
                  </span>
                </div>

                <p className="mt-2 line-clamp-3 text-foreground text-sm">
                  {r.description}
                </p>

                {r.files && r.files.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {r?.files?.map((file) => (
                      <a
                        className="inline-flex items-center gap-1 rounded border border-border/60 bg-background/70 px-2 py-1 text-xs transition-colors hover:bg-accent hover:text-accent-foreground"
                        href={file.url}
                        key={file.id}
                        rel="noopener noreferrer"
                        target="_blank"
                        title={file.originalFilename}
                      >
                        <Paperclip className="h-3.5 w-3.5" />
                        <span className="max-w-[12rem] truncate">
                          {file.originalFilename}
                        </span>
                      </a>
                    ))}
                  </div>
                )}

                {r.response ? (
                  <div className="mt-2 rounded-md bg-muted/40 p-2 text-muted-foreground text-xs">
                    <span className="font-medium text-foreground">
                      Response:
                    </span>{' '}
                    <span className="text-foreground">{r.response}</span>
                    {r.respondedAt && r.respondedBy ? (
                      <span className="ml-2 text-muted-foreground">
                        by {r.respondedBy.name} (
                        {new Date(r.respondedAt).toLocaleString()})
                      </span>
                    ) : null}
                  </div>
                ) : null}

                <div className="mt-2 flex items-center justify-between text-muted-foreground text-xs">
                  <span>Updated {new Date(r.updatedAt).toLocaleString()}</span>
                  <div className="flex items-center gap-2">
                    {hasUpdatePermission && (
                      <Button
                        className="hover:-translate-y-px transition"
                        onClick={() => openDialogFor(r)}
                        size="sm"
                        variant="outline"
                      >
                        Change status / Add response
                      </Button>
                    )}
                    {hasDeletePermission && (
                      <Button
                        onClick={() => deleteRequest(r.id)}
                        size="sm"
                        variant="destructive"
                      >
                        Delete
                      </Button>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="flex items-center justify-between rounded-md border border-border/50 border-dashed bg-background/30 p-4">
            <p className="text-muted-foreground text-sm">No requests yet.</p>
            <span className="text-muted-foreground text-xs">
              Create one below
            </span>
          </div>
        )}

        {hasCreatePermission && (
          <form className="mt-2 space-y-3 border-t pt-4" onSubmit={onSubmitNew}>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="sm:col-span-1">
                <Label
                  className="mb-1 block font-medium text-muted-foreground text-xs"
                  htmlFor="type"
                >
                  Type
                </Label>
                <Select
                  onValueChange={(v: TaskRequestType) => setType(v)}
                  value={type}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select request type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="date extention">
                      Date extension
                    </SelectItem>
                    <SelectItem value="reassign">Reassign</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="sm:col-span-2">
                <Label
                  className="mb-1 block font-medium text-muted-foreground text-xs"
                  htmlFor="description"
                >
                  Description
                </Label>
                <Textarea
                  className="min-h-[88px]"
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe the request..."
                  required
                  value={description}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="mb-1 block font-medium text-muted-foreground text-xs">
                Attachments
              </Label>
              <Input
                className="cursor-pointer"
                multiple
                onChange={(e) => handleFileSelect(e.target.files)}
                type="file"
              />
              {filePreviews.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {filePreviews?.map((file) => (
                    <span
                      className="inline-flex items-center gap-1 rounded border border-border/60 bg-background/70 px-2 py-1 text-xs"
                      key={file.id}
                      title={`${file.name} (${file.size})`}
                    >
                      <Paperclip className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="max-w-[12rem] truncate">
                        {file.name}
                      </span>
                      <span className="text-muted-foreground">
                        ({file.size})
                      </span>
                      <button
                        aria-label={`Remove ${file.name}`}
                        className="ml-1 rounded p-0.5 hover:bg-accent/50"
                        onClick={() => removeFile(file.id)}
                        type="button"
                      >
                        <X className="h-3.5 w-3.5 text-muted-foreground" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
              {filePreviews.length === 0 && (
                <p className="text-[11px] text-muted-foreground">
                  No files selected
                </p>
              )}
            </div>

            <div className="flex items-center justify-end gap-2">
              <Button
                className="min-w-32"
                disabled={submitting || !description.trim()}
                type="submit"
              >
                {submitting ? 'Sending...' : 'Send request'}
              </Button>
            </div>
          </form>
        )}
      </CardContent>

      <TaskRequestDialog
        onOpenChange={setDialogOpen}
        onSuccess={handleDialogSuccess}
        open={dialogOpen}
        request={selectedRequest}
      />
    </Card>
  );
}
