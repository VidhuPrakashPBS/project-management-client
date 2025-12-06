// Type for half day leave
export type HalfDayType = 'first_half' | 'second_half';

// Type for API response
export interface LeaveRequestResponse {
  message: string;
  success: boolean;
  data: {
    id: string;
    userId: string;
    leaveType: string;
    startDate: string;
    endDate: string;
    reason: string | null;
    status: string;
    totalDays: number;
    createdAt: string;
    updatedAt: string;
    files: Array<{
      id: string;
      url: string;
      fileType: string;
      createdAt: string;
      updatedAt: string;
    }>;
  };
}

export interface LeaveStatisticsProps {
  refetch: number;
}

export interface LeaveStatisticsData {
  approvedLeaves: number;
  rejectedLeaves: number;
  pendingLeaves: number;
  sickLeaveApproved: number;
  sickLeaveTotal: number;
  sickLeavePercentage: number;
  casualLeaveApproved: number;
  casualLeaveTotal: number;
  casualLeavePercentage: number;
  unpaidLeaveApproved: number;
  unpaidLeaveTotal: number;
  unpaidLeavePercentage: number;
}

export interface LeaveRequest {
  id: string;
  reason: string;
  userId: string;
  userName?: string;
  userImage?: string;
  organisationId: string;
  leaveType: LeaveType;
  duration: 'full' | 'half';
  status: LeaveStatus;
  halfDayType?: 'first_half' | 'second_half';
  actionComments?: string;
  actionBy?: string;
  actionAt?: Date | string;
  createdAt: Date | string;
  startDate: Date | string;
  endDate: Date | string;
  totalDays?: string;
  files: {
    id: string;
    url: string;
    originalFileName: string;
    fileType: string;
  }[];
}

export type LeaveType = 'sick' | 'casual' | 'unpaid';
export type LeaveStatus = 'pending' | 'rejected' | 'approved';

export interface PreviousLeaveRequestsProps {
  refetch: number;
}
