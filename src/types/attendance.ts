export interface AttendanceStatus {
  isClockedIn: boolean;
  clockInTime: string | null;
  lastClockOutTime: string | null;
  onSite: boolean;
}

export interface GeolocationCoords {
  latitude: number;
  longitude: number;
}

export interface WorkingStatsResponse {
  message: string;
  success: boolean;
  data: {
    clockedIn: boolean;
    onSite: boolean;
    clockInTime: string | null;
    clockOutTime: string | null;
  };
}

export interface ClockStatusBannerProps {
  clockInTime: string;
  onSite: boolean;
  formatTime: (time: string) => string | null;
}

export interface TimeDisplayProps {
  currentTime: string;
  currentDate: string;
}

export interface AttendanceRecord {
  id: string;
  userId: string;
  userName: string | null;
  userEmail: string | null;
  userImage: string | null;
  empId: string | null;
  phoneNumber: string | null;
  role: string | null;
  clockin: string;
  clockinLatitude: number | null;
  clockinLongitude: number | null;
  loggedIp: string | null;
  os: string | null;
  browser: string | null;
  onSite: boolean | null;
  createdAt: string;
}

export interface PaginationData {
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}
