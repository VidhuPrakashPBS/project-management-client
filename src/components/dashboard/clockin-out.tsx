'use client';

import { AlertCircle, Clock, Wifi } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import api from '@/lib/api';
import { authClient } from '@/lib/auth-client';
import type {
  AttendanceStatus,
  GeolocationCoords,
  WorkingStatsResponse,
} from '@/types/attendance';
import { ClockStatusBanner } from './clock-status-banner';
import { TimeDisplay } from './time-display';

export default function ClockInOut() {
  const [currentTime, setCurrentTime] = useState<string>('');
  const [currentDate, setCurrentDate] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingStatus, setIsFetchingStatus] = useState(true);
  const [attendanceStatus, setAttendanceStatus] = useState<AttendanceStatus>({
    isClockedIn: false,
    clockInTime: null,
    lastClockOutTime: null,
    onSite: false,
  });

  const [locationError, setLocationError] = useState<string>('');

  // Fetch working statistics on component mount
  useEffect(() => {
    const fetchWorkingStats = async () => {
      try {
        setIsFetchingStatus(true);
        const session = await authClient.getSession();

        if (!session?.data?.user?.id) {
          throw new Error('User not authenticated');
        }

        const response = await api.get<WorkingStatsResponse>(
          `/api/user/${session.data.user.id}/working-stats`
        );

        if (response.data.success) {
          setAttendanceStatus({
            isClockedIn: response.data.data.clockedIn,
            clockInTime: response.data.data.clockInTime,
            lastClockOutTime: response.data.data.clockOutTime,
            onSite: response.data.data.onSite,
          });
        }
      } catch (error) {
        toast.error(
          error instanceof Error
            ? error.message
            : 'Failed to load attendance status'
        );
      } finally {
        setIsFetchingStatus(false);
      }
    };

    fetchWorkingStats();
  }, []);

  // Update current time every second
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true,
        })
      );
      setCurrentDate(
        now.toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })
      );
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);

    return () => clearInterval(interval);
  }, []);

  // Get user's location
  const getUserLocation = (): Promise<GeolocationCoords> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by your browser'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const coords = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          };

          setLocationError('');
          resolve(coords);
        },
        (error) => {
          let errorMessage = 'Unable to retrieve your location';
          switch (error.code) {
            case error.PERMISSION_DENIED: {
              errorMessage = 'Location permission denied';
              break;
            }
            case error.POSITION_UNAVAILABLE:
              errorMessage = 'Location information unavailable';
              break;
            case error.TIMEOUT:
              errorMessage = 'Location request timed out';
              break;
            default:
              errorMessage =
                'An unknown error occurred while retrieving location';
          }
          setLocationError(errorMessage);
          reject(new Error(errorMessage));
        }
      );
    });
  };

  // Format clock-in time for display
  const formatClockInTime = (timeString: string | null) => {
    if (!timeString) {
      return null;
    }

    try {
      const date = new Date(timeString);
      return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      });
    } catch {
      return null;
    }
  };

  /**
   * Handles clocking in for an employee.
   */
  const handleClockIn = async () => {
    try {
      setIsLoading(true);

      // Get location first
      const coords = await getUserLocation();
      const session = await authClient.getSession();

      if (!session?.data?.user?.id) {
        throw new Error('User not authenticated');
      }

      const response = await api.post('/api/attendance/clockin', {
        userId: session?.data?.user?.id,
        clockInAt: new Date().toISOString(),
        latitude: coords.latitude.toString(),
        longitude: coords.longitude.toString(),
      });

      if (response.data.success) {
        setAttendanceStatus({
          isClockedIn: true,
          clockInTime: response.data.data.clockInTime,
          lastClockOutTime: null,
          onSite: response.data.data.onSite,
        });
        toast.success(response.data.message || 'Clocked in successfully!');
      } else {
        toast.error(response.data.message || 'Failed to clock in');
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to clock in'
      );
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Handles clocking out for an employee.
   */
  const handleClockOut = async () => {
    try {
      setIsLoading(true);

      // Get location first
      const coords = await getUserLocation();
      const session = await authClient.getSession();
      if (!session?.data?.user?.id) {
        throw new Error('User not authenticated');
      }

      const response = await api.post('/api/attendance/clockout', {
        userId: session?.data?.user?.id,
        clockOutAt: new Date().toISOString(),
        latitude: coords.latitude.toString(),
        longitude: coords.longitude.toString(),
      });

      if (response.data.success) {
        setAttendanceStatus({
          isClockedIn: false,
          clockInTime: null,
          lastClockOutTime: response.data.data.clockOutTime,
          onSite: false,
        });
        toast.success(response.data.message || 'Clocked out successfully!');
      } else {
        toast.error(response.data.message || 'Failed to clock out');
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to clock out'
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Show loading state while fetching initial status
  if (isFetchingStatus) {
    return (
      <Card className="w-full">
        <CardHeader className="space-y-1">
          <CardTitle className="flex items-center gap-2 text-2xl">
            <Clock className="h-6 w-6" />
            Attendance
          </CardTitle>
          <CardDescription>Track your work hours</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-center py-8">
            <Clock className="mr-2 h-6 w-6 animate-spin text-muted-foreground" />
            <span className="text-muted-foreground">
              Loading attendance status...
            </span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader className="space-y-1">
        <CardTitle className="flex items-center gap-2 text-2xl">
          <Clock className="h-6 w-6" />
          Attendance
        </CardTitle>
        <CardDescription>Track your work hours</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Current Time Display */}
        <TimeDisplay currentDate={currentDate} currentTime={currentTime} />
        {/* Clock-In Status Banner */}
        {attendanceStatus.isClockedIn && attendanceStatus.clockInTime && (
          <ClockStatusBanner
            clockInTime={attendanceStatus.clockInTime}
            formatTime={formatClockInTime}
            onSite={attendanceStatus.onSite}
          />
        )}

        {/* WiFi Warning Alert */}
        <Alert className="border-amber-200 bg-amber-50 dark:border-amber-900/50 dark:bg-amber-950/20">
          <Wifi className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          <AlertDescription className="text-amber-800 dark:text-amber-200">
            Please ensure you are connected to the company WiFi if on-site for
            accurate location tracking.
          </AlertDescription>
        </Alert>

        {locationError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{locationError}</AlertDescription>
          </Alert>
        )}

        {/* Action Buttons */}
        <div className="grid gap-3 sm:grid-cols-2">
          <Button
            className="h-14 text-base"
            disabled={isLoading || attendanceStatus.isClockedIn}
            onClick={handleClockIn}
            size="lg"
            variant={attendanceStatus.isClockedIn ? 'secondary' : 'default'}
          >
            {isLoading && !attendanceStatus.isClockedIn ? (
              <>
                <Clock className="mr-2 h-5 w-5 animate-spin" />
                Clocking In...
              </>
            ) : (
              <>
                <Clock className="mr-2 h-5 w-5" />
                {attendanceStatus.isClockedIn ? 'Clocked In' : 'Clock In'}
              </>
            )}
          </Button>

          <Button
            className="h-14 text-base"
            disabled={isLoading || !attendanceStatus.isClockedIn}
            onClick={handleClockOut}
            size="lg"
            variant={attendanceStatus.isClockedIn ? 'destructive' : 'secondary'}
          >
            {isLoading && attendanceStatus.isClockedIn ? (
              <>
                <Clock className="mr-2 h-5 w-5 animate-spin" />
                Clocking Out...
              </>
            ) : (
              <>
                <Clock className="mr-2 h-5 w-5" />
                Clock Out
              </>
            )}
          </Button>
        </div>

        {/* Current Status Indicator */}
        <div className="flex items-center justify-center gap-2 rounded-lg border p-3">
          <div
            className={`h-3 w-3 rounded-full ${
              attendanceStatus.isClockedIn
                ? 'animate-pulse bg-green-500'
                : 'bg-gray-300'
            }`}
          />
          <span className="font-medium text-sm">
            {attendanceStatus.isClockedIn
              ? 'Currently Clocked In'
              : 'Not Clocked In'}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
