export interface StatusDistribution {
  status: string;
  count: number;
  percentage: number;
}

export interface TaskStats {
  totalTasks: number;
  tasksByStatus: {
    due: number;
    inProgress: number;
    completed: number;
    onHold: number;
    blocked: number;
  };
  completionRate: number;
  inProgressRate: number;
  overdueRate: number;
  statusDistribution: StatusDistribution[];
}

export interface ProjectTaskOverview {
  projectId: string;
  projectName: string;
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
  overdueTasks: number;
  completionRate: number;
  overdueRate: number;
  managers: {
    id: string;
    name: string;
    email: string;
    image: string | null;
  }[];
}

export interface TaskStatusOverviewResponse {
  projects: ProjectTaskOverview[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
