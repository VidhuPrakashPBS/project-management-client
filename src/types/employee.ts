// Role type for role filter
export interface Role {
  id: string;
  name: string;
  description?: string | null;
  createdAt: string;
  updatedAt: string;
  permissions: Permission[];
}

export interface Permission {
  id: string;
  permissionName: string;
  description?: string | null;
}

// Employee type from your API
export interface Employee {
  id: string;
  name: string;
  email: string;
  image?: string;
  role: string;
  phoneNumber?: string;
  empId?: string | null;
  joinedAt: string;
  clockIn?: string | null;
  clockOut?: string | null;
  working?: boolean;
  onSite?: boolean | null;
  onLeave?: boolean;
}

// API response type for employees
export interface EmployeesApiResponse {
  data: {
    data: Employee[];
    info: {
      totalEmployees: number;
      totalWorking: number;
      totalOnLeave: number;
      absentToday: number;
      lateToday: number;
    };
  };
  success: boolean;
  message: string;
}

// Status filter const matching your schema
export const StatusFilter = {
  ALL: 'ALL',
  WORKING: 'WORKING',
  ON_LEAVE: 'ON_LEAVE',
  ABSENT: 'ABSENT',
  LATE: 'LATE',
} as const;

export type StatusFilter = (typeof StatusFilter)[keyof typeof StatusFilter];

export interface Employee {
  id: string;
  name: string;
  email: string;
  image?: string;
  role: string;
  phoneNumber?: string;
  empId?: string | null;
  joinedAt: string;
  clockIn?: string | null;
  clockOut?: string | null;
  working?: boolean;
  onSite?: boolean | null;
  onLeave?: boolean;
}

export interface EmployeeListProps {
  employees: Employee[];
  currentUserRole?: string;
  searchTerm?: string;
  statusFilter?: string;
  roleFilter?: string;
  onSearchChange?: (search: string) => void;
  onStatusFilterChange?: (status: string) => void;
  onRoleFilterChange?: (role: string) => void;
  onRefresh?: () => void;
  onExport?: () => void;
  isLoading?: boolean;
  workingCount: number;
  onLeaveCount: number;
  absentCount: number;
  lateCount: number;
  roles: { id: string; name: string }[];
}
