'use client';
import { Plus } from 'lucide-react';
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
import { authClient } from '@/lib/auth-client';
import type { User } from '@/types/user';
import ProjectFormFields from './create-project-form-field';
import ManagerSelect from './manager-select';
import OwnerSelect from './owner-select';

interface CreateProjectDialogProps {
  onProjectCreated?: () => void;
}

const uuidRegex =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default function CreateProjectDialog({
  onProjectCreated,
}: CreateProjectDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingManagers, setLoadingManagers] = useState(false);
  const [loadingOwners, setLoadingOwners] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [managers, setManagers] = useState<User[]>([]);
  const [owners, setOwners] = useState<User[]>([]);
  const [adminCreate, setAdminCreate] = useState<boolean>(false);
  const [projectCreate, setProjectCreate] = useState<boolean>(false);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    budget: '',
    userId: '',
    assignedManagersId: [] as string[],
    files: [] as File[],
  });
  const { hasPermission } = useAuth();

  // reset form
  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      budget: '',
      userId: '',
      assignedManagersId: [],
      files: [],
    });
    setErrors({});
  };

  // permissions
  useEffect(() => {
    const checkPermissions = async () => {
      const permission = hasPermission('PROJECT-ADMIN-CREATE');

      const createPro = hasPermission('PROJECT-CREATE');

      if (permission) {
        setAdminCreate(true);
      } else {
        setAdminCreate(false);
        const session = await authClient.getSession();
        if (session.data?.user.id) {
          setFormData((prev) => ({
            ...prev,
            userId: session.data?.user.id as string,
          }));
        }
      }

      if (createPro) {
        setProjectCreate(true);
      }
    };

    checkPermissions();
  }, [hasPermission]);

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

    if (adminCreate && !formData.userId.trim()) {
      newErrors.ownerId = 'Owner is required';
    }
    if (formData.userId.trim() && !uuidRegex.test(formData.userId)) {
      newErrors.userId = 'Please enter a valid UUID';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * Creates a FormData object from the current form state.
   * The FormData object will contain the title, description, budget, userId, assignedManagersId array, and files.
   * @returns A FormData object with the extracted values and files.
   */
  const createFormData = async () => {
    const submitData = new FormData();

    const session = await authClient.getSession();
    if (!adminCreate && session.data?.user.id) {
      submitData.append('userId', session.data?.user.id as string);
    } else {
      submitData.append('userId', formData.userId);
    }

    // Add text fields
    submitData.append('title', formData.title.trim());
    submitData.append('description', formData.description.trim());
    submitData.append('budget', formData.budget.trim());

    // Add assignedManagersId array
    for (const managerId of formData.assignedManagersId) {
      submitData.append('assignedManagersId[]', managerId);
    }

    // Add files
    for (const file of formData.files) {
      submitData.append('files[]', file);
    }

    return submitData;
  };

  // submit
  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);

      const submitData = await createFormData();

      const response = await api.post('/api/project', submitData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      toast.success(response.data.message ?? 'Project created successfully');

      resetForm();
      setOpen(false);
      onProjectCreated?.();
    } catch (error) {
      toast.error(`Failed to create project ${error}`);
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

  // dialog open/close
  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (newOpen) {
      fetchManagers();
      if (adminCreate) {
        fetchOwners();
      }
    } else {
      resetForm();
    }
  };

  return (
    <Dialog onOpenChange={handleOpenChange} open={open}>
      {projectCreate && (
        <DialogTrigger asChild>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Create Project
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create New Project</DialogTitle>
          <DialogDescription>
            Fill in the details below to create a new project.
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-4" onSubmit={onSubmit}>
          <ProjectFormFields
            errors={errors}
            formData={formData}
            setErrors={setErrors}
            setFormData={setFormData}
          />

          {adminCreate && (
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
            <Button disabled={loading} type="submit">
              {loading ? 'Creating...' : 'Create Project'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
