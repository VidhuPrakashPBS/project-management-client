'use client';

import { Copy, FileText, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ApplyProjectTemplate } from './apply-project-template';

export function ProjectMainTasksEmpty({
  onCreate,
  appliedTemp,
  hasPermission,
  currentProjectId,
}: {
  onCreate?: () => void;
  appliedTemp?: () => void;
  hasPermission?: boolean;
  currentProjectId: string;
}) {
  return (
    <div className="rounded-lg border-2 border-dashed px-6 py-12 text-center">
      <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
      <h3 className="mt-4 font-medium text-lg">No Main Tasks Yet</h3>
      {hasPermission && (
        <p className="mt-1 text-muted-foreground text-sm">
          Start by creating a main task or apply a template from another project
          to reuse its main tasks. [1]
        </p>
      )}

      {hasPermission && (
        <div className="mt-6 justify-center gap-4 md:flex">
          <ApplyProjectTemplate
            currentProjectId={currentProjectId}
            onTemplateApplied={appliedTemp}
          >
            <Button>
              <Copy className="mr-2 h-4 w-4" />
              Use Template
            </Button>
          </ApplyProjectTemplate>
          <Button onClick={onCreate} variant="outline">
            <Plus className="mr-2 h-4 w-4" />
            Create Task
          </Button>
        </div>
      )}
    </div>
  );
}
