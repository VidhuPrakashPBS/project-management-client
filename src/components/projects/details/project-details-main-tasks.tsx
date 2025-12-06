'use client';

import { Calendar, CheckCircle } from 'lucide-react';
import { useRouter } from 'nextjs-toploader/app';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { AppTable, type CommonTableColumn } from '@/components/app-table';
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
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/hooks/use-auth';
import api from '@/lib/api';
import type { MainTask } from '@/types/main-task';
import { decryptId, encryptId } from '@/utils/aes-security-encryption';
import { CreateTaskCategory } from './create-task-category';
import { ProjectMainTasksEmpty } from './project-main-tasks-empty';

const getStatusColor = (status: string) => {
  switch (status.toLowerCase()) {
    case 'completed':
      return 'bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20';
    case 'in_progress':
    case 'in-progress':
      return 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20';
    case 'pending':
      return 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border border-yellow-500/20';
    case 'on_hold':
    case 'on-hold':
      return 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/20';
    default:
      return 'bg-muted text-muted-foreground border border-border';
  }
};

const formatStatus = (status: string) => {
  return status.replace(/_/g, ' ').replace(/-/g, ' ');
};

const formatDate = (dateString: string) => {
  try {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return dateString;
  }
};

interface ProjectDetailsMainTasksProps {
  projectId: string;
  onChange: () => void;
}

export default function ProjectDetailsMainTasks({
  projectId,
  onChange,
}: ProjectDetailsMainTasksProps) {
  const [mainTasks, setMainTasks] = useState<MainTask[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const [openCreate, setOpenCreate] = useState<boolean>(false);
  const [createMainTask, setCreateMainTask] = useState<boolean>(false);
  const router = useRouter();
  const { hasPermission } = useAuth();

  const checkPermission = useCallback(() => {
    const createPermission = hasPermission('MAIN-TASK-CREATE');

    if (createPermission) {
      setCreateMainTask(true);
    }
  }, [hasPermission]);

  const fetchMainTasks = useCallback(async () => {
    if (!projectId) {
      return;
    }

    try {
      setLoading(true);
      const decryptedId = decryptId(projectId);

      const params = new URLSearchParams();
      params.append('projectId', decryptedId || '');

      if (search.trim()) {
        params.append('keyword', search.trim());
      }

      const response = await api.get(`/api/maintask?${params.toString()}`);

      if (response.data.success) {
        setMainTasks(response.data.data || []);
      } else {
        toast.error('Failed to fetch main tasks');
        setMainTasks([]);
      }
    } catch (error) {
      toast.error(`Failed to fetch main tasks: ${error}`);
      setMainTasks([]);
    } finally {
      setLoading(false);
    }
  }, [projectId, search]);

  useEffect(() => {
    fetchMainTasks();
    checkPermission();
  }, [fetchMainTasks, checkPermission]);

  // Debounce search to avoid too many API calls
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (search !== '') {
        fetchMainTasks();
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [search, fetchMainTasks]);

  const handleTaskCreated = () => {
    fetchMainTasks();
  };

  const columns: CommonTableColumn<MainTask>[] = useMemo(
    () => [
      {
        key: 'title',
        label: 'Task',
        render: (_v, row) => (
          <div className="min-w-[220px]">
            <div className="font-medium text-foreground">{row.title}</div>
            <div className="line-clamp-2 text-muted-foreground text-xs">
              {row.description}
            </div>
          </div>
        ),
      },
      {
        key: 'status',
        label: 'Status',
        className: 'whitespace-nowrap',
        render: (v) => (
          <Badge className={getStatusColor(String(v))}>
            {formatStatus(String(v))}
          </Badge>
        ),
      },
      {
        key: 'tasks',
        label: 'Progress',
        render: (_v, row) => {
          const completedTasks = row.completedTasks;
          const totalTasks = row?.totalTasks;
          const progress = row?.progress;

          return (
            <div className="w-48">
              <div className="mb-1 flex items-center justify-between text-xs">
                <span className="text-muted-foreground">
                  {completedTasks}/{totalTasks} sub-tasks
                </span>
                <span className="font-medium text-foreground">{progress}%</span>
              </div>
              <Progress className="h-2" value={progress} />
            </div>
          );
        },
      },
      {
        key: 'createdAt',
        label: 'Created',
        render: (v) => (
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">{formatDate(String(v))}</span>
          </div>
        ),
      },
    ],
    []
  );

  return (
    <div className="lg:col-span-2">
      <Card className="border-border bg-card shadow-lg">
        <CardHeader className="gap-2">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-card-foreground">
              <CheckCircle className="h-5 w-5" />
              Main Tasks
              {mainTasks.length > 0 && (
                <span className="font-normal text-muted-foreground text-sm">
                  ({mainTasks.length})
                </span>
              )}
            </CardTitle>
            {createMainTask && mainTasks.length > 0 && (
              <Button onClick={() => setOpenCreate(true)} variant="default">
                Create
              </Button>
            )}
          </div>

          <CardDescription>
            Breakdown of key deliverables and their progress
          </CardDescription>

          {mainTasks.length > 0 && (
            <div className="flex items-center gap-2">
              <Input
                className="max-w-md"
                disabled={loading}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search tasks..."
                value={search}
              />
            </div>
          )}
        </CardHeader>

        <CardContent>
          {mainTasks.length === 0 && !loading ? (
            <ProjectMainTasksEmpty
              appliedTemp={() => {
                fetchMainTasks();
                onChange();
              }}
              currentProjectId={projectId}
              hasPermission={createMainTask}
              onCreate={() => setOpenCreate(true)}
            />
          ) : (
            <AppTable<MainTask>
              columns={columns}
              data={mainTasks}
              emptyMessage={
                search
                  ? 'No tasks found matching your search'
                  : 'No main tasks found'
              }
              loading={loading}
              onRowClick={(row) => {
                router.push(`/task-category/${encryptId(row.id)}`);
              }}
            />
          )}
        </CardContent>
      </Card>

      <CreateTaskCategory
        onOpenChange={setOpenCreate}
        onTaskCreated={handleTaskCreated}
        open={openCreate}
        projectId={projectId}
      />
    </div>
  );
}
