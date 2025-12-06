import type { User } from './user';

export interface Project {
  id: string;
  title?: string;
  description?: string;
  completedAt?: string;
  status?: 'planning' | 'in-progress' | 'completed' | 'on-hold';
  priority?: 'low' | 'medium' | 'high';
  progress?: number;
  endDate?: string;
  tasks?: { completed: number; total: number };
  budget?: string;
  mainTasks?: MainTask[];
  createdAt?: string;
  owner?: {
    id: string;
    name?: string;
    email?: string;
  };
  managers: {
    id: string;
    name?: string;
    email?: string;
  }[];
  members: {
    id: string;
    name?: string;
    email?: string;
  }[];
  files: {
    id: string;
    originalFilename: string;
    fileSize: number;
    mimeType: string;
    url: string;
    createdAt: string;
  }[];
  completedMainTasks?: string;
  totalMainTasks?: string;
}

interface AssignedManager {
  id: string;
  name?: string;
  isChief?: boolean;
}

export interface MainTask {
  id: string;
  title?: string;
  description?: string;
  status?: 'pending' | 'in_progress' | 'completed';
  progress?: number;
  assignedManagers?: AssignedManager[];
  dueDate?: string;
  tasks?: { completed?: number; total?: number };
  fileNames?: string[];
}

export type MainTaskTimelineProps = {
  tasks: MainTask[];
  className?: string;
  showLabels?: 'all' | 'hover' | 'none';
};

export interface ProjectAssignProps {
  managers?: User[];
  projectId?: string;
  onManagersUpdate?: () => void;
  forShowTeam?: boolean;
}

export interface ApiResponse {
  data: {
    success: boolean;
    message?: string;
  };
}

export interface projectListData {
  id: string;
  title?: string;
  description?: string;
  owner?: string;
  progress?: number;
  completedAt?: string;
  totalMainTasks?: string;
  completedMainTasks?: string;
  createdAt?: string;
}

export interface EditProjectDialogProps {
  project: Project;
  id: string;
  onProjectUpdated?: () => void;
}

export interface ProjectFormData {
  title: string;
  description: string;
  budget: string;
  ownerId: string;
  assignedManagersId: string[];
  files: File[];
  existingFiles: projectFile[];
  filesToDelete: string[];
}

export interface ManagerProps {
  formData: ProjectFormData;
  managers: User[];
  loadingManagers: boolean;
  setFormData: React.Dispatch<React.SetStateAction<ProjectFormData>>;
}

export interface OwnerSlectProps {
  formData: ProjectFormData;
  errors: Record<string, string>;
  owners: User[];
  loadingOwners: boolean;
  setFormData: React.Dispatch<React.SetStateAction<ProjectFormData>>;
  setErrors: React.Dispatch<React.SetStateAction<Record<string, string>>>;
}

export interface projectFile {
  id: string;
  originalFilename: string;
  fileSize: number;
  mimeType: string;
  url: string;
  createdAt: string;
}

export interface ApiErrorResponse {
  error?: string;
  message?: string;
}
