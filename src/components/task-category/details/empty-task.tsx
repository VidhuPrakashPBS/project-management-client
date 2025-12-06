import { FileText, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ApplyTemplateDialog } from './apply-template-dialog';
import { CreateSubTaskDialog } from './create-sub-task-dialog';

export function MainTaskEmptySubTasks({
  mainTaskId,
  projectId,
  onTaskCreated,
  permission,
}: {
  mainTaskId: string;
  projectId: string;
  onTaskCreated?: () => void;
  permission: boolean;
}) {
  return (
    <div className="flex flex-col justify-center rounded-lg border-2 border-dashed px-6 py-12 text-center">
      <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
      <h3 className="mt-4 font-medium text-lg">No Sub-tasks Yet</h3>
      {permission && (
        <>
          <p className="mt-1 text-muted-foreground text-sm">
            Get started by creating a new sub-task or applying a template from a
            previous main task in this project.
          </p>
          <div className="mt-6 justify-center gap-4 space-y-2 md:flex md:space-y-0">
            <ApplyTemplateDialog
              currentMainTaskId={mainTaskId}
              projectId={projectId}
            />
            <CreateSubTaskDialog
              mainTaskId={mainTaskId}
              onTaskCreated={onTaskCreated}
            >
              <Button variant="outline">
                <Plus className="mr-2 h-4 w-4" />
                Create Manually
              </Button>
            </CreateSubTaskDialog>
          </div>
        </>
      )}
    </div>
  );
}
