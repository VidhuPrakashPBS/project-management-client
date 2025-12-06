'use client';

import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';

export type ResourcePermission = {
  id?: string;
  permission: string;
  permissionId?: string;
  canView: boolean;
  canCreate: boolean;
  canUpdate: boolean;
  canDelete: boolean;
};

export type EditRoleValues = {
  roleId?: string;
  title: string;
  permissions: ResourcePermission[];
};

type RoleHasPermission = {
  id: string;
  permission: {
    id: string;
    name: string;
  };
  canView: boolean;
  canCreate: boolean;
  canUpdate: boolean;
  canDelete: boolean;
};

type EditRoleDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  roleData?: {
    id: string;
    title: string;
    permissions?: ResourcePermission[];
    roleHasPermissions?: RoleHasPermission[];
  };
  onSubmit?: (values: EditRoleValues) => Promise<void> | void;
  submittingText?: string;
  submitText?: string;
};

const getSampleRoleData = {
  id: 'role-1',
  title: 'Admin',
  roleHasPermissions: [
    {
      id: '1',
      permission: { id: '1', name: 'task-reassign' },
      canView: true,
      canCreate: true,
      canUpdate: true,
      canDelete: true,
    },
    {
      id: '2',
      permission: { id: '2', name: 'task-deadline-extension' },
      canView: true,
      canCreate: true,
      canUpdate: true,
      canDelete: false,
    },
    {
      id: '3',
      permission: { id: '3', name: 'project' },
      canView: true,
      canCreate: true,
      canUpdate: true,
      canDelete: true,
    },
    {
      id: '4',
      permission: { id: '4', name: 'project-activity' },
      canView: true,
      canCreate: false,
      canUpdate: false,
      canDelete: false,
    },
    {
      id: '5',
      permission: { id: '5', name: 'task' },
      canView: true,
      canCreate: true,
      canUpdate: true,
      canDelete: true,
    },
    {
      id: '6',
      permission: { id: '6', name: 'task-activity' },
      canView: true,
      canCreate: false,
      canUpdate: false,
      canDelete: false,
    },
    {
      id: '7',
      permission: { id: '7', name: 'main-task' },
      canView: true,
      canCreate: true,
      canUpdate: true,
      canDelete: true,
    },
    {
      id: '8',
      permission: { id: '8', name: 'user-management' },
      canView: true,
      canCreate: true,
      canUpdate: true,
      canDelete: false,
    },
    {
      id: '9',
      permission: { id: '9', name: 'reports' },
      canView: true,
      canCreate: true,
      canUpdate: false,
      canDelete: false,
    },
    {
      id: '10',
      permission: { id: '10', name: 'settings' },
      canView: true,
      canCreate: false,
      canUpdate: true,
      canDelete: false,
    },
  ] as RoleHasPermission[],
};

function transformSampleData(
  sampleData: typeof getSampleRoleData
): ResourcePermission[] {
  return sampleData.roleHasPermissions?.map((item) => ({
    id: item.id,
    permission: item.permission.name,
    permissionId: item.permission.id,
    canView: item.canView,
    canCreate: item.canCreate,
    canUpdate: item.canUpdate,
    canDelete: item.canDelete,
  }));
}

