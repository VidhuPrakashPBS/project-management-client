'use client';

import { Users } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useAuth } from '@/hooks/use-auth';
import type { ProjectAssignProps } from '@/types/project';
import { ReassignManagerDialog } from './reassign-manager-dialog';

const getInitials = (name: string): string => {
  return name
    .split(' ')
    ?.map((word) => word.charAt(0).toUpperCase())
    .join('')
    .slice(0, 2);
};

export default function ProjectAssign({
  managers = [],
  projectId,
  onManagersUpdate,
  forShowTeam,
}: ProjectAssignProps) {
  const [dialogOpen, setDialogOpen] = useState<boolean>(false);
  const [canReassign, setCanReassign] = useState<boolean>(false);
  const { hasPermission } = useAuth();
  const uniqueManagers = managers.filter(
    (manager, index, self) =>
      index === self.findIndex((m) => m.id === manager.id)
  );

  const handleReassignManager = () => {
    onManagersUpdate?.();
    setDialogOpen(false);
  };

  useEffect(() => {
    const checkPermission = () => {
      const permission = hasPermission('PROJECT-REASSIGN');

      setCanReassign(permission ?? false);
    };

    checkPermission();
  }, [hasPermission]);

  return (
    <Card className="border-border bg-card shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-card-foreground">
          <Users className="h-5 w-5" />
          {forShowTeam ? 'Project Team' : 'Assigned Managers'}
          {uniqueManagers.length > 0 && (
            <span className="font-normal text-muted-foreground text-sm">
              ({uniqueManagers.length})
            </span>
          )}
        </CardTitle>
      </CardHeader>

      <CardContent>
        {uniqueManagers.length === 0 ? (
          <p className="py-4 text-center text-muted-foreground">
            {forShowTeam ? 'No other team members' : 'No managers assigned.'}
          </p>
        ) : (
          <div className="space-y-3">
            {uniqueManagers?.map((manager) => (
              <div className="flex items-center space-x-3" key={manager.id}>
                <Avatar className="h-10 w-10">
                  <AvatarImage
                    alt={manager.name}
                    src={manager.image || '/placeholder.svg'}
                  />
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    {getInitials(manager.name || '')}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-card-foreground text-sm">
                    {manager.name}
                  </p>
                  <p className="truncate text-muted-foreground text-xs">
                    {manager.email}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      {canReassign && !forShowTeam && (
        <CardFooter>
          <Button
            className="w-full"
            onClick={() => setDialogOpen(true)}
            size="sm"
            variant="outline"
          >
            {uniqueManagers.length > 0 ? 'Manage Managers' : 'Assign Manager'}
          </Button>
        </CardFooter>
      )}

      {canReassign && !forShowTeam && (
        <ReassignManagerDialog
          alreadyAssignedManagers={managers}
          onOpenChange={setDialogOpen}
          onReassign={handleReassignManager}
          open={dialogOpen}
          projectId={projectId as string}
        />
      )}
    </Card>
  );
}
