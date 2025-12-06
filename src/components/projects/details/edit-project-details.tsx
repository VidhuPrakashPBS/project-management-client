'use client';
import { Pen } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useAuth } from '@/hooks/use-auth';
import api from '@/lib/api';
import type {
  EditProjectDialogProps,
  Project,
  projectFile,
} from '@/types/project';
import type { User } from '@/types/user';
import { decryptId } from '@/utils/aes-security-encryption';
import ProjectFormFields from './edit-project-form';
import OwnerSelect from './edit-project-owner-select';
import ManagerSelect from './edit-project-select-manager';

export default function EditProjectDialog({
  project,
  id,
  onProjectUpdated,
}: EditProjectDialogProps) {
  const [open, setOpen] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [loadingManagers, setLoadingManagers] = useState<boolean>(false);
  const [loadingOwners, setLoadingOwners] = useState<boolean>(false);
  const [loadingProject, setLoadingProject] = useState<boolean>(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [managers, setManagers] = useState<User[]>([]);
  const [owners, setOwners] = useState<User[]>([]);
  const [adminEdit, setAdminEdit] = useState<boolean>(false);
  const [originalManagerIds, setOriginalManagerIds] = useState<string[]>([]);
  const [projectData, setProjectData] = useState<Project>();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    budget: '',
    ownerId: '',
    assignedManagersId: [] as string[],
    files: [] as File[],
    existingFiles: [] as projectFile[],
    filesToDelete: [] as string[],
  });
  const { hasPermission } = useAuth();

  // Fetch project data by ID
  const fetchProjectData = useCallback(async () => {
    if (!id) {
      return;
    }

    try {
      setLoadingProject(true);
      const decryptedId = decryptId(id);
      const response = await api.get(`/api/project/${decryptedId}`);

      if (response.data.success) {
        setProjectData(response.data.data);
      } else {
        toast.error('Failed to load project data');
      }
    } catch (error) {
      toast.error(`Failed to load project data ${error}`);
    } finally {
      setLoadingProject(false);
    }
  }, [id]);

  const resetForm = useCallback(() => {
    const currentProject = projectData || project;
    if (!currentProject) {
      return;
    }

    const initialManagerIds =
      currentProject.managers?.map((m: { id: string }) => m.id) || [];
    const existingFiles = currentProject.files || [];
    const ownerId = currentProject.owner?.id || '';

    setFormData({
      title: currentProject.title || '',
      description: currentProject.description || '',
      budget: currentProject.budget || '',
      ownerId,
      assignedManagersId: initialManagerIds,
      files: [],
      existingFiles,
      filesToDelete: [],
    });

    setOriginalManagerIds(initialManagerIds);
    setErrors({});
  }, [projectData, project]);

  // File handling functions
  const handleRemoveExistingFile = (fileId: string) => {
    setFormData((prev) => ({
      ...prev,
      existingFiles: prev.existingFiles.filter((f) => f.id !== fileId),
      filesToDelete: [...prev.filesToDelete, fileId],
    }));
  };

  // permissions
  useEffect(() => {
    const checkPermissions = () => {
      const permission = hasPermission('PROJECT-ADMIN-UPDATE');
      setAdminEdit(permission ?? false);
    };
    checkPermissions();
  }, [hasPermission]);

  // Fetch project data when dialog opens
  useEffect(() => {
    if (open && id) {
      fetchProjectData();
    }
  }, [open, id, fetchProjectData]);

  // Reset form when project data changes
  useEffect(() => {
    if (projectData || project) {
      resetForm();
    }
  }, [projectData, project, resetForm]);

  // validation
  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }
    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }
    if (!formData.budget.trim()) {
      newErrors.budget = 'Budget is required';
    }

    if (adminEdit && !formData.ownerId.trim()) {
      newErrors.ownerId = 'Owner is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const getUnselectedManagerIds = () =>
    originalManagerIds.filter(
      (managerId) => !formData.assignedManagersId.includes(managerId)
    );

  /**
   * Creates FormData for multipart upload
   */
  const createFormData = () => {
    const submitData = new FormData();
    const decryptedId = decryptId(id);

    // Add basic fields
    if (decryptedId !== null) {
      submitData.append('id', decryptedId);
    }
    submitData.append('title', formData.title.trim());
    submitData.append('description', formData.description.trim());
    submitData.append('budget', formData.budget.trim());
    submitData.append('userId', formData.ownerId);

    // Add manager arrays
    for (const managerId of formData.assignedManagersId) {
      submitData.append('assignedManagersId[]', managerId);
    }

    for (const managerId of getUnselectedManagerIds()) {
      submitData.append('unselectedManagersId[]', managerId);
    }
    // Add new files
    for (const file of formData.files) {
      submitData.append('files[]', file);
    }
    // Add files to delete (using deletedFilesId as per API spec)
    for (const fileId of formData.filesToDelete) {
      submitData.append('deletedFilesId[]', fileId);
    }

    return submitData;
  };

  // submit with file upload support
  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);

      // Use multipart form data for file operations
      const submitData = createFormData();

      const response = await api.patch('/api/project', submitData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      toast.success(response.data.message ?? 'Project updated successfully');

      setOpen(false);
      onProjectUpdated?.();
    } catch (error) {
      toast.error(`Failed to update project: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  // fetch managers
  const fetchManagers = useCallback(async () => {
    try {
      setLoadingManagers(true);
      const response = await api.get('/api/employee/managers');
      setManagers(response.data.data || response.data);
    } catch (error) {
      toast.error(`Failed to load managers ${error}`);
      setManagers([]);
    } finally {
      setLoadingManagers(false);
    }
  }, []);

  // fetch owners
  const fetchOwners = useCallback(async () => {
    try {
      setLoadingOwners(true);
      const response = await api.get('/api/employee/owners');
      setOwners(response.data.data || response.data);
    } catch (error) {
      toast.error(`Failed to load owners ${error}`);
      setOwners([]);
    } finally {
      setLoadingOwners(false);
    }
  }, []);

  // open/close
  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (newOpen) {
      fetchManagers();
      if (adminEdit) {
        fetchOwners();
      }
    } else {
      // Reset form data when closing
      setFormData({
        title: '',
        description: '',
        budget: '',
        ownerId: '',
        assignedManagersId: [],
        files: [],
        existingFiles: [],
        filesToDelete: [],
      });
      setProjectData(undefined);
      setErrors({});
    }
  };

  return (
    <Dialog onOpenChange={handleOpenChange} open={open}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <Pen className="mr-2 h-4 w-4" />
          Edit
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit Project</DialogTitle>
          <DialogDescription>
            Update the project details below.
          </DialogDescription>
        </DialogHeader>

        {loadingProject ? (
          <div className="flex items-center justify-center p-8">
            <div className="text-center">
              <div className="mx-auto mb-2 h-8 w-8 animate-spin rounded-full border-gray-900 border-b-2" />
              <p className="text-muted-foreground text-sm">
                Loading project data...
              </p>
            </div>
          </div>
        ) : (
          <form className="space-y-4" onSubmit={onSubmit}>
            <ProjectFormFields
              errors={errors}
              formData={formData}
              loading={loading}
              onRemoveExistingFile={handleRemoveExistingFile}
              setErrors={setErrors}
              setFormData={setFormData}
            />

            {adminEdit && (
              <OwnerSelect
                errors={errors}
                formData={formData}
                loadingOwners={loadingOwners}
                owners={owners}
                setErrors={setErrors}
                setFormData={setFormData}
              />
            )}

            <ManagerSelect
              formData={formData}
              loadingManagers={loadingManagers}
              managers={managers}
              setFormData={setFormData}
            />

            <div className="flex justify-end space-x-2 pt-4">
              <Button
                disabled={loading}
                onClick={() => setOpen(false)}
                type="button"
                variant="outline"
              >
                Cancel
              </Button>
              <Button disabled={loading || loadingProject} type="submit">
                {loading ? 'Updating...' : 'Update Project'}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