export function EditRoleDialog({
  open,
  onOpenChange,
  roleData = getSampleRoleData,
  onSubmit,
  submittingText = 'Updating…',
  submitText = 'Update',
}: EditRoleDialogProps) {
  const [title, setTitle] = useState<string>('');
  const [rows, setRows] = useState<ResourcePermission[]>([]);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState<string>('');

  const initialRows = useMemo(() => {
    if (roleData?.permissions) {
      return roleData.permissions;
    }
    if (roleData?.roleHasPermissions) {
      return transformSampleData(roleData as typeof getSampleRoleData);
    }
    return transformSampleData(getSampleRoleData);
  }, [roleData]);

  useEffect(() => {
    if (open) {
      setTitle(roleData?.title || '');
      setRows(initialRows);
      setQuery('');
      setError(null);
    }
  }, [open, roleData, initialRows]);

  function reset(): void {
    setTitle(roleData?.title || '');
    setRows(initialRows);
    setQuery('');
    setError(null);
  }

  function handleOpenChange(next: boolean): void {
    if (!next) {
      reset();
    }
    onOpenChange(next);
  }

  const validTitle = title.trim().length >= 3;
  const disabled = submitting || !validTitle;

  function toggleCell(
    idx: number,
    key: keyof ResourcePermission,
    value: boolean
  ): void {
    setRows((prev) =>
      prev?.map((r, i) => (i === idx ? { ...r, [key]: value } : r))
    );
  }

  function selectAllFor(idx: number): void {
    setRows((prev) =>
      prev?.map((r, i) =>
        i === idx
          ? {
              ...r,
              canView: true,
              canCreate: true,
              canUpdate: true,
              canDelete: true,
            }
          : r
      )
    );
  }

  function clearAllFor(idx: number): void {
    setRows((prev) =>
      prev?.map((r, i) =>
        i === idx
          ? {
              ...r,
              canView: false,
              canCreate: false,
              canUpdate: false,
              canDelete: false,
            }
          : r
      )
    );
  }

  function selectAllColumns(): void {
    setRows((prev) =>
      prev?.map((r) => ({
        ...r,
        canView: true,
        canCreate: true,
        canUpdate: true,
        canDelete: true,
      }))
    );
  }

  function clearAllColumns(): void {
    setRows((prev) =>
      prev?.map((r) => ({
        ...r,
        canView: false,
        canCreate: false,
        canUpdate: false,
        canDelete: false,
      }))
    );
  }

  const filteredRows = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) {
      return rows;
    }
    return rows.filter((r) => r.permission.toLowerCase().includes(q));
  }, [rows, query]);

  async function handleSubmit(): Promise<void> {
    try {
      setSubmitting(true);
      setError(null);

      const payload: EditRoleValues = {
        roleId: roleData?.id,
        title: title.trim(),
        permissions: rows,
      };

      await onSubmit?.(payload);
      onOpenChange(false);
    } catch (e) {
      const err = e as Error;
      setError(err?.message ?? 'Failed to update role');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog onOpenChange={handleOpenChange} open={open}>
      <DialogContent className="w-[95vw] sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit role</DialogTitle>
          <DialogDescription>
            Update the role title and modify permissions per resource.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4">
          <div className="grid gap-1.5">
            <label className="font-medium text-sm" htmlFor="roleTitle">
              Title
            </label>
            <Input
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. admin, owner, manager"
              value={title}
            />
            {!validTitle && title ? (
              <p className="text-red-600 text-xs">
                Title must be at least 3 characters.
              </p>
            ) : null}
          </div>

          <div className="grid gap-2">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <p className="font-medium text-sm">Permissions</p>
              <div className="flex flex-wrap items-center gap-2">
                <Input
                  aria-label="Search resources"
                  className="h-8 w-56"
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search resources…"
                  value={query}
                />
                <Button
                  onClick={clearAllColumns}
                  size="sm"
                  type="button"
                  variant="outline"
                >
                  Clear all
                </Button>
                <Button
                  onClick={selectAllColumns}
                  size="sm"
                  type="button"
                  variant="secondary"
                >
                  Select all
                </Button>
              </div>
            </div>

            <div className="overflow-auto rounded-md border">
              <div className="overflow-x-auto">
                <div className="max-h-[60vh] min-h-64 overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead className="sticky top-0 z-10 bg-muted/40">
                      <tr className="font-medium text-muted-foreground text-xs uppercase tracking-wide">
                        <th className="whitespace-nowrap px-3 py-2 text-left">
                          Resource
                        </th>
                        <th className="whitespace-nowrap px-3 py-2 text-center">
                          View
                        </th>
                        <th className="whitespace-nowrap px-3 py-2 text-center">
                          Create
                        </th>
                        <th className="whitespace-nowrap px-3 py-2 text-center">
                          Update
                        </th>
                        <th className="whitespace-nowrap px-3 py-2 text-center">
                          Delete
                        </th>
                        <th className="whitespace-nowrap px-3 py-2 text-right">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredRows?.map((r, i) => {
                        const originalIndex = rows.findIndex(
                          (row) => row.permission === r.permission
                        );
                        return (
                          <tr
                            className="border-t hover:bg-muted/20"
                            key={`${r.permission}-${i}`}
                          >
                            <td className="break-words px-3 py-2 font-medium">
                              {r.permission}
                            </td>
                            <td className="px-3 py-2">
                              <div className="flex justify-center">
                                <Checkbox
                                  aria-label={`View permission for ${r.permission}`}
                                  checked={r.canView}
                                  onCheckedChange={(v) =>
                                    toggleCell(
                                      originalIndex,
                                      'canView',
                                      Boolean(v)
                                    )
                                  }
                                />
                              </div>
                            </td>
                            <td className="px-3 py-2">
                              <div className="flex justify-center">
                                <Checkbox
                                  aria-label={`Create permission for ${r.permission}`}
                                  checked={r.canCreate}
                                  onCheckedChange={(v) =>
                                    toggleCell(
                                      originalIndex,
                                      'canCreate',
                                      Boolean(v)
                                    )
                                  }
                                />
                              </div>
                            </td>
                            <td className="px-3 py-2">
                              <div className="flex justify-center">
                                <Checkbox
                                  aria-label={`Update permission for ${r.permission}`}
                                  checked={r.canUpdate}
                                  onCheckedChange={(v) =>
                                    toggleCell(
                                      originalIndex,
                                      'canUpdate',
                                      Boolean(v)
                                    )
                                  }
                                />
                              </div>
                            </td>
                            <td className="px-3 py-2">
                              <div className="flex justify-center">
                                <Checkbox
                                  aria-label={`Delete permission for ${r.permission}`}
                                  checked={r.canDelete}
                                  onCheckedChange={(v) =>
                                    toggleCell(
                                      originalIndex,
                                      'canDelete',
                                      Boolean(v)
                                    )
                                  }
                                />
                              </div>
                            </td>
                            <td className="px-3 py-2">
                              <div className="flex justify-end gap-1">
                                <Button
                                  className="h-7 px-2 text-xs"
                                  onClick={() => clearAllFor(originalIndex)}
                                  size="sm"
                                  type="button"
                                  variant="outline"
                                >
                                  Clear
                                </Button>
                                <Button
                                  className="h-7 px-2 text-xs"
                                  onClick={() => selectAllFor(originalIndex)}
                                  size="sm"
                                  type="button"
                                  variant="secondary"
                                >
                                  All
                                </Button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                      {filteredRows.length === 0 ? (
                        <tr>
                          <td
                            className="px-3 py-8 text-center text-muted-foreground"
                            colSpan={6}
                          >
                            No matching resources found
                          </td>
                        </tr>
                      ) : null}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>

          {error ? (
            <div className="rounded-md border border-red-200 bg-red-50 p-3">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          ) : null}
        </div>

        <DialogFooter className="mt-4">
          <DialogClose asChild>
            <Button disabled={submitting} variant="outline">
              Cancel
            </Button>
          </DialogClose>
          <Button disabled={disabled} onClick={handleSubmit}>
            {submitting ? submittingText : submitText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
