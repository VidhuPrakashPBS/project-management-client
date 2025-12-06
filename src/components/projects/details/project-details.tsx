'use client';
import axios from 'axios';
import { ArrowLeft, Trash } from 'lucide-react';
import { useRouter } from 'nextjs-toploader/app';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import ConfirmDialog from '@/components/confirm-dialog';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/use-auth';
import api from '@/lib/api';
import type { Project } from '@/types/project';
import { decryptId } from '@/utils/aes-security-encryption';
import EditProjectDialog from './edit-project-details';
import { LoadingSkeleton } from './loading-skeleton';
import ProjectActivity from './project-activity';
import ProjectAssign from './project-assign';
import ProjectDetailsMainTasks from './project-details-main-tasks';
import ProjectOverview from './project-overview';

export default function ProjectDetails({ id }: { id: string }) {
  const router = useRouter();
  const [project, setProject] = useState<Project>();
  const [loading, setLoading] = useState<boolean>(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState<boolean>(false);
  const [deleting, setDeleting] = useState<boolean>(false);
  const [canDelete, setCanDelete] = useState<boolean>(false);
  const [canUpdate, setCanUpdate] = useState<boolean>(false);
  const [activityRefresh, setActivityRefresh] = useState<number>(0);
  const { hasPermission } = useAuth();
  const routerRef = useRef(router);

  useEffect(() => {
    routerRef.current = router;
  }, [router]);

  useEffect(() => {
    const fetchProject = async () => {
      try {
        setLoading(true);

        const decryptedId = decryptId(id);

        const response = await api.get(`/api/project/${decryptedId}`);

        if (response.data.success) {
          setProject(response.data.data);
        } else {
          toast.error(response.data.message || 'Failed to fetch project');
          routerRef.current.push('/dashboard/projects');
        }
      } catch (error) {
        toast.error(`Failed to fetch project details ${error}`);
        routerRef.current.push('/dashboard/projects');
      } finally {
        setLoading(false);
      }
    };
    fetchProject();
  }, [id]);

  const fetchProject = async () => {
    try {
      setLoading(true);

      const decryptedId = decryptId(id);

      const response = await api.get(`/api/project/${decryptedId}`);

      if (response.data.success) {
        setProject(response.data.data);
      } else {
        toast.error(response.data.message || 'Failed to fetch project');
        routerRef.current.push('/dashboard/projects');
      }
    } catch (error) {
      toast.error(`Failed to fetch project details ${error}`);
      routerRef.current.push('/dashboard/projects');
    } finally {
      setLoading(false);
    }
  };
  const handleProjectUpdated = () => {
    fetchProject();
  };

  useEffect(() => {
    const checkDeletePermissions = () => {
      try {
        const permission = hasPermission('PROJECT-DELETE');
        if (permission) {
          setCanDelete(true);
        }
      } catch (error) {
        toast.error(`Failed to check delete permissions ${error}`);
        setCanDelete(false);
      }
    };
    const checkUpdatePermissions = () => {
      try {
        const permission = hasPermission('PROJECT-UPDATE');

        if (permission) {
          setCanUpdate(true);
        }
      } catch (error) {
        toast.error(`Failed to check update permissions ${error}`);
        setCanUpdate(false);
      }
    };

    if (project) {
      checkDeletePermissions();
      checkUpdatePermissions();
    }
  }, [project, hasPermission]);

  const handleDeleteProject = async () => {
    if (!project) {
      return;
    }

    try {
      setDeleting(true);
      const decryptedId = decryptId(id);
      const response = await api.delete(`/api/project/${decryptedId}`);

      if (response.data.success) {
        toast.success(response.data.message || 'Project deleted successfully');
        router.push('/projects');
      } else {
        toast.error(response.data.message || 'Failed to delete project');
      }
    } catch (error) {
      handleDeleteError(error);
    } finally {
      setDeleting(false);
      setDeleteDialogOpen(false);
    }
  };
  const handleDeleteError = (error: unknown) => {
    if (axios.isAxiosError(error)) {
      const status = error.response?.status;

      switch (status) {
        case 403:
          toast.error(
            'Access denied. You do not have permission to delete this project.'
          );
          break;
        case 404:
          toast.error('Project not found');
          router.push('/projects');
          break;
        default:
          toast.error(`Failed to delete project: ${error.message}`);
      }
    } else {
      toast.error('An unexpected error occurred');
    }
  };

  const handleCancelDelete = () => {
    setDeleteDialogOpen(false);
  };

  const handleOpenDeleteDialog = () => {
    setDeleteDialogOpen(true);
  };

  if (loading) {
    return <LoadingSkeleton />;
  }

  if (!project) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center bg-background text-foreground">
        <h2 className="mb-4 font-bold text-2xl">Project Not Found</h2>
        <p className="mb-6 text-muted-foreground">
          The project you are looking for does not exist.
        </p>
        <Button
          className="bg-primary text-primary-foreground hover:bg-primary/90"
          onClick={() => router.back()}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Projects
        </Button>
      </div>
    );
  }

  const handleMainTasksChanged = () => {
    setActivityRefresh((prev) => prev + 1);
  };

  return (
    <div className="space-y-6 bg-background text-foreground">
      {/* Header */}
      <div className="mb-6 items-center justify-between md:flex">
        <Button
          className="hover:bg-accent"
          onClick={() => router.push('/projects')}
          variant="ghost"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Projects
        </Button>
        <div className="items-center gap-4 space-y-4 md:flex md:space-y-0">
          <h1 className="font-bold text-3xl text-foreground">
            {project.title}
          </h1>
          <div className="flex gap-2">
            {canUpdate && (
              <EditProjectDialog
                id={id}
                onProjectUpdated={handleProjectUpdated}
                project={project}
              />
            )}
            {canDelete && (
              <>
                <Button
                  disabled={deleting}
                  onClick={handleOpenDeleteDialog}
                  size="sm"
                  variant="destructive"
                >
                  <Trash className="mr-2 h-4 w-4" />
                  Delete
                </Button>

                <ConfirmDialog
                  cancelText="Cancel"
                  confirmText={deleting ? 'Deleting...' : 'Delete Project'}
                  description={`Are you sure you want to delete "${project.title}"? This action cannot be undone and will permanently remove the project and all associated data.`}
                  icon={<Trash className="h-6 w-6 text-destructive" />}
                  mode="confirm"
                  onCancel={handleCancelDelete}
                  onConfirm={handleDeleteProject}
                  onOpenChange={setDeleteDialogOpen}
                  open={deleteDialogOpen}
                  title="Delete Project"
                />
              </>
            )}
          </div>
        </div>
      </div>

      {/* Project Overview */}
      <ProjectOverview data={project} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Main Tasks */}
        <ProjectDetailsMainTasks
          onChange={handleMainTasksChanged}
          projectId={id}
        />

        {/* Activity Timeline & Assigned Employees */}
        <div className="space-y-6 lg:col-span-1">
          {/* Activity Timeline */}
          <ProjectActivity projectId={id} refetchTrigger={activityRefresh} />
        </div>
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Assigned Employees */}
        <ProjectAssign
          managers={project.managers}
          onManagersUpdate={() => {
            fetchProject();
          }}
          projectId={id}
        />
        <ProjectAssign
          forShowTeam
          managers={project.members}
          onManagersUpdate={() => {
            fetchProject();
          }}
          projectId={id}
        />
      </div>
    </div>
  );
}
