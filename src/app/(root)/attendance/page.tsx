'use client';

import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { AppTable, type CommonTableColumn } from '@/components/app-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import api from '@/lib/api';
import { authClient } from '@/lib/auth-client';
import { cn } from '@/lib/utils';
import type { AttendanceRecord, PaginationData } from '@/types/attendance';

export default function AttendancePage() {
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [pagination, setPagination] = useState<PaginationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [organisationId, setOrganisationId] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [date, setDate] = useState<Date>(new Date());
  const [notClockedIn, setNotClockedIn] = useState(false);
  const [onSiteFilter, setOnSiteFilter] = useState<boolean | null>(null);
  const [limit, setLimit] = useState(50);
  const [offset, setOffset] = useState(0);

  // Define table columns
  const columns: CommonTableColumn<AttendanceRecord>[] = [
    {
      key: 'userName',
      label: 'Employee',
      className: 'min-w-[200px]',
      render: (_, row) => {
        const userName = row.userName || 'Unknown';
        const empId = row.empId || 'No ID';
        const userInitial = userName.charAt(0);

        return (
          <div className="flex items-center gap-3">
            {row.userImage ? (
              <Image
                alt={userName}
                className="h-10 w-10 rounded-full"
                height={40}
                src={row.userImage}
                width={40}
              />
            ) : (
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                <span className="font-medium text-sm">{userInitial}</span>
              </div>
            )}
            <div>
              <div className="font-medium">{userName}</div>
              <div className="text-muted-foreground text-sm">{empId}</div>
            </div>
          </div>
        );
      },
    },
    {
      key: 'userEmail',
      label: 'Contact',
      className: 'min-w-[200px]',
      render: (_, row) => (
        <div className="text-sm">
          <div>{row.userEmail}</div>
          <div className="text-muted-foreground">{row.phoneNumber}</div>
        </div>
      ),
    },
    {
      key: 'clockin',
      label: 'Clock In',
      className: 'min-w-[150px]',
      render: (_, row) => {
        const clockInTime = new Date(row.clockin).toLocaleTimeString();
        const createdDate = new Date(row.createdAt).toLocaleDateString();

        return (
          <div className="text-sm">
            <div>{clockInTime}</div>
            <div className="text-muted-foreground">{createdDate}</div>
          </div>
        );
      },
    },
    {
      key: 'onSite',
      label: 'Location',
      className: 'min-w-[120px]',
      render: (_, row) => {
        if (row.onSite === null) {
          return null;
        }
        return (
          <Badge variant={row.onSite ? 'default' : 'secondary'}>
            {row.onSite ? 'On-Site' : 'Remote'}
          </Badge>
        );
      },
    },
    {
      key: 'os',
      label: 'Device Info',
      className: 'min-w-[180px]',
      render: (_, row) => (
        <div className="text-sm">
          <div>{row.os}</div>
          <div>{row.browser}</div>
          <div className="text-muted-foreground text-xs">{row.loggedIp}</div>
        </div>
      ),
    },
  ];

  // Fetch user and organisation ID
  useEffect(() => {
    const extractOrganisationId = (userResponse: unknown): string => {
      if (!userResponse) {
        throw new Error('Failed to fetch user data');
      }

      const orgId = (
        userResponse as {
          data?: { data?: { data?: Array<{ organisationId?: string }> } };
        }
      ).data?.data?.data?.[0]?.organisationId;

      if (!orgId) {
        throw new Error('Organisation ID not found');
      }

      return orgId;
    };

    const fetchUserData = async () => {
      try {
        const session = await authClient.getSession();
        if (!session?.data?.user?.id) {
          throw new Error('No user session found');
        }

        const userResponse = await api.get(`/api/user/${session.data.user.id}`);
        const orgId = extractOrganisationId(userResponse);
        setOrganisationId(orgId);
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to load user data';
        toast.error(errorMessage);
      }
    };

    fetchUserData();
  }, []);

  // Fetch attendance data
  useEffect(() => {
    if (!organisationId) {
      return;
    }

    const buildRequestBody = () => {
      const body: {
        organisationId: string;
        limit: number;
        offset: number;
        date: string;
        notClockedIn?: boolean;
        search?: string;
        onSite?: boolean;
      } = {
        organisationId: organisationId || '',
        limit: Math.min(Math.max(limit, 1), 100),
        offset: Math.max(offset, 0),
        date: format(date, 'yyyy-MM-dd'),
      };

      // Only add notClockedIn if true
      if (notClockedIn === true) {
        body.notClockedIn = true;
      }

      // Add optional search parameter
      if (search.trim()) {
        body.search = search.trim();
      }

      // Add optional onSite filter
      if (onSiteFilter !== null) {
        body.onSite = onSiteFilter;
      }

      return body;
    };

    const extractAttendanceData = (response: unknown) => {
      const data = (
        response as {
          data?: {
            success?: boolean;
            data?: { data?: unknown; pagination?: PaginationData };
          };
        }
      )?.data;

      if (!data?.success) {
        throw new Error('Invalid response structure');
      }

      const attendanceData = Array.isArray(data?.data?.data)
        ? data.data.data
        : [];
      return { attendanceData, pagination: data.data?.pagination || null };
    };

    const fetchAttendance = async () => {
      setLoading(true);

      try {
        const requestBody = buildRequestBody();
        const response = await api.post(
          '/api/attendance/working-employees',
          requestBody
        );

        const { attendanceData, pagination: paginationData } =
          extractAttendanceData(response);
        setAttendance(attendanceData);
        setPagination(paginationData);
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to load attendance data';
        toast.error(errorMessage);

        setAttendance([]);
        setPagination(null);
      } finally {
        setLoading(false);
      }
    };

    fetchAttendance();
  }, [organisationId, search, date, notClockedIn, onSiteFilter, limit, offset]);

  const handleSearch = (value: string) => {
    setSearch(value);
    setOffset(0);
  };

  const handleDateChange = (newDate: Date | undefined) => {
    if (newDate) {
      setDate(newDate);
      setOffset(0);
    }
  };

  const handleLimitChange = (value: string) => {
    const newLimit = Number.parseInt(value, 10);
    setLimit(newLimit);
    setOffset(0);
  };

  const handlePrevPage = () => {
    if (offset > 0) {
      setOffset(Math.max(0, offset - limit));
    }
  };

  const handleNextPage = () => {
    if (pagination?.hasMore) {
      setOffset(offset + limit);
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="font-bold text-3xl">Attendance Statistics</h1>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            {/* Search */}
            <div className="space-y-2">
              <Label htmlFor="search">Search</Label>
              <Input
                id="search"
                onChange={(e) => handleSearch(e.target.value)}
                placeholder="Search by name, email..."
                value={search}
              />
            </div>

            {/* Date Picker */}
            <div className="space-y-2">
              <Label>Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    className={cn(
                      'w-full justify-start text-left font-normal',
                      !date && 'text-muted-foreground'
                    )}
                    variant="outline"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, 'PPP') : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent align="start" className="w-auto p-0">
                  <Calendar
                    initialFocus
                    mode="single"
                    onSelect={handleDateChange}
                    selected={date}
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Status */}
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                onValueChange={(value) =>
                  setNotClockedIn(value === 'not-clocked')
                }
                value={notClockedIn ? 'not-clocked' : 'clocked'}
              >
                <SelectTrigger id="status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="clocked">Clocked In</SelectItem>
                  <SelectItem value="not-clocked">Not Clocked In</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Location */}
            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Select
                onValueChange={(value) => {
                  setOnSiteFilter(value === 'all' ? null : value === 'true');
                  setOffset(0);
                }}
                value={onSiteFilter === null ? 'all' : String(onSiteFilter)}
              >
                <SelectTrigger id="location">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="true">On-Site</SelectItem>
                  <SelectItem value="false">Remote</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Attendance List */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <Label className="text-sm" htmlFor="pageSize">
              Per page:
            </Label>
            <Select onValueChange={handleLimitChange} value={limit.toString()}>
              <SelectTrigger className="w-20" id="pageSize">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="25">25</SelectItem>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <AppTable
            columns={columns}
            data={attendance}
            emptyMessage="No attendance records found"
            loading={loading}
            loadingRows={limit}
          />

          {/* Pagination */}
          {pagination && attendance.length > 0 && (
            <div className="flex items-center justify-between pt-4">
              <div className="text-muted-foreground text-sm">
                Showing {offset + 1} to{' '}
                {Math.min(offset + limit, pagination.total)} of{' '}
                {pagination.total} results
              </div>
              <div className="flex items-center gap-2">
                <Button
                  disabled={offset === 0}
                  onClick={handlePrevPage}
                  size="sm"
                  variant="outline"
                >
                  Previous
                </Button>
                <span className="text-sm">
                  Page {Math.floor(offset / limit) + 1} of{' '}
                  {Math.ceil(pagination.total / limit)}
                </span>
                <Button
                  disabled={!pagination.hasMore}
                  onClick={handleNextPage}
                  size="sm"
                  variant="outline"
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
