export interface TaskData {
  id: string;
  taskNo: string;
  title: string;
  description: string;
  status: string;
  mainTaskId: string;
  mainTask?: {
    id: string;
    name: string;
  };
  projectId: string;
  startDate: string | null;
  endDate: string | null;
  createdAt: string;
  updatedAt: string;
  employeeName?: string;
  employee: {
    id: string;
    user: {
      id: string;
      name: string;
    };
  } | null;
  files: {
    id: string;
    originalFilename: string;
    fileType: string;
    fileSize: number;
    url: string;
    uploadedAt: string;
  }[];
  activities: Array<{
    id: string;
    title: string;
    description: string;
    postedBy: {
      id: string;
      name: string;
    };
    createdAt: string;
    updatedAt: string;
    files: Array<{
      id: string;
      originalFilename: string;
      storedFilename: string;
      fileSize: number;
      mimeType: string | null;
      url: string;
      uploadedBy: string | null;
      createdAt: string;
      updatedAt: string;
    }>;
  }>;
  succeedingTasks: Array<{
    succeedingTask: {
      id: string;
      taskNo: string;
      title: string;
    };
  }>;
  proceedingTasks: Array<{
    proceedingTask: {
      id: string;
      taskNo: string;
      title: string;
    };
  }>;
  taskRequest: Array<{
    id: string;
    type: string;
    description: string;
  }>;
}

export interface ApiResponse {
  message: string;
  success: boolean;
  data: TaskData;
}

export interface TaskFile {
  id?: string;
  originalFilename?: string;
  storedFilename?: string;
  fileSize?: number;
  mimeType?: string | null;
  url?: string;
  uploadedBy?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface ActivityItem {
  id: string;
  title: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  postedBy: {
    id: string;
    name: string;
  } | null;
  files: {
    id: string;
    originalFilename: string;
    url: string;
    createdAt: string;
    updatedAt: string;
  }[];
}

export type TaskRequestStatus =
  | 'requested'
  | 'in_review'
  | 'approved'
  | 'rejected';
export type TaskRequestType = 'date extention' | 'reassign' | 'other';

export interface TaskRequest {
  id: string;
  type: TaskRequestType;
  status: TaskRequestStatus;
  description: string;
  response: string | null;
  requestedBy: {
    id: string;
    name: string;
  };
  respondedBy: {
    id: string;
    name: string;
  } | null;
  respondedAt: string | null;
  createdAt: string;
  updatedAt: string;
  files?: {
    id: string;
    originalFilename: string;
    url: string;
  }[];
}

export interface TaskRequestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  request: TaskRequest | null;
  onSuccess: () => void;
}

export interface TaskRequest {
  id: string;
  type: TaskRequestType;
  status: TaskRequestStatus;
  description: string;
  response: string | null;
  requestedBy: {
    id: string;
    name: string;
  };
  respondedBy: {
    id: string;
    name: string;
  } | null;
  respondedAt: string | null;
  createdAt: string;
  updatedAt: string;
  files?: {
    id: string;
    originalFilename: string;
    url: string;
  }[];
}

export interface TaskRequestFilePreview {
  id: string;
  name: string;
  file: File;
  size: string;
}
