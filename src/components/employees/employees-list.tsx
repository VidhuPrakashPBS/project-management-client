'use client';

import {
  Building2,
  Calendar,
  Clock,
  ClockAlert,
  Filter,
  Globe,
  Mail,
  Phone,
  RefreshCw,
  Search,
  User,
  Users,
} from 'lucide-react';
import { useRouter } from 'nextjs-toploader/app';
import type { JSX } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { Employee, EmployeeListProps } from '@/types/employee';

const EmployeeList = ({
  employees,
  currentUserRole = 'admin',
  searchTerm = '',
  statusFilter = 'all',
  roleFilter = 'all',
  onSearchChange,
  onStatusFilterChange,
  onRoleFilterChange,
  onRefresh,
  isLoading = false,
  absentCount,
  lateCount,
  onLeaveCount,
  workingCount,
  roles,
}: EmployeeListProps) => {
  const route = useRouter();

  // Derive status for each employee
  const getStatus = (employee: Employee): string => {
    if (employee.onLeave) {
      return 'on_leave';
    }
    if (employee.working) {
      return 'working';
    }
    return 'absent';
  };

  // Derive work location
  const getWorkMode = (
    employee: Employee
  ): 'On Site' | 'Remote' | undefined => {
    if (employee.working === true) {
      if (employee.onSite === true) {
        return 'On Site';
      }
      if (employee.onSite === false) {
        return 'Remote';
      }
    }
    return;
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'working':
        return 'bg-green-100 text-green-800 hover:bg-green-200';
      case 'on_leave':
        return 'bg-blue-100 text-blue-800 hover:bg-blue-200';
      case 'absent':
        return 'bg-red-100 text-red-800 hover:bg-red-200';
      case 'late':
        return 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 hover:bg-gray-200';
    }
  };

  const getRoleColor = (role: string): string => {
    switch (role) {
      case 'owner':
        return 'bg-purple-100 text-purple-800';
      case 'admin':
        return 'bg-indigo-100 text-indigo-800';
      case 'manager':
        return 'bg-blue-100 text-blue-800';
      case 'team_lead':
        return 'bg-cyan-100 text-cyan-800';
      case 'senior_developer':
        return 'bg-emerald-100 text-emerald-800';
      case 'developer':
        return 'bg-green-100 text-green-800';
      case 'junior_developer':
        return 'bg-lime-100 text-lime-800';
      case 'intern':
        return 'bg-yellow-100 text-yellow-800';
      case 'hr':
        return 'bg-pink-100 text-pink-800';
      case 'accountant':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatTime = (iso?: string | null): string => {
    if (!iso) {
      return '--:--';
    }
    const date = new Date(iso);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  const formatRole = (role: string): string =>
    role
      .split('_')
      ?.map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');

  // Avatar fallback logic
  const getInitialsFromName = (name: string): string => {
    const parts = name.split(' ');
    if (parts.length === 1) {
      return parts[0].slice(0, 2).toUpperCase();
    }
    return `${parts[0].charAt(0)}${parts[1].charAt(0)}`.toUpperCase();
  };

  const shouldShowEmpId = (role: string): boolean =>
    role !== 'owner' && role !== 'admin';

  const getStatusIcon = (status: string): JSX.Element => {
    switch (status) {
      case 'working':
        return <Clock className="h-4 w-4" />;
      case 'on_leave':
        return <Calendar className="h-4 w-4" />;
      case 'absent':
        return <User className="h-4 w-4" />;
      case 'late':
        return <Clock className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const handleSearchChange = (value: string): void => {
    onSearchChange?.(value);
  };

  const handleStatusFilterChange = (value: string): void => {
    onStatusFilterChange?.(value);
  };

  const handleRoleFilterChange = (value: string): void => {
    onRoleFilterChange?.(value);
  };

  const handleEmployeeClick = (id: string): void => {
    route.push(`/employees/${id}`);
  };

  const renderSkeletonGrid = (): JSX.Element => (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: 8 })?.map((_, index) => (
        <Card className="animate-pulse" key={index as number}>
          <CardContent className="p-6">
            <div className="mb-4 flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-gray-200" />
                <div>
                  <div className="mb-2 h-4 w-24 rounded bg-gray-200" />
                  <div className="h-3 w-16 rounded bg-gray-200" />
                </div>
              </div>
              <div className="h-6 w-16 rounded bg-gray-200" />
            </div>
            <div className="space-y-2">
              <div className="h-3 w-full rounded bg-gray-200" />
              <div className="h-3 w-3/4 rounded bg-gray-200" />
              <div className="h-3 w-1/2 rounded bg-gray-200" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  const renderEmptyState = (): JSX.Element => (
    <Card>
      <CardContent className="py-12 text-center">
        <Users className="mx-auto mb-4 h-16 w-16 text-gray-300" />
        <h3 className="mb-2 font-medium text-gray-700 text-lg">
          No employees found
        </h3>
        <p className="text-muted-foreground">
          Try adjusting your search criteria or filters
        </p>
      </CardContent>
    </Card>
  );

  const renderEmployeeGrid = (): JSX.Element => (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {employees?.map((employee) => {
        const status = getStatus(employee);
        const mode = getWorkMode(employee);
        return (
          <Card
            className="transition-shadow duration-200 hover:shadow-lg"
            key={employee.id}
            onClick={() => handleEmployeeClick(employee.id)}
          >
            <CardContent className="p-6">
              <div className="mb-4 flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12">
                    <AvatarImage alt={employee.name} src={employee.image} />
                    <AvatarFallback className="bg-blue-100 font-semibold text-blue-600 text-lg">
                      {getInitialsFromName(employee.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-semibold text-lg">{employee.name}</h3>
                    {(currentUserRole === 'owner' ||
                      currentUserRole === 'admin') &&
                      shouldShowEmpId(employee.role) && (
                        <p className="font-mono text-muted-foreground text-sm">
                          {employee.empId}
                        </p>
                      )}
                  </div>
                </div>
                <Badge className={getStatusColor(status)} variant="secondary">
                  <div className="flex items-center gap-1">
                    {getStatusIcon(status)}
                    {status.replace('_', ' ').toUpperCase()}
                  </div>
                </Badge>
              </div>

              <div className="mb-4 space-y-2">
                <div className="flex items-center justify-between">
                  <Badge
                    className={getRoleColor(employee.role)}
                    variant="secondary"
                  >
                    {formatRole(employee.role)}
                  </Badge>

                  {/* On Site / Remote badge */}
                  {mode && (
                    <Badge
                      className={
                        mode === 'On Site'
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-orange-100 text-orange-700'
                      }
                      variant="secondary"
                    >
                      <span className="flex items-center gap-1">
                        {mode === 'On Site' ? (
                          <Building2 className="h-3 w-3" />
                        ) : (
                          <Globe className="h-3 w-3" />
                        )}
                        {mode}
                      </span>
                    </Badge>
                  )}
                </div>
              </div>

              <div className="mb-4 space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="truncate">{employee.email}</span>
                </div>
                {employee.phoneNumber && (
                  <div className="flex items-center gap-2 text-muted-foreground text-sm">
                    <Phone className="h-4 w-4" />
                    {employee.phoneNumber}
                  </div>
                )}
                <div className="flex items-center gap-2 text-muted-foreground text-sm">
                  <Calendar className="h-4 w-4" />
                  Joined {new Date(employee.joinedAt).getFullYear()}
                </div>
              </div>

              <div className="border-t pt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <div className="mb-1 flex items-center justify-center gap-1">
                      <Clock className="h-4 w-4 text-green-600" />
                      <span className="font-medium text-muted-foreground text-xs">
                        Clock In
                      </span>
                    </div>
                    <div className="font-mono text-sm">
                      {formatTime(employee.clockIn)}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="mb-1 flex items-center justify-center gap-1">
                      <ClockAlert className="h-4 w-4 text-red-600" />
                      <span className="font-medium text-muted-foreground text-xs">
                        Clock Out
                      </span>
                    </div>
                    <div className="font-mono text-sm">
                      {formatTime(employee.clockOut)}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );

  return (
    <div className="w-full space-y-6 p-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-6 w-6 text-blue-600" />
                Employee Directory
              </CardTitle>
              <CardDescription>
                Manage and monitor employee attendance and information
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                disabled={isLoading}
                onClick={onRefresh}
                size="sm"
                variant="outline"
              >
                <RefreshCw
                  className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`}
                />
                Refresh
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
            <div className="rounded-lg border p-3 text-center">
              <div className="font-bold text-2xl text-green-600">
                {workingCount}
              </div>
              <div className="text-muted-foreground text-sm">Working</div>
            </div>
            <div className="rounded-lg border p-3 text-center">
              <div className="font-bold text-2xl text-blue-600">
                {onLeaveCount}
              </div>
              <div className="text-muted-foreground text-sm">On Leave</div>
            </div>
            <div className="rounded-lg border p-3 text-center">
              <div className="font-bold text-2xl text-red-600">
                {absentCount}
              </div>
              <div className="text-muted-foreground text-sm">Absent</div>
            </div>
            <div className="rounded-lg border p-3 text-center">
              <div className="font-bold text-2xl text-yellow-600">
                {lateCount}
              </div>
              <div className="text-muted-foreground text-sm">Late</div>
            </div>
          </div>

          <div className="mb-6 flex flex-col gap-4 md:flex-row">
            <div className="flex-1">
              <div className="relative">
                <Search className="-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 transform text-gray-400" />
                <Input
                  className="pl-10"
                  onChange={(e) => handleSearchChange(e.target.value)}
                  placeholder="Search by name, email, or employee ID..."
                  value={searchTerm}
                />
              </div>
            </div>
            <Select
              onValueChange={handleStatusFilterChange}
              value={statusFilter}
            >
              <SelectTrigger className="w-full md:w-[180px]">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="working">Working</SelectItem>
                <SelectItem value="on_leave">On Leave</SelectItem>
                <SelectItem value="absent">Absent</SelectItem>
                <SelectItem value="late">Late</SelectItem>
              </SelectContent>
            </Select>
            <Select onValueChange={handleRoleFilterChange} value={roleFilter}>
              <SelectTrigger className="w-full md:w-[180px]">
                <User className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Filter by role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={'all'}>All Roles</SelectItem>
                {roles?.map((role) => (
                  <SelectItem key={role.id} value={role.id}>
                    {role.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-xl">
            Employee List ({employees.length}{' '}
            {employees.length === 1 ? 'employee' : 'employees'})
          </h2>
        </div>
        {isLoading && renderSkeletonGrid()}
        {!isLoading && employees.length === 0 && renderEmptyState()}
        {!isLoading && employees.length > 0 && renderEmployeeGrid()}
      </div>
    </div>
  );
};

export default EmployeeList;
