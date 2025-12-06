'use client';

import { useCallback, useEffect, useState } from 'react';
import AdminLeaveManagement from '@/components/leave-request/admin-leave-request';
import LeaveRequestCard from '@/components/leave-request/leave-request-card';
import LeaveStatistics from '@/components/leave-request/leave-statistics';
import PreviousLeaveRequests from '@/components/leave-request/previous-leave-request';
import { useAuth } from '@/hooks/use-auth';

const LeaveRequests = () => {
  const [refetchTrigger, setRefetchTrigger] = useState<number>(0);
  const [control, setControl] = useState<{
    create: boolean;
    edit: boolean;
    delete: boolean;
    viewAll: boolean;
    action: boolean;
  }>({
    create: false,
    edit: false,
    delete: false,
    viewAll: false,
    action: false,
  });
  const { hasPermission } = useAuth();

  const handleRefetch = () => {
    setRefetchTrigger((prev) => prev + 1);
  };

  const permissions = useCallback(() => {
    const createPermission = hasPermission('LEAVE-REQUEST-CREATE');
    const updatePermission = hasPermission('TIME-SHEET-UPDATE');
    const deletePermission = hasPermission('LEAVE-REQUEST-DELETE');
    const viewAllPermission = hasPermission('LEAVE-REQUEST-ALL-VIEW');
    const actionPermission = hasPermission('LEAVE-REQUEST-APPROVE-REJECT');

    setControl({
      action: actionPermission ?? false,
      create: createPermission ?? false,
      delete: deletePermission ?? false,
      edit: updatePermission ?? false,
      viewAll: viewAllPermission ?? false,
    });
  }, [hasPermission]);

  useEffect(() => {
    permissions();
  }, [permissions]);

  return (
    <div className="flex w-full flex-col gap-6">
      {control.create && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <LeaveRequestCard onSubmit={() => handleRefetch()} />
          <LeaveStatistics refetch={refetchTrigger} />
        </div>
      )}
      {control.create && control.delete && control.edit && (
        <PreviousLeaveRequests refetch={refetchTrigger} />
      )}
      {control.viewAll && (
        <AdminLeaveManagement actionControl={control.action} />
      )}
    </div>
  );
};

export default LeaveRequests;
