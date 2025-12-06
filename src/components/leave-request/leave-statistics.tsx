'use client';

import { CheckCircle } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import api from '@/lib/api';
import { authClient } from '@/lib/auth-client';
import type {
  LeaveStatisticsData,
  LeaveStatisticsProps,
} from '@/types/leave-management';

const LeaveStatistics = ({ refetch }: LeaveStatisticsProps) => {
  const { data: session } = authClient.useSession();
  const [statistics, setStatistics] = useState<LeaveStatisticsData | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);

  const processResponseData = useCallback(
    (responseData: {
      success: boolean;
      data: LeaveStatisticsData | LeaveStatisticsData[];
    }) => {
      if (!responseData.success) {
        return null;
      }

      // Handle both array and object response formats
      const data = Array.isArray(responseData.data)
        ? responseData.data[0]
        : responseData.data;

      return data || null;
    },
    []
  );

  const fetchLeaveStatistics = useCallback(async () => {
    const userData = await api.get(`/api/user/${session?.user.id}`);

    if (!(session?.user?.id && userData.data?.data?.data[0].organisationId)) {
      return;
    }

    try {
      setIsLoading(true);
      const currentYear = new Date().getFullYear().toString();

      const response = await api.get(`/api/leave/user/${session.user.id}`, {
        params: {
          organisationId: userData.data?.data?.data[0].organisationId,
          year: currentYear,
        },
      });

      const data = processResponseData(response.data);
      if (data) {
        setStatistics(data);
      }
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : 'Failed to load leave statistics'
      );
    } finally {
      setIsLoading(false);
    }
  }, [session?.user?.id, processResponseData]);

  useEffect(() => {
    if (refetch >= 0) {
      fetchLeaveStatistics();
    }
  }, [fetchLeaveStatistics, refetch]);

  const leaveTypes = statistics
    ? [
        {
          label: 'Sick Leave',
          approved: statistics.sickLeaveApproved,
          total: statistics.sickLeaveTotal,
          percentage: statistics.sickLeavePercentage,
          color: 'bg-blue-500',
        },
        {
          label: 'Casual Leave',
          approved: statistics.casualLeaveApproved,
          total: statistics.casualLeaveTotal,
          percentage: statistics.casualLeavePercentage,
          color: 'bg-purple-500',
        },
        {
          label: 'Unpaid Leave',
          approved: statistics.unpaidLeaveApproved,
          total: statistics.unpaidLeaveTotal,
          percentage: statistics.unpaidLeavePercentage,
          color: 'bg-orange-500',
        },
      ]
    : [];

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Leave Statistics Dashboard
          </CardTitle>
          <CardDescription>
            Comprehensive overview of your leave requests and approval patterns
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="h-20 animate-pulse rounded bg-muted" />
            <div className="h-32 animate-pulse rounded bg-muted" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!statistics) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Leave Statistics Dashboard
          </CardTitle>
          <CardDescription>
            Comprehensive overview of your leave requests and approval patterns
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="py-8 text-center text-muted-foreground">
            No leave data available. Submit your first leave request to see
            statistics.
          </div>
        </CardContent>
      </Card>
    );
  }

  const totalRequests =
    statistics.approvedLeaves +
    statistics.rejectedLeaves +
    statistics.pendingLeaves;

  if (totalRequests === 0) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Leave Statistics Dashboard
          </CardTitle>
          <CardDescription>
            Comprehensive overview of your leave requests and approval patterns
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="py-8 text-center text-muted-foreground">
            No leave requests yet. Submit your first leave request to see
            statistics.
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Leave Statistics Dashboard
        </CardTitle>
        <CardDescription>
          Comprehensive overview of your leave requests and approval patterns
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Request Status Overview */}
        <div className="space-y-3">
          <h4 className="flex items-center gap-2 font-medium text-sm">
            <CheckCircle className="h-4 w-4" />
            Request Status Overview
          </h4>
          <div className="rounded-lg border bg-muted/50 p-4">
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              <div>
                <div className="text-muted-foreground text-xs">
                  Total Requests
                </div>
                <div className="font-bold text-2xl">{totalRequests}</div>
              </div>
              <div>
                <div className="text-muted-foreground text-xs">Approved</div>
                <div className="font-bold text-2xl text-green-600">
                  {statistics.approvedLeaves}
                </div>
              </div>
              <div>
                <div className="text-muted-foreground text-xs">Pending</div>
                <div className="font-bold text-2xl text-yellow-600">
                  {statistics.pendingLeaves}
                </div>
              </div>
              <div>
                <div className="text-muted-foreground text-xs">Rejected</div>
                <div className="font-bold text-2xl text-red-600">
                  {statistics.rejectedLeaves}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Leave Types Analysis */}
        <div className="space-y-3">
          <h4 className="font-medium text-sm">Leave Balance & Usage</h4>
          {leaveTypes?.map((type) => (
            <div className="space-y-2" key={type.label}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`h-3 w-3 rounded-full ${type.color}`} />
                  <span className="font-medium text-sm">{type.label}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground text-sm">
                  <span>
                    {type.approved} / {type.total === 9999 ? '∞' : type.total}
                  </span>
                  <Badge className="text-xs" variant="outline">
                    {type.percentage}% used
                  </Badge>
                </div>
              </div>
              <div className="space-y-1">
                <Progress className="h-2" max={100} value={type.percentage} />
                <div className="flex justify-between text-muted-foreground text-xs">
                  <span>{type.approved} days approved</span>
                  <span>
                    {type.total === 9999
                      ? 'Unlimited'
                      : `${type.total - type.approved} days remaining`}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default LeaveStatistics;
