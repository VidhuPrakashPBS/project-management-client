import { FolderKanban, IndianRupee } from 'lucide-react';
import { useEffect, useState } from 'react';
import FilePreview from '@/components/file-preview';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import type { MainTask, Project } from '@/types/project';
import { MainTaskTimeline } from './main-task-timeline';

export default function ProjectOverview({ data }: { data: Project }) {
  const [project, setProject] = useState<Project | null>(null);

  useEffect(() => {
    setProject(data);
  }, [data]);

  return (
    <Card className="border-border bg-card shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-card-foreground">
          <FolderKanban className="h-5 w-5" />
          Project Overview
        </CardTitle>
        <CardDescription className="break-words">
          {project?.description}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Project Info Section */}
        <div
          className="auto-fit-grid grid gap-4"
          style={{
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          }}
        >
          {project?.completedAt && (
            <div className="min-w-0 space-y-1">
              <p className="text-muted-foreground text-sm">Completed</p>
              <Badge className="border-green-500/20 bg-green-500/10 text-green-600 text-xs dark:text-green-400">
                {new Date(project.completedAt).toLocaleDateString()}
              </Badge>
            </div>
          )}
          <div className="min-w-0 space-y-1">
            <p className="text-muted-foreground text-sm">Budget</p>
            <p className="flex items-center font-medium text-foreground">
              <IndianRupee className="mr-1 h-4 w-4 flex-shrink-0" />
              <span className="truncate">
                {project?.budget?.toLocaleString()}
              </span>
            </p>
          </div>
          <div className="min-w-0 space-y-1">
            <p className="text-muted-foreground text-sm">Owner</p>
            <p className="truncate font-medium text-foreground">
              {project?.owner?.name}
            </p>
          </div>
        </div>

        {/* Files Section */}
        {project?.files && project.files.length > 0 && (
          <div className="space-y-3">
            <p className="font-medium text-muted-foreground text-sm">
              Project Files ({project.files.length})
            </p>
            {/* Auto-fit grid for files */}
            <div className="flex h-[200px] flex-wrap gap-3 overflow-auto md:hidden md:justify-items-center">
              {project.files?.map((file) => (
                <FilePreview
                  className="w-full cursor-pointer"
                  file={file}
                  key={file.id}
                  size={100}
                />
              ))}
            </div>

            <div className="hidden h-[200px] flex-wrap gap-3 overflow-auto md:flex md:justify-items-center">
              {project.files?.map((file) => (
                <FilePreview
                  className="w-full cursor-pointer"
                  file={file}
                  key={file.id}
                  size={200}
                />
              ))}
            </div>
          </div>
        )}

        {/* Progress Section */}
        <div className="space-y-3">
          <p className="text-muted-foreground text-sm">
            Overall Progress ({project?.completedMainTasks}/
            {project?.totalMainTasks} tasks)
          </p>
          <div className="min-w-0">
            <MainTaskTimeline tasks={project?.mainTasks as MainTask[]} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
