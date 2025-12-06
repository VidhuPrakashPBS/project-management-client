// components/tasks/details/TaskAssignees.tsx
'use client';

import Image from 'next/image';
import { useEffect, useState, useTransition } from 'react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import api from '@/lib/api';
import type { Employee } from '@/types/main-task';

export default function TaskAssignees({
  taskId,
  reassignPermission,
  assignedUserId,
}: {
  taskId: string;
  reassignPermission: boolean;
  assignedUserId: string;
}) {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [assigneeId, setAssigneeId] = useState<string>('');
  const [isPending, startTransition] = useTransition();
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        setLoading(true);

        const response = await api.get('/api/employee');

        if (response.data.data) {
          setEmployees(response.data.data.data);
        }
      } catch (err) {
        toast.error(`Something went wrong. Please try again. ${err}`);
      } finally {
        setLoading(false);
      }
    };

    fetchEmployees();
  }, []);

  useEffect(() => {
    setAssigneeId(assignedUserId);
  }, [assignedUserId]);

  const handleChange = (nextId: string) => {
    setAssigneeId(nextId);
    startTransition(async () => {
      try {
        const formData = new FormData();
        formData.append('id', taskId);
        formData.append('reAssignedToEmployeeId', nextId);

        const response = await api.put('/api/tasks', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });

        if (!response.data.success) {
          throw new Error(response.data.message || 'Failed to reassign task');
        }

        if (response.data.data.success) {
          toast.success(
            response.data.data.message || 'Task re assigned successfully'
          );
        }
      } catch (err) {
        toast.error(`Failed to re assign task. ${err}`);
      }
    });
  };

  const selectedEmployee = employees?.find((emp) => emp.id === assigneeId);

  if (loading) {
    return (
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <CardHeader className="py-3">
          <CardTitle className="text-base">Assignee</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center p-4">
            <div className="h-6 w-6 animate-spin rounded-full border-primary border-b-2" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
      <CardHeader className="py-3">
        <CardTitle className="text-base">
          {reassignPermission ? 'Assignee' : 'Assigned to '}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Select
          disabled={isPending || !reassignPermission}
          onValueChange={handleChange}
          value={assigneeId}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select an employee">
              {selectedEmployee ? (
                <div className="flex items-center gap-2">
                  <Image
                    alt={selectedEmployee.name}
                    className="h-6 w-6 rounded-full object-cover"
                    height={24}
                    src={selectedEmployee.image.trim()}
                    width={24}
                  />
                  <span>{selectedEmployee.name}</span>
                </div>
              ) : (
                <p>Select an employee</p>
              )}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {employees?.map((emp) => (
              <SelectItem key={emp.id} value={emp.id}>
                <div className="flex items-center gap-2">
                  <Image
                    alt={emp.name}
                    className="h-6 w-6 rounded-full object-cover"
                    height={24}
                    src={emp.image.trim()}
                    width={24}
                  />
                  <span>{emp.name}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </CardContent>
    </Card>
  );
}
