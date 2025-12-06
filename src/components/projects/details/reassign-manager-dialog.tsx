'use client';

import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import api from '@/lib/api';
import { authClient } from '@/lib/auth-client';
import type { User } from '@/types/user';
import { decryptId } from '@/utils/aes-security-encryption';

const getInitials = (name: string): string => {
  return name
    .split(' ')
    ?.map((word) => word.charAt(0).toUpperCase())
    .join('')
    .slice(0, 2);
};

type Props = {
  open: boolean;
  alreadyAssignedManagers: User[];
  projectId: string;
  onOpenChange: (open: boolean) => void;
  onReassign: () => void;
};

export function ReassignManagerDialog({
  open,
  alreadyAssignedManagers,
  projectId,
  onOpenChange,
  onReassign,
}: Props) {
  const [selectedManagers, setSelectedManagers] = useState<string[]>([]);
  const [availableManagers, setAvailableManagers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingManagers, setLoadingManagers] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Remove duplicates from already assigned managers
  const uniqueAssignedManagers = alreadyAssignedManagers.filter(
    (manager, index, self) =>
      index === self.findIndex((m) => m.id === manager.id)
  );

  useEffect(() => {
    if (open) {
      const uniqueIds = alreadyAssignedManagers
        .filter(
          (manager, index, self) =>
            index === self.findIndex((m) => m.id === manager.id)
        )
        ?.map((m) => m.id);
      setSelectedManagers(uniqueIds);
    }
  }, [open, alreadyAssignedManagers]);

  const fetchAvailableManagers = useCallback(async () => {
    try {
      setLoadingManagers(true);
      const response = await api.get('/api/employee/managers');
      setAvailableManagers(response.data.data || response.data || []);
    } catch (error) {
      toast.error(`Failed to load managers: ${error}`);
      setAvailableManagers([]);
    } finally {
      setLoadingManagers(false);
    }
  }, []);

  useEffect(() => {
    if (open) {
      fetchAvailableManagers();
    }
  }, [open, fetchAvailableManagers]);

  const filteredManagers = availableManagers.filter(
    (manager) =>
      manager.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      manager.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleManagerSelection = (managerId: string) => {
    setSelectedManagers((prev) =>
      prev.includes(managerId)
        ? prev.filter((id) => id !== managerId)
        : [...prev, managerId]
    );
  };

  const handleConfirm = async () => {
    try {
      setLoading(true);

      const decryptedProjectId = await decryptId(projectId);

      if (!decryptedProjectId) {
        toast.error('Failed to decrypt project ID');
        return;
      }

      // Get unique IDs from originally assigned managers
      const originalManagerIds = uniqueAssignedManagers?.map((m) => m.id);

      // Current selection
      const assignedManagersId = selectedManagers;

      // Managers to unassign (were assigned but now unselected)
      const unselectedManagersId = originalManagerIds.filter(
        (id) => !selectedManagers.includes(id)
      );

      const session = await authClient.getSession();
      if (!session.data?.user?.id) {
        toast.error('You must be logged in to update managers');
        return;
      }

      const formData = new FormData();
      formData.append('id', decryptedProjectId);
      formData.append('userId', session.data.user.id);
      for (const id of assignedManagersId) {
        formData.append('assignedManagersId[]', id);
      }

      for (const id of unselectedManagersId) {
        formData.append('unselectedManagersId[]', id);
      }

      const response = await api.patch('/api/project', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.success) {
        toast.success(response.data.message || 'Managers updated successfully');
        onReassign();
        onOpenChange(false);
      } else {
        toast.error(response.data.message || 'Failed to update managers');
      }
    } catch (error) {
      toast.error(`Failed to update managers: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    // Reset to original selection
    const uniqueIds = alreadyAssignedManagers
      .filter(
        (manager, index, self) =>
          index === self.findIndex((m) => m.id === manager.id)
      )
      ?.map((m) => m.id);
    setSelectedManagers(uniqueIds);
    setSearchQuery('');
    onOpenChange(false);
  };

  const hasChanges = () => {
    const originalIds = uniqueAssignedManagers?.map((m) => m.id).sort();
    const currentIds = [...selectedManagers].sort();
    return JSON.stringify(originalIds) !== JSON.stringify(currentIds);
  };

  const handleKeyDown = (event: React.KeyboardEvent, managerId: string) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      toggleManagerSelection(managerId);
    }
  };

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Manage Project Managers</DialogTitle>
          <DialogDescription>
            Select managers to assign to this project. Currently assigned:{' '}
            {uniqueAssignedManagers.length} unique managers.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {uniqueAssignedManagers.length > 0 && (
            <div className="rounded-lg bg-muted/50 p-3">
              <p className="mb-2 font-medium text-sm">
                Currently Assigned Managers:
              </p>
              <div className="flex flex-wrap gap-2">
                {uniqueAssignedManagers?.map((manager) => (
                  <div
                    className="flex items-center gap-2 rounded bg-primary/10 px-2 py-1 text-primary text-sm"
                    key={manager.id}
                  >
                    <Avatar className="h-5 w-5">
                      <AvatarFallback className="text-xs">
                        {getInitials(manager.name || '')}
                      </AvatarFallback>
                    </Avatar>
                    {manager.name}
                  </div>
                ))}
              </div>
            </div>
          )}

          <Input
            className="w-full"
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search available managers..."
            value={searchQuery}
          />

          {loadingManagers ? (
            <div className="flex items-center justify-center py-8">
              <div className="h-8 w-8 animate-spin rounded-full border-primary border-b-2" />
              <span className="ml-2 text-muted-foreground text-sm">
                Loading managers...
              </span>
            </div>
          ) : (
            <ScrollArea className="h-[300px] w-full rounded-md border p-4">
              {filteredManagers.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground">
                  {searchQuery
                    ? 'No managers found matching your search.'
                    : 'No managers available.'}
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredManagers?.map((manager) => {
                    const isSelected = selectedManagers.includes(manager.id);

                    return (
                      <button
                        aria-label={`${isSelected ? 'Unselect' : 'Select'} ${manager.name} as manager`}
                        aria-pressed={isSelected}
                        className={`flex w-full items-center space-x-3 rounded-lg border p-3 text-left transition-colors ${
                          isSelected
                            ? 'border-primary bg-primary/5'
                            : 'border-border hover:bg-accent'
                        }`}
                        key={manager.id}
                        onClick={() => toggleManagerSelection(manager.id)}
                        onKeyDown={(e) => handleKeyDown(e, manager.id)}
                        type="button"
                      >
                        <div
                          className={`flex h-4 w-4 items-center justify-center rounded border-2 ${
                            isSelected
                              ? 'border-primary bg-primary'
                              : 'border-muted-foreground'
                          }`}
                        >
                          {isSelected && (
                            <svg
                              aria-hidden="true"
                              className="h-3 w-3 text-primary-foreground"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <title>Selected</title>
                              <path
                                clipRule="evenodd"
                                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                fillRule="evenodd"
                              />
                            </svg>
                          )}
                        </div>

                        <Avatar className="h-10 w-10">
                          <AvatarImage
                            alt={manager.name}
                            src={manager.image || '/placeholder.svg'}
                          />
                          <AvatarFallback className="bg-secondary text-secondary-foreground">
                            {getInitials(manager.name || '')}
                          </AvatarFallback>
                        </Avatar>

                        <div className="min-w-0 flex-1">
                          <p className="truncate font-medium text-sm">
                            {manager.name}
                          </p>
                          <p className="truncate text-muted-foreground text-xs">
                            {manager.email}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </ScrollArea>
          )}

          <div className="text-muted-foreground text-sm">
            {selectedManagers.length} manager
            {selectedManagers.length !== 1 ? 's' : ''} selected
            {hasChanges() && (
              <span className="ml-2 text-amber-600">• Changes detected</span>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button disabled={loading} onClick={handleCancel} variant="outline">
            Cancel
          </Button>
          <Button disabled={loading || !hasChanges()} onClick={handleConfirm}>
            {loading ? 'Updating...' : 'Update Managers'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
