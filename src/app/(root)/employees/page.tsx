'use client';

import { useRouter } from 'nextjs-toploader/app';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import EmployeeList from '@/components/employees/employees-list';
import { useAuth } from '@/hooks/use-auth';
import api from '@/lib/api';
import { authClient } from '@/lib/auth-client';
import type {
  Employee,
  EmployeesApiResponse,
  Role,
  StatusFilter,
} from '@/types/employee';

const EmployeesPage = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [roles, setRoles] = useState<Role[]>([]);
  const [organisationId, setOrganisationId] = useState<string>('');

  const [workingCount, setWorkingCount] = useState<number>(0);
  const [onLeaveCount, setOnLeaveCount] = useState<number>(0);
  const [absentCount, setAbsentCount] = useState<number>(0);
  const [lateCount, setLateCount] = useState<number>(0);
  const { hasPermission } = useAuth();
  const route = useRouter();

  useEffect(() => {
    const permission = hasPermission('EMPLOYEE-DASHBOARD-VIEW');
    if (!permission) {
      route.back();
    }
  }, [hasPermission, route]);

  // Fetch roles once on mount
  useEffect(() => {
    const fetchRoles = async (): Promise<void> => {
      try {
        const res = await api.get('/api/role-permissions', {
          params: { limit: 100 },
        });

        setRoles(res.data.data.roles ?? []);
      } catch (error) {
        setRoles([]);
        toast.error(`Failed to fetch roles ${error}`);
      }
    };

    fetchRoles();
  }, []); // Run once on mount

  // Fetch organisation ID once on mount
  useEffect(() => {
    const fetchOrganisation = async (): Promise<void> => {
      try {
        const session = await authClient.getSession();
        const userId = session?.data?.user.id;
        if (!userId) {
          toast.error('No user session found');
          return;
        }

        const userDetails = await api.get<{
          data: { data: { organisationId: string }[] };
        }>(`/api/user/${userId}`);

        const orgId = userDetails.data.data.data[0]?.organisationId;
        if (orgId) {
          setOrganisationId(orgId);
        } else {
          toast.error('No organisation found for user');
        }
      } catch (error) {
        toast.error(`Failed to resolve organisation ${error}`);
      }
    };

    fetchOrganisation();
  }, []); // Run once on mount

  // Fetch employees whenever filters or organisationId changes
  const fetchEmployees = useCallback(async (): Promise<void> => {
    if (!organisationId) {
      return;
    }

    try {
      setIsLoading(true);

      const params: Record<string, string> = {
        organisationId,
        status: statusFilter,
      };

      if (searchTerm.trim().length > 0) {
        params.search = searchTerm.trim();
      }

      if (roleFilter && roleFilter !== 'all') {
        params.roleId = roleFilter;
      }

      const res = await api.get<EmployeesApiResponse>('/api/employee', {
        params,
      });

      const data = res.data.data;
      setEmployees(data.data ?? []);
      setWorkingCount(data.info.totalWorking);
      setOnLeaveCount(data.info.totalOnLeave);
      setAbsentCount(data.info.absentToday);
      setLateCount(data.info.lateToday);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to fetch employees'
      );
      setEmployees([]);
      setWorkingCount(0);
      setOnLeaveCount(0);
      setAbsentCount(0);
      setLateCount(0);
    } finally {
      setIsLoading(false);
    }
  }, [organisationId, searchTerm, statusFilter, roleFilter]);

  // Fetch employees when organisationId or filters change
  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  const handleStatusChange = (value: string): void => {
    if (value === 'all') {
      setStatusFilter('ALL');
    } else if (value === 'working') {
      setStatusFilter('WORKING');
    } else if (value === 'on_leave') {
      setStatusFilter('ON_LEAVE');
    } else if (value === 'absent') {
      setStatusFilter('ABSENT');
    } else if (value === 'late') {
      setStatusFilter('LATE');
    }
  };

  const handleRoleChange = (value: string): void => {
    setRoleFilter(value);
  };

  const handleRefresh = (): void => {
    fetchEmployees();
  };

  const statusFilterForList = (() => {
    switch (statusFilter) {
      case 'WORKING':
        return 'working';
      case 'ON_LEAVE':
        return 'on_leave';
      case 'ABSENT':
        return 'absent';
      case 'LATE':
        return 'late';
      case 'ALL':
        return 'all';
      default:
        return 'all';
    }
  })();

  return (
    <div className="min-h-screen bg-gray-50">
      <EmployeeList
        absentCount={absentCount}
        currentUserRole="admin"
        employees={employees}
        isLoading={isLoading}
        lateCount={lateCount}
        onLeaveCount={onLeaveCount}
        onRefresh={handleRefresh}
        onRoleFilterChange={handleRoleChange}
        onSearchChange={setSearchTerm}
        onStatusFilterChange={handleStatusChange}
        roleFilter={roleFilter}
        roles={roles}
        searchTerm={searchTerm}
        statusFilter={statusFilterForList}
        workingCount={workingCount}
      />
    </div>
  );
};

export default EmployeesPage;
