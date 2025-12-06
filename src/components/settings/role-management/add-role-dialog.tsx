'use client';

import { useMemo, useState } from 'react';
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
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';

export type ResourcePermission = {
  resource: string;
  canView: boolean;
  canCreate: boolean;
  canUpdate: boolean;
  canDelete: boolean;
};

export type AddRoleValues = {
  title: string;
  permissions: ResourcePermission[];
};

type ApplyFilters = (filters: {
  q?: string;
}) => Promise<ResourcePermission[]> | Promise<undefined>;

type AddRoleDialogProps = {
  trigger?: React.ReactNode;
  presetTitle?: string;
  defaultPermissions?: Partial<
    Record<string, Partial<Omit<ResourcePermission, 'resource'>>>
  >;
  onSubmit?: (values: AddRoleValues) => Promise<void> | void;
  onApplyFilters?: ApplyFilters;
  submittingText?: string;
  submitText?: string;
};

const demoResources: string[] = [
  'task-reassign',
  'task-deadline-extension',
  'project',
  'project-activity',
  'task',
  'task-activity',
  'main-task',
  'task-reassign',
  'task-deadline-extension',
  'project',
  'project-activity',
  'task',
  'task-activity',
  'main-task',
];

export function AddRoleDialog({
  trigger,
  presetTitle,
  defaultPermissions,
  onSubmit,
  onApplyFilters,
  submittingText = 'Creating…',
  submitText = 'Create',
}: AddRoleDialogProps) {
  const [open, setOpen] = useState<boolean>(false);
  const [title, setTitle] = useState<string>(presetTitle ?? '');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [applying, setApplying] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState<string>('');

  const initialRows = useMemo<ResourcePermission[]>(
    () =>
      demoResources?.map((res) => {
        const overrides = defaultPermissions?.[res] ?? {};
        return {
          resource: res,
          canView: overrides.canView ?? true,
          canCreate: overrides.canCreate ?? false,
          canUpdate: overrides.canUpdate ?? false,
          canDelete: overrides.canDelete ?? false,
        } satisfies ResourcePermission;
      }),
    [defaultPermissions]
  );

  const [rows, setRows] = useState<ResourcePermission[]>(initialRows);

  function reset(): void {
    setTitle(presetTitle ?? '');
    setRows(initialRows);
    setQuery('');
    setError(null);
  }

  function handleOpenChange(next: boolean): void {
    if (!next) {
      reset();
    }
    setOpen(next);
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

  async function handleApplyFilters(): Promise<void> {
    try {
      setApplying(true);
      const trimmed = query.trim();
      if (onApplyFilters) {
        const res = await onApplyFilters({ q: trimmed || undefined });
        if (Array.isArray(res)) {
          setRows(res);
        }
      }
    } catch (e) {
      const err = e as Error;
      setError(err?.message ?? 'Failed to apply filters');
    } finally {
      setApplying(false);
    }
  }

  async function handleSubmit(): Promise<void> {
    try {
      setSubmitting(true);
      setError(null);
      const payload: AddRoleValues = {
        title: title.trim().toLowerCase(),
        permissions: rows,
      };
      await onSubmit?.(payload);
      reset();
      setOpen(false);
    } catch (e) {
      const err = e as Error;
      setError(err?.message ?? 'Failed to create role');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog onOpenChange={handleOpenChange} open={open}>
      <DialogTrigger asChild>
        {trigger ?? <Button>Add role</Button>}
      </DialogTrigger>
      <DialogContent className="w-[95vw] sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add role</DialogTitle>
          <DialogDescription>
            Set a role title and choose permissions per resource.
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
                  disabled={applying}
                  onClick={handleApplyFilters}
                  size="sm"
                  type="button"
                  variant="outline"
                >
                  {applying ? 'Applying…' : 'Apply'}
                </Button>
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
                  <table className="min-w-64 overflow-auto text-sm">
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
                          Row
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows?.map((r, i) => (
                        <tr className="border-t" key={`${r.resource}-${i}`}>
                          <td className="break-words px-3 py-2">
                            {r.resource}
                          </td>
                          <td className="px-3 py-2">
                            <div className="flex justify-center">
                              <Checkbox
                                aria-label={`canView ${r.resource}`}
                                checked={r.canView}
                                onCheckedChange={(v) =>
                                  toggleCell(i, 'canView', Boolean(v))
                                }
                              />
                            </div>
                          </td>
                          <td className="px-3 py-2">
                            <div className="flex justify-center">
                              <Checkbox
                                aria-label={`canCreate ${r.resource}`}
                                checked={r.canCreate}
                                onCheckedChange={(v) =>
                                  toggleCell(i, 'canCreate', Boolean(v))
                                }
                              />
                            </div>
                          </td>
                          <td className="px-3 py-2">
                            <div className="flex justify-center">
                              <Checkbox
                                aria-label={`canUpdate ${r.resource}`}
                                checked={r.canUpdate}
                                onCheckedChange={(v) =>
                                  toggleCell(i, 'canUpdate', Boolean(v))
                                }
                              />
                            </div>
                          </td>
                          <td className="px-3 py-2">
                            <div className="flex justify-center">
                              <Checkbox
                                aria-label={`canDelete ${r.resource}`}
                                checked={r.canDelete}
                                onCheckedChange={(v) =>
                                  toggleCell(i, 'canDelete', Boolean(v))
                                }
                              />
                            </div>
                          </td>
                          <td className="px-3 py-2">
                            <div className="flex justify-end gap-2">
                              <Button
                                onClick={() => clearAllFor(i)}
                                size="sm"
                                type="button"
                                variant="outline"
                              >
                                Clear
                              </Button>
                              <Button
                                onClick={() => selectAllFor(i)}
                                size="sm"
                                type="button"
                                variant="secondary"
                              >
                                All
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {rows.length === 0 ? (
                        <tr>
                          <td
                            className="px-3 py-6 text-center text-muted-foreground"
                            colSpan={6}
                          >
                            No matching resources
                          </td>
                        </tr>
                      ) : null}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>

          {error ? <p className="text-red-600 text-sm">{error}</p> : null}
        </div>

        <DialogFooter className="mt-2">
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
