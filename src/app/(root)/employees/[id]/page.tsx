'use client';

import { ArrowLeft } from 'lucide-react';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import EmployeeProfile from '@/components/employees/details/employee-profile';
import TimesheetListReadonly from '@/components/employees/details/timesheet-list-readonly';
import type { TimesheetEntry } from '@/components/time-sheet/list-time-sheet';
import type { Employee } from '@/types/employee';

const EmployeeDetailsPage = () => {
  const params = useParams();
  const employeeId = params.id as string;

  const [employee, setEmployee] = useState<Employee | null>(null);
  const [timesheets, setTimesheets] = useState<TimesheetEntry[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [dateRangeFilter, setDateRangeFilter] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (employeeId) {
      setIsLoading(true);
      setEmployee(null);
      setTimesheets([]);
    }
  }, [employeeId]);

  const filteredTimesheets = timesheets
    .filter((timesheet) => {
      if (
        selectedDate &&
        timesheet.date.toDateString() !== selectedDate.toDateString()
      ) {
        return false;
      }
      if (selectedProject && timesheet.projectId !== selectedProject) {
        return false;
      }
      return true;
    })
    ?.map((timesheet) => ({
      ...timesheet,
      taskCategoryId: timesheet.taskCategoryId ?? '',
    }));

  const totalHours = filteredTimesheets.reduce(
    (sum, entry) => sum + entry.hours,
    0
  );

  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date);
  };

  const handleProjectFilter = (projectId: string) => {
    setSelectedProject(projectId);
  };

  const handleDateRangeFilter = (range: string) => {
    setDateRangeFilter(range);
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">Loading employee details...</div>
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">Employee not found</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="w-full space-y-6">
        <div className="flex flex-col gap-4">
          <button
            aria-label="Go back"
            className="flex cursor-pointer items-center gap-2 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            onClick={() => window.history.back()}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                window.history.back();
              }
              if (e.key === ' ') {
                e.preventDefault();
              }
            }}
            onKeyUp={(e) => {
              if (e.key === ' ') {
                window.history.back();
              }
            }}
            tabIndex={0}
            type="button"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>
          <div className="flex-1">
            <h1 className="font-semibold text-2xl">Employee Details</h1>
            <p className="text-muted-foreground">
              View employee information and timesheet entries
            </p>
          </div>
        </div>
        <EmployeeProfile employee={employee} showActions={false} />

        <TimesheetListReadonly
          dateRangeFilter={dateRangeFilter}
          onDateRangeFilter={handleDateRangeFilter}
          onDateSelect={handleDateSelect}
          onProjectFilter={handleProjectFilter}
          projects={[]}
          selectedDate={selectedDate}
          selectedProject={selectedProject}
          showFilters={true}
          timesheets={filteredTimesheets}
          totalHours={totalHours}
        />
      </div>
    </div>
  );
};

export default EmployeeDetailsPage;
