export interface DailySheetPayload {
  userId: string;
  organisationId: string;
  date: string;
  hours: string;
  description: string;
  onFullDayLeave: boolean;
  onHalfDayLeave: boolean;
  halfDayLeaveType?: 'first_half' | 'second_half';
  projectId?: string;
  mainTaskId?: string;
  taskId?: string;
}

export interface DailySheetProject {
  id: string;
  title: string;
  description: string;
  budget: string;
  completedAt: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  deletedAt: string | null;
  ownerName: string | null;
  mainTasks?: DailySheetMainTask[];
}

export interface DailySheetMainTask {
  id: string;
  title: string;
  description: string;
  status: string;
  projectId: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  completedTasks?: number;
  totalTasks?: number;
  progress?: number;
  tasks?: DailySheetTask[];
}

export interface DailySheetTask {
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
}

export interface DailySheetApiResponse {
  id: string;
  projectId: string | null;
  project: {
    id: string;
    title: string;
    description: string;
    budget: string;
  };
  mainTask: {
    id: string;
    title: string;
  };
  task: {
    id: string;
    title: string;
  } | null;
  mainTaskId: string | null;
  taskId: string | null;
  userId: string;
  organisationId: string;
  hours: string;
  description: string;
  onFullDayLeave: boolean;
  onHalfDayLeave: boolean;
  halfDayLeaveType: 'first_half' | 'second_half' | null;
  date: string;
  createdAt: string;
  updatedAt: string;
  userName: string;
}

export interface ApiListResponse<T> {
  message: string;
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface AddTimesheetFormProps {
  projects: DailySheetProject[];
  mainTasks: DailySheetMainTask[];
  tasks: DailySheetTask[];
  onSubmit: (data: TimesheetFormData) => void;
  onProjectSelect: (projectId: string) => void;
  onMainTaskSelect: (mainTaskId: string) => void;
  isLoading?: boolean;
}

export interface TimesheetFormData {
  projectId: string;
  mainTaskId: string;
  taskId: string | null;
  hours: number;
  description: string;
  onFullDayLeave: boolean;
  onHalfDayLeave: boolean;
  halfDayLeaveType: 'firstHalf' | 'secondHalf' | null;
  date: Date;
}

export interface Session {
  user: {
    id: string;
    email: string;
    name: string;
    image: string | null;
    role: string;
    organisationId?: string;
  };
}
