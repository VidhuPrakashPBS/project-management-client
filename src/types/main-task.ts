import type { Project } from './project';

export interface CreateMainTaskProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId?: string;
  createFromList?: boolean;
  onTaskCreated?: () => void;
}

export interface Employee {
  id: string;
  name: string;
  email: string;
  image: string;
  createdAt: string;
  updatedAt: string;
}

export interface EmployeeWithUserObject {
  id: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
}

export interface File {
  id: string;
  originalFilename: string;
  url: string;
  fileSize: number;
  mimeType: string;
  createdAt: string;
  updatedAt: string;
}

export interface Activity {
  id: string;
  title: string;
  description: string;
  createdAt: string;
  files: File[];
  postedBy: {
    id: string;
    name: string;
    email: string;
    createdAt: string;
    updatedAt: string;
  };
}

export interface MainTask {
  id: string;
  title: string;
  description: string;
  status: string;
  projectId: string;
  createdAt: string;
  updatedAt: string;
  project: Project;
  files: File[];
  tasks: Task[];
  activities: Activity[];
}

export interface GetApiResponse {
  success: boolean;
  message: string;
  data: MainTask;
}

export interface PageParams {
  id: string;
}

export interface UpdateMainTaskProps {
  mainTask: MainTask;
  onTaskUpdated: () => void;
  children?: React.ReactNode;
}

export interface ApiResponse {
  success: boolean;
  message?: string;
  error?: string;
}

export interface ApiError {
  response?: {
    status?: number;
    data?: ApiResponse;
  };
  message?: string;
}

export interface Task {
  id: string;
  taskNo: string;
  title: string;
  description: string;
  status: string;
  mainTaskId: string;
  projectId: string;
  startDate: string | null;
  endDate: string | null;
  createdAt: string;
  updatedAt: string;
  employee?: EmployeeWithUserObject;
  employeeName: string | null;
  succeedingTasks: Array<{
    id: string;
    succeedingTaskId: string;
  }>;
  proceedingTasks: Array<{
    id: string;
    proceedingTaskId: string;
  }>;
}

export interface TaskSelectorProps {
  label: string;
  selectedTaskIds: string[];
  availableTasks: Task[];
  onTaskToggle: (taskId: string) => void;
  loading?: boolean;
  disabled?: boolean;
  placeholder?: string;
}

export interface SubTaskView {
  id: string;
  title: string;
  description?: string;
  status:
    | 'completed'
    | 'in-progress'
    | 'on-hold'
    | 'due'
    | 'cancelled'
    | 'pending';
  assigneeId?: string;
  assigneeName?: string;
  dueDate?: string;
  taskNo: string;
}

export interface MainTaskFile {
  id: string;
  originalFilename: string;
  url: string;
  fileSize: number;
  mimeType: string;
  createdAt: string;
  updatedAt: string;
}

export interface SubTask {
  id: string;
  taskNo: string;
  title: string;
  description: string;
  status: string;
  createdAt: string;
}

export interface MainTask {
  id: string;
  title: string;
  description: string;
  status: string;
  projectId: string;
  createdAt: string;
  updatedAt: string;
  totalTasks: number;
  completedTasks: number;
  progress: number;
  files: MainTaskFile[];
}
export interface ActivityFile {
  id: string;
  originalFilename: string;
  url: string;
  createdAt: string;
  updatedAt: string;
}

export interface ActivityItem {
  id: string;
  title: string;
  description: string;
  files: ActivityFile[];
  createdAt?: string;
  user?: string;
}

export interface Employee {
  id: string;
  name: string;
  email: string;
}

export interface Task {
  id: string;
  taskNo: string;
  title: string;
  description: string;
  status: string;
  mainTaskId: string;
  projectId: string;
  startDate: string | null;
  endDate: string | null;
  createdAt: string;
  updatedAt: string;
  employeeName: string | null;
  succeedingTasks: Array<{
    id: string;
    succeedingTaskId: string;
  }>;
  proceedingTasks: Array<{
    id: string;
    proceedingTaskId: string;
  }>;
}

export interface CreateTaskResponse {
  success: boolean;
  message: string;
  data: Task;
}

export interface ListResponse<T> {
  success: boolean;
  message: string;
  data: T[];
}

export interface MainTaskActivityFile {
  id: string;
  originalFilename: string;
  url: string;
  createdAt: string;
  updatedAt: string;
}

export interface MainTaskActivity {
  id: string;
  title: string;
  description: string;
  postedBy: {
    id: string;
    name: string;
  };
  files: MainTaskActivityFile[];
  createdAt?: string;
}

export interface ListMainTaskActivitiesResponse {
  success: boolean;
  message: string;
  data: MainTaskActivity[];
}

export interface MainTaskActivitySectionProps {
  mainTaskId: string;
}
