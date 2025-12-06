'use client';

import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import api from '@/lib/api';

interface Permission {
  id: string;
  permissionName: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

interface Role {
  id: string;
  name: string;
  description: string | null;
  permissions: Array<{ id: string; permissionName: string }>;
}

interface RoleFormProps {
  role: Role | null;
  onSave: (
    roleData: { name: string; description: string },
    permissionIds: string[]
  ) => void;
  onCancel: () => void;
}

export default function RoleForm({ role, onSave, onCancel }: RoleFormProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [availablePermissions, setAvailablePermissions] = useState<
    Permission[]
  >([]);
  const [selectedPermissions, setSelectedPermissions] = useState<Set<string>>(
    new Set()
  );
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchPermissions = useCallback(async () => {
    try {
      setIsLoading(true);
      const { data: result } = await api.post(
        '/api/role-permissions/permissions-list',
        {
          params: {
            search: searchTerm,
            limit: 100,
            offset: 0,
          },
        }
      );

      if (result.success && result.data) {
        setAvailablePermissions(result.data);
      } else {
        toast.error(result.message || 'Failed to load permissions');
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to load permissions'
      );
    } finally {
      setIsLoading(false);
    }
  }, [searchTerm]);

  useEffect(() => {
    fetchPermissions();
  }, [fetchPermissions]);

  useEffect(() => {
    if (role) {
      setName(role.name);
      setDescription(role.description || '');
      const permIds = new Set(role.permissions?.map((p) => p.id));
      setSelectedPermissions(permIds);
    }
  }, [role]);

  const handlePermissionToggle = (permissionId: string) => {
    setSelectedPermissions((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(permissionId)) {
        newSet.delete(permissionId);
      } else {
        newSet.add(permissionId);
      }
      return newSet;
    });
  };

  const handleSelectAll = () => {
    if (selectedPermissions.size === availablePermissions.length) {
      setSelectedPermissions(new Set());
    } else {
      setSelectedPermissions(new Set(availablePermissions?.map((p) => p.id)));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error('Role name is required');
      return;
    }

    setIsSaving(true);
    try {
      await onSave(
        { name: name.trim(), description: description.trim() },
        Array.from(selectedPermissions)
      );
    } finally {
      setIsSaving(false);
    }
  };

  // Group permissions by category (prefix before the first hyphen)
  const groupedPermissions = availablePermissions.reduce(
    (acc, permission) => {
      const category = permission.permissionName.split('-')[0] || 'OTHER';
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(permission);
      return acc;
    },
    {} as Record<string, Permission[]>
  );

  return (
    <form className="space-y-6" onSubmit={handleSubmit}>
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">
            Role Name <span className="text-destructive">*</span>
          </Label>
          <Input
            disabled={isSaving}
            id="name"
            maxLength={100}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., Manager, Employee, Admin"
            required
            value={name}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            disabled={isSaving}
            id="description"
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe the role and its responsibilities..."
            rows={3}
            value={description}
          />
        </div>
      </div>

      <Separator />

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <Label className="text-base">Permissions</Label>
            <p className="text-muted-foreground text-sm">
              Select permissions to assign to this role
            </p>
          </div>
          <Button
            disabled={isLoading || isSaving}
            onClick={handleSelectAll}
            size="sm"
            type="button"
            variant="outline"
          >
            {selectedPermissions.size === availablePermissions.length
              ? 'Deselect All'
              : 'Select All'}
          </Button>
        </div>

        <div className="space-y-2">
          <Input
            disabled={isLoading || isSaving}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search permissions..."
            value={searchTerm}
          />
        </div>

        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3]?.map((i) => (
              <div
                className="h-10 w-full animate-pulse rounded bg-gray-200"
                key={i}
              />
            ))}
          </div>
        ) : (
          <ScrollArea className="h-[400px] rounded-md border p-4">
            <div className="space-y-6">
              {Object.entries(groupedPermissions)?.map(
                ([category, permissions]) => (
                  <div className="space-y-3" key={category}>
                    <h4 className="font-semibold text-sm capitalize">
                      {category.toLowerCase().replace(/_/g, ' ')}
                    </h4>
                    <div className="space-y-2">
                      {permissions?.map((permission) => (
                        <div
                          className="flex items-start space-x-3 rounded-lg border p-3 hover:bg-accent"
                          key={permission.id}
                        >
                          <Checkbox
                            checked={selectedPermissions.has(permission.id)}
                            disabled={isSaving}
                            id={permission.id}
                            onCheckedChange={() =>
                              handlePermissionToggle(permission.id)
                            }
                          />
                          <div className="flex-1 space-y-1">
                            <label
                              className="cursor-pointer font-medium text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                              htmlFor={permission.id}
                            >
                              {permission.permissionName}
                            </label>
                            {permission.description && (
                              <p className="text-muted-foreground text-xs">
                                {permission.description}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              )}

              {availablePermissions.length === 0 && (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <p className="text-muted-foreground">
                    {searchTerm
                      ? 'No permissions found matching your search'
                      : 'No permissions available'}
                  </p>
                </div>
              )}
            </div>
          </ScrollArea>
        )}

        <div className="text-muted-foreground text-sm">
          {selectedPermissions.size} permission
          {selectedPermissions.size !== 1 ? 's' : ''} selected
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <Button
          disabled={isSaving}
          onClick={onCancel}
          type="button"
          variant="outline"
        >
          Cancel
        </Button>
        <Button disabled={isSaving || !name.trim()} type="submit">
          {isSaving && (
            <>
              <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              Saving...
            </>
          )}
          {!isSaving && role && 'Update Role'}
          {!(isSaving || role) && 'Create Role'}
        </Button>
      </div>
    </form>
  );
}
