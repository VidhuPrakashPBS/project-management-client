'use client';

import axios from 'axios';
import { useRouter } from 'nextjs-toploader/app';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import api from '@/lib/api';
import type { MainTask } from '@/types/main-task';

export function ApplyTemplateDialog({
  currentMainTaskId,
  projectId,
}: {
  currentMainTaskId: string;
  projectId: string;
}) {
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [open, setOpen] = useState<boolean>(false);
  const [isApplying, setIsApplying] = useState<boolean>(false);
  const [templates, setTemplates] = useState<MainTask[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const router = useRouter();

  useEffect(() => {
    if (!open) {
      return;
    }

    const fetchMainTasks = async () => {
      setIsLoading(true);

      try {
        const response = await api.get('/api/maintask', {
          params: { projectId },
        });

        if (response.data.success && response.data.data) {
          setTemplates(response.data.data);
        } else {
          throw new Error(response.data.message || 'Failed to load templates');
        }
      } catch (err) {
        if (axios.isAxiosError(err)) {
          const errorMessage =
            err.response?.data?.message ||
            err.message ||
            'Failed to fetch main tasks';
          toast.error(errorMessage);
        } else {
          toast.error('An unexpected error occurred');
        }
        setTemplates([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMainTasks();
  }, [open, projectId]);
  const availableTemplates = useMemo(
    () =>
      templates.filter((t) => t.id !== currentMainTaskId && t.tasks.length > 0),
    [currentMainTaskId, templates]
  );

  /**
   * Applies the selected main task template to the current main task.
   *
   * @throws {Error} If an error occurs while applying the main task template.
   */
  const handleApplyTemplate = async () => {
    if (!selectedTemplateId) {
      return;
    }

    setIsApplying(true);

    try {
      const response = await api.post('/api/maintask/apply-template', {
        mainTaskId: currentMainTaskId,
        selectedMainTaskId: selectedTemplateId,
      });

      if (response.data.success) {
        const template = availableTemplates.find(
          (t) => t.id === selectedTemplateId
        );

        toast.success(
          `Template "${template?.title}" applied successfully! The page will now refresh.`
        );

        setOpen(false);
        setSelectedTemplateId('');
        router.refresh();
      } else {
        throw new Error(response.data.message || 'Failed to apply template');
      }
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const errorMessage =
          err.response?.data?.message ||
          err.message ||
          'Failed to apply template';
        toast.error(errorMessage);
      } else {
        toast.error('An unexpected error occurred');
      }
    } finally {
      setIsApplying(false);
    }
  };

  const placeholderMessage = useMemo(() => {
    if (isLoading) {
      return 'Loading templates...';
    }
    if (availableTemplates.length === 0) {
      return 'No templates available';
    }
    return 'Select a template...';
  }, [isLoading, availableTemplates.length]);

  return (
    <Dialog onOpenChange={setOpen} open={open}>
      <DialogTrigger asChild>
        <Button>Apply Sub-task Template</Button>
      </DialogTrigger>
      <DialogContent className="bg-card/90 backdrop-blur-sm sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Apply a Template</DialogTitle>
          <DialogDescription>
            Choose a previous main task to use its sub-task structure as a
            template for this new task.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <Select
            onValueChange={setSelectedTemplateId}
            value={selectedTemplateId}
          >
            <SelectTrigger>
              <SelectValue placeholder={placeholderMessage} />
            </SelectTrigger>
            <SelectContent>
              {availableTemplates?.map((task) => (
                <SelectItem key={task.id} value={task.id}>
                  {task.title} ({task.tasks.length} sub-tasks)
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <DialogFooter>
          <Button disabled={!selectedTemplateId} onClick={handleApplyTemplate}>
            {isApplying ? 'Applying...' : 'Apply Template'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
