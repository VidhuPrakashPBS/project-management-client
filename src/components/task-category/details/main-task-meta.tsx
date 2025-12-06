import { Calendar, ListChecks, Projector } from 'lucide-react';
import FilePreview from '@/components/file-preview';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import type { File } from '@/types/main-task';

export function MainTaskMeta({
  title,
  description,
  startDate,
  subTaskCount,
  files,
  project,
}: {
  title: string;
  description?: string;
  startDate: string;
  subTaskCount: number;
  files: File[];
  project: string;
}) {
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
  return (
    <Card className="mb-8 border-border/50 bg-card/50 backdrop-blur-sm">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description ? <CardDescription>{description}</CardDescription> : null}
      </CardHeader>
      <CardContent className="">
        <div className="grid grid-cols-1 gap-4 text-sm md:grid-cols-3">
          <div className="flex items-center gap-2 ">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span>
              <strong>Created At:</strong> {formatDate(startDate)}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <ListChecks className="h-4 w-4 text-muted-foreground" />
            <span>
              <strong>Sub-tasks:</strong> {subTaskCount}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Projector className="h-4 w-4 text-muted-foreground" />
            <span>
              <strong>Project:</strong> {project}
            </span>
          </div>
        </div>
        {files.length > 0 && (
          <div className="w-full border-t pt-4">
            <h4 className="mb-3 font-medium text-foreground text-sm">
              Attached Files
            </h4>
            {/* Auto-fit grid for files */}
            <div className="flex h-[200px] flex-wrap gap-3 overflow-auto md:hidden md:justify-items-center">
              {files?.map((file) => (
                <FilePreview
                  className="w-full cursor-pointer"
                  file={file}
                  key={file.id}
                  size={100}
                />
              ))}
            </div>

            <div className="hidden h-[200px] flex-wrap gap-3 overflow-auto md:flex md:justify-items-center">
              {files?.map((file) => (
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
      </CardContent>
    </Card>
  );
}
