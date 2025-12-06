'use client';

import { FilesIcon } from 'lucide-react';
import FilePreview from '@/components/file-preview';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { projectFile } from '@/types/project';
import type { TaskFile } from '@/types/task';

export default function TaskFiles({ files }: { files: TaskFile[] }) {
  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
      <CardHeader className="py-3">
        <CardTitle className="text-base">Files</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        {files.length > 0 ? (
          <div className="w-full border-t pt-4">
            <h4 className="mb-3 font-medium text-foreground text-sm">
              Attached Files
            </h4>
            {/* Auto-fit grid for files */}
            <div className="flex h-[200px] flex-wrap gap-3 overflow-auto md:hidden md:justify-items-center">
              {files?.map((file) => (
                <FilePreview
                  className="w-full cursor-pointer"
                  file={file as projectFile}
                  key={file.id}
                  size={100}
                />
              ))}
            </div>

            <div className="hidden h-[200px] flex-wrap gap-3 overflow-auto md:flex md:justify-items-center">
              {files?.map((file) => (
                <FilePreview
                  className="w-full cursor-pointer"
                  file={file as projectFile}
                  key={file.id}
                  size={200}
                />
              ))}
            </div>
          </div>
        ) : (
          <div className="w-full pt-4">
            <p className="mb-3 flex flex-col items-center justify-center font-medium text-foreground text-sm">
              <FilesIcon className="h-10 w-10" />
              No files attached
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
