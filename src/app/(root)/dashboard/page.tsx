'use client';

import { useEffect, useState } from 'react';
import ClockInOut from '@/components/dashboard/clockin-out';
import OwnerProjectsTaskStats from '@/components/dashboard/owner-projects-task-stats';
import { useAuth } from '@/hooks/use-auth';

export default function Home() {
  const [permissions, setPermissions] = useState<{
    clockInOut: boolean;
  }>({
    clockInOut: false,
  });
  const { hasPermission } = useAuth();

  useEffect(() => {
    const response = hasPermission('ATTENDANCE-IN-OUT');
    if (response) {
      setPermissions({
        clockInOut: true,
      });
    }
  }, [hasPermission]);

  return (
    <div className="container mx-auto space-y-4 p-2 sm:p-4">
      {/* Header */}
      <div className="mb-4">
        <h1 className="font-bold text-2xl">Dashboard</h1>
        <p className="text-muted-foreground text-sm">
          Welcome back! Here's your overview
        </p>
      </div>

      {/* Grid Layout - 7 Cards Compact Design */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Total Projects Card */}
      </div>

      {/* Row 2: Clock In/Out and Task Stats */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Clock In/Out Component */}
        {permissions.clockInOut && (
          <div className="w-full lg:col-span-1">
            <ClockInOut />
          </div>
        )}

        {/* Task Stats Component */}
        <div
          className={`w-full ${permissions.clockInOut ? 'lg:col-span-2' : 'lg:col-span-3'} overflow-hidden`}
        >
          <OwnerProjectsTaskStats />
        </div>
      </div>

      {/* Row 3: Additional Dashboard Cards */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Additional cards can be added here */}
      </div>
    </div>
  );
}
