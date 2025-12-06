'use client';

import { format } from 'date-fns';
import { Calendar, Clock, Mail, Phone } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import type { Employee, StatusFilter } from '@/types/employee';

interface EmployeeProfileProps {
  employee: Employee;
  showActions?: boolean;
}

const getStatusColor = (status: StatusFilter) => {
  switch (status) {
    case 'WORKING':
      return 'bg-green-500';
    case 'ON_LEAVE':
      return 'bg-blue-500';
    case 'LATE':
      return 'bg-yellow-500';
    case 'ABSENT':
      return 'bg-red-500';
    default:
      return 'bg-gray-500';
  }
};

const getStatusLabel = (status: StatusFilter) => {
  switch (status) {
    case 'WORKING':
      return 'Working';
    case 'ON_LEAVE':
      return 'On Leave';
    case 'LATE':
      return 'Late';
    case 'ABSENT':
      return 'Absent';
    default:
      return 'Unknown';
  }
};

export default function EmployeeProfile({
  employee,
  showActions: _showActions = false,
}: EmployeeProfileProps) {
  const getInitials = (firstName: string) => {
    return `${firstName.charAt(0)}}`.toUpperCase();
  };

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="text-xl">Employee Profile</CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        <div className="flex flex-col gap-6 md:flex-row">
          <div className="flex flex-col items-center space-y-4 md:items-start">
            <Avatar className="h-32 w-32">
              <AvatarImage alt={`${employee.name}`} src={employee.image} />
              <AvatarFallback className="text-2xl">
                {getInitials(employee.name)}
              </AvatarFallback>
            </Avatar>

            <div className="text-center md:text-left">
              <h2 className="font-semibold text-2xl">{employee.name}</h2>
              <p className="text-muted-foreground">{employee.role}</p>
              {employee.empId && (
                <p className="text-muted-foreground text-sm">
                  ID: {employee.empId}
                </p>
              )}
            </div>

            <div className="flex items-center gap-2">
              <div
                className={`h-3 w-3 rounded-full ${getStatusColor(employee.onSite ? 'WORKING' : 'ABSENT')}`}
              />
              <span className="font-medium text-sm">
                {getStatusLabel(employee.onSite ? 'WORKING' : 'ABSENT')}
              </span>
            </div>
          </div>

          <div className="grid flex-1 grid-cols-1 gap-6 md:grid-cols-2">
            <div className="space-y-4">
              <h3 className="font-medium text-lg">Contact Information</h3>

              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-muted-foreground text-sm">Email</p>
                    <p className="font-medium">{employee.email}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-muted-foreground text-sm">Phone</p>
                    <p className="font-medium">{employee.phoneNumber}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-medium text-lg">Work Information</h3>

              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-muted-foreground text-sm">Join Date</p>
                    <p className="font-medium">
                      {format(employee.joinedAt, 'dd MMM yyyy')}
                    </p>
                  </div>
                </div>

                {employee.clockIn && (
                  <div className="flex items-center gap-3">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-muted-foreground text-sm">
                        Clock In Time
                      </p>
                      <p className="font-medium">
                        {format(employee.clockIn, 'hh:mm a')}
                      </p>
                    </div>
                  </div>
                )}

                {employee.clockOut && (
                  <div className="flex items-center gap-3">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-muted-foreground text-sm">
                        Clock Out Time
                      </p>
                      <p className="font-medium">
                        {format(employee.clockOut, 'hh:mm a')}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="border-t pt-4">
          <div className="grid grid-cols-2 gap-4 text-center md:grid-cols-4">
            <div className="rounded-lg bg-muted p-3">
              <p className="font-bold text-2xl text-primary">
                {employee.onSite ? '✓' : '✗'}
              </p>
              <p className="text-muted-foreground text-sm">Active Today</p>
            </div>

            <div className="rounded-lg bg-muted p-3">
              <p className="font-bold text-2xl text-primary">
                {employee.empId || 'N/A'}
              </p>
              <p className="text-muted-foreground text-sm">Employee ID</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
