'use client';

import { useRouter } from 'nextjs-toploader/app';
import {
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
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
import { authClient } from '@/lib/auth-client';
import type { Project } from '@/types/project';
import { decryptId } from '@/utils/aes-security-encryption';
import { truncateText } from '@/utils/truncate';

export function ApplyProjectTemplate({
  currentProjectId,
  children,
  onTemplateApplied,
}: {
  currentProjectId: string;
  children: ReactNode;
  onTemplateApplied?: () => void;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const [applying, setApplying] = useState(false);

  const fetchProjects = useCallback(async () => {
    try {
      setLoading(true);

      // Get current user
      const session = await authClient.getSession();
      if (!session.data?.user?.id) {
        toast.error('You must be logged in to view projects');
        return;
      }

      const params = new URLSearchParams();
      params.append('userId', session.data.user.id);
      params.append('limit', '100'); // Get more projects for template selection
      params.append('sortBy', 'createdAt');
      params.append('order', 'desc');

      const response = await api.get(`/api/project?${params.toString()}`);

      if (response.data.success && response.data.data) {
        setProjects(response.data.data.data || []);
      } else {
        toast.error('Failed to fetch projects');
        setProjects([]);
      }
    } catch (error) {
      toast.error(`Failed to fetch projects: ${error}`);
      setProjects([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open) {
      fetchProjects();
    }
  }, [open, fetchProjects]);

  const availableProjects = useMemo(() => {
    const currentDecryptedId = decryptId(currentProjectId);
    return projects.filter((p) => p.id !== currentDecryptedId);
  }, [projects, currentProjectId]);

  const handleApiError = (error: unknown) => {
    interface ApiError {
      response?: {
        status?: number;
      };
      message?: string;
    }

    const apiError = error as ApiError;

    switch (apiError.response?.status) {
      case 400:
        toast.error('Invalid request. Please check the selected project.');
        break;
      case 403:
        toast.error(
          'You do not have permission to apply templates to this project.'
        );
        break;
      case 404:
        toast.error('Project not found.');
        break;
      default:
        toast.error(
          `Failed to apply template: ${apiError.message || 'Unknown error'}`
        );
    }
  };

  /**
   * Applies a template to a project.
   * @throws {Error} If an error occurs while applying the template.
   */
  const handleApply = async () => {
    if (!selectedProjectId) {
      toast.error('Please select a project');
      return;
    }

    try {
      setApplying(true);

      const requestData = {
        projectId: decryptId(currentProjectId),
        selectedProjectId,
      };

      const response = await api.post(
        '/api/project/apply-template',
        requestData
      );

      if (response.data.success) {
        const appliedProject = projects.find((p) => p.id === selectedProjectId);
        toast.success(
          response.data.message ||
            `Template from "${appliedProject?.title}" applied successfully`
        );

        setOpen(false);
        setSelectedProjectId('');
        onTemplateApplied?.();
        router.refresh();
      } else {
        toast.error(response.data.message || 'Failed to apply template');
      }
    } catch (error) {
      handleApiError(error);
    } finally {
      setApplying(false);
    }
  };

  const handleCancel = () => {
    if (!applying) {
      setSelectedProjectId('');
      setOpen(false);
    }
  };

  const handleDialogOpenChange = (newOpen: boolean) => {
    if (!applying) {
      setOpen(newOpen);
      if (!newOpen) {
        setSelectedProjectId('');
      }
    }
  };

  return (
    <Dialog onOpenChange={handleDialogOpenChange} open={open}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="bg-card/90 backdrop-blur-sm sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Apply Project Template</DialogTitle>
          <DialogDescription>
            Select a project to copy its main tasks into this project. Existing
            tasks will not be overwritten.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="h-6 w-6 animate-spin rounded-full border-primary border-b-2" />
              <span className="ml-2 text-muted-foreground text-sm">
                Loading projects...
              </span>
            </div>
          ) : (
            <Select
              disabled={applying || availableProjects.length === 0}
              onValueChange={setSelectedProjectId}
              value={selectedProjectId}
            >
              <SelectTrigger>
                <SelectValue
                  placeholder={
                    availableProjects.length === 0
                      ? 'No other projects available'
                      : 'Select a project...'
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {availableProjects?.map((proj) => (
                  <SelectItem key={proj.id} value={proj.id}>
                    <div className="flex w-full flex-col items-start">
                      <span
                        className="w-full truncate font-medium text-sm"
                        title={proj.title}
                      >
                        {truncateText(proj?.title as string, 30)}
                      </span>
                      {proj.description && (
                        <span
                          className="mt-1 w-full truncate text-muted-foreground text-xs"
                          title={proj.description}
                        >
                          {proj.mainTasks?.length} Main Tasks
                        </span>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {!loading && availableProjects.length === 0 && (
            <div className="py-4 text-center text-muted-foreground text-sm">
              <p>No other projects available to use as templates.</p>
              <p>Create more projects to use them as templates.</p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button disabled={applying} onClick={handleCancel} variant="outline">
            Cancel
          </Button>
          <Button
            disabled={!selectedProjectId || applying || loading}
            onClick={handleApply}
          >
            {applying ? 'Applying...' : 'Apply Template'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
