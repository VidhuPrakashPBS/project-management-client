'use client';

import { Edit, Plus, Shield, Trash2 } from 'lucide-react';
import { useRouter } from 'nextjs-toploader/app';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import RoleForm from '@/components/settings/role-management/role-form';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useAuth } from '@/hooks/use-auth';
import api from '@/lib/api';

interface Permission {
  id: string;
  permissionName: string;
  description: string | null;
}

interface Role {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
  permissions: Permission[];
}

export default function RolesPermissionsPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [hasPermission, setHasPermission] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState<boolean>(false);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [deleteRoleId, setDeleteRoleId] = useState<string>('');
  const router = useRouter();
  const { hasPermission: hasPermissionCheck } = useAuth();

  const checkPermission = useCallback(() => {
    const response = hasPermissionCheck('SETTINGS-ROLE-PERMISSION-MANAGEMENT');

    if (response) {
      setHasPermission(true);
    } else {
      router.replace('/dashboard');
    }
  }, [router, hasPermissionCheck]);

  const fetchRoles = useCallback(async () => {
    try {
      setIsLoading(true);
      const { data: result } = await api.get('/api/role-permissions', {
        params: {
          search: '',
          limit: 100,
          offset: 0,
        },
      });

      if (!(result.success && result.data)) {
        toast.error(result.message || 'Failed to load roles');
        return;
      }

      const rolesData = result.data.roles || [];
      setRoles(rolesData);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to load roles'
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    checkPermission();
  }, [checkPermission]);

  useEffect(() => {
    if (hasPermission) {
      fetchRoles();
    }
  }, [hasPermission, fetchRoles]);

  const handleCreate = () => {
    setSelectedRole(null);
    setIsDialogOpen(true);
  };

  const handleEdit = (role: Role) => {
    setSelectedRole(role);
    setIsDialogOpen(true);
  };

  const handleDeleteClick = (roleId: string) => {
    setDeleteRoleId(roleId);
    setIsDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    try {
      const { data: result } = await api.delete(
        `/api/role-permissions/${deleteRoleId}`
      );

      if (result.success) {
        toast.success('Role deleted successfully');
        setRoles(roles.filter((role) => role.id !== deleteRoleId));
        setIsDeleteDialogOpen(false);
        setDeleteRoleId('');
      } else {
        toast.error(result.message || 'Failed to delete role');
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to delete role'
      );
    }
  };

  const updateExistingRole = async (
    roleId: string,
    roleData: { name: string; description: string }
  ) => {
    const { data: result } = await api.put(
      `/api/role-permissions/${roleId}`,
      roleData
    );

    if (!result.success) {
      toast.error(result.message || 'Failed to update role');
      return null;
    }

    return roleId;
  };

  const createNewRole = async (roleData: {
    name: string;
    description: string;
  }) => {
    const { data: result } = await api.post('/api/role-permissions', roleData);

    if (result.success && result.data) {
      return result.data.id;
    }

    toast.error(result.message || 'Failed to create role');
    return null;
  };

  const assignPermissionsToRole = async (
    roleId: string,
    permissionIds: string[]
  ) => {
    if (permissionIds.length === 0) {
      return true;
    }

    const { data: permResult } = await api.post(
      '/api/role-permissions/assign-permissions',
      {
        roleId,
        permissionIds,
      }
    );

    if (!permResult.success) {
      toast.error(permResult.message || 'Failed to assign permissions');
      return false;
    }

    return true;
  };

  const handleSave = async (
    roleData: { name: string; description: string },
    permissionIds: string[]
  ) => {
    try {
      const roleId = selectedRole
        ? await updateExistingRole(selectedRole.id, roleData)
        : await createNewRole(roleData);

      if (!roleId) {
        return;
      }

      const permissionsAssigned = await assignPermissionsToRole(
        roleId,
        permissionIds
      );

      if (!permissionsAssigned) {
        return;
      }

      toast.success(
        selectedRole ? 'Role updated successfully' : 'Role created successfully'
      );
      fetchRoles();
      setIsDialogOpen(false);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to save role'
      );
    }
  };

  if (!hasPermission) {
    return null;
  }

  return (
    <div className="flex w-full flex-col gap-6">
      <div className="flex items-center justify-between">
        <div className="flex flex-col">
          <h1 className="font-bold text-2xl">Roles & Permissions</h1>
          <span className="text-muted-foreground text-sm">
            Manage roles and assign permissions to control access
          </span>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Add <span className="hidden md:inline">Role</span>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Roles</CardTitle>
          <CardDescription>
            View and manage all roles and their associated permissions
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading && (
            <div className="space-y-3">
              {[1, 2, 3]?.map((i) => (
                <div
                  className="h-16 w-full animate-pulse rounded bg-gray-200"
                  key={i}
                />
              ))}
            </div>
          )}

          {!isLoading && roles.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Shield className="mb-4 h-12 w-12 text-muted-foreground" />
              <h3 className="mb-2 font-semibold text-lg">No roles found</h3>
              <p className="mb-4 text-muted-foreground text-sm">
                Get started by creating your first role
              </p>
              <Button onClick={handleCreate} variant="outline">
                <Plus className="mr-2 h-4 w-4" />
                Create Role
              </Button>
            </div>
          )}

          {!isLoading && roles.length > 0 && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Role Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Permissions</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {roles?.map((role) => (
                  <TableRow key={role.id}>
                    <TableCell className="font-medium">{role.name}</TableCell>
                    <TableCell className="max-w-xs truncate">
                      {role.description || 'N/A'}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {role.permissions.length > 0 ? (
                          <Badge variant="secondary">
                            {role.permissions.length} permission
                            {role.permissions.length !== 1 ? 's' : ''}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground text-sm">
                            No permissions
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {new Date(role.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          onClick={() => handleEdit(role)}
                          size="sm"
                          variant="ghost"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          onClick={() => handleDeleteClick(role.id)}
                          size="sm"
                          variant="ghost"
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog onOpenChange={setIsDialogOpen} open={isDialogOpen}>
        <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedRole ? 'Edit Role' : 'Create Role'}
            </DialogTitle>
            <DialogDescription>
              {selectedRole
                ? 'Update the role details and permissions below'
                : 'Fill in the details to create a new role and assign permissions'}
            </DialogDescription>
          </DialogHeader>
          <RoleForm
            onCancel={() => setIsDialogOpen(false)}
            onSave={handleSave}
            role={selectedRole}
          />
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog onOpenChange={setIsDeleteDialogOpen} open={isDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Role</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this role? This action cannot be
              undone and may affect users assigned to this role.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              onClick={() => setIsDeleteDialogOpen(false)}
              variant="outline"
            >
              Cancel
            </Button>
            <Button onClick={handleDelete} variant="destructive">
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
