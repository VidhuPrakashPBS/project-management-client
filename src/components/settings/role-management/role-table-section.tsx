'use client';

import { Plus, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { AppTable, type CommonTableColumn } from '@/components/app-table';
import ConfirmDialog from '@/components/confirm-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AddRoleDialog } from './add-role-dialog';
import { EditRoleDialog } from './edit-role-dialog';

interface DataRow {
  id: string;
  title: string;
  createdAt: string;
}

export default function RoleTableSection() {
  const [query, setQuery] = useState('');
  const [rows, setRows] = useState<DataRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState<boolean>(false);
  const [deleteId, setDeleteId] = useState<string>('');
  const [editOpen, setEditOpen] = useState<boolean>(false);
  const [editing, setEditing] = useState<DataRow | null>(null);

  useEffect(() => {
    setLoading(true);
    const demo: DataRow[] = [
      { id: '1', title: 'admin', createdAt: new Date().toISOString() },
      {
        id: '2',
        title: 'owner',
        createdAt: new Date(Date.now() - 86_400_000).toISOString(),
      },
      {
        id: '3',
        title: 'manager',
        createdAt: new Date(Date.now() - 2 * 86_400_000).toISOString(),
      },
    ];
    const t = setTimeout(() => {
      setRows(demo);
      setLoading(false);
    }, 400);
    return () => clearTimeout(t);
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) {
      return rows;
    }
    return rows.filter((r) => r.title.toLowerCase().includes(q));
  }, [rows, query]);

  const columns: CommonTableColumn<DataRow>[] = [
    {
      key: 'title',
      label: 'Role',
      render: (_value, row) => (
        <Link
          className="capitalize"
          href="#"
          onClick={() => {
            setEditing(row);
            setEditOpen(true);
          }}
          tabIndex={0}
        >
          {row.title}
        </Link>
      ),
    },
    {
      key: 'createdAt',
      label: 'Created',
      render: (_value, row) =>
        new Date(row.createdAt).toLocaleDateString(undefined, {
          year: 'numeric',
          month: 'short',
          day: '2-digit',
        }),
    },
    {
      key: 'actions',
      label: '',
      render: (_value, row) => (
        <div className="flex items-center justify-end gap-1.5">
          <Button
            onClick={() => {
              setDeleteId(row.id);
              setConfirmOpen(true);
            }}
            size="sm"
            variant="ghost"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  function handleConfirmDelete() {
    setRows((prev) => prev.filter((r) => r.id !== deleteId));
    setConfirmOpen(false);
    setDeleteId('');
  }

  function handleEditSubmit(values: { title: string }) {
    setRows((prev) =>
      prev?.map((r) =>
        r.id === editing?.id ? { ...r, title: values.title } : r
      )
    );
    setEditOpen(false);
    setEditing(null);
  }

  const handleAddRole = () => {
    setEditing(null);
    setEditOpen(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <form
          className="flex w-full items-stretch gap-2 sm:max-w-md"
          onSubmit={(e) => e.preventDefault()}
        >
          <label className="sr-only" htmlFor="q">
            Search roles
          </label>
          <Input
            aria-label="Search roles"
            autoComplete="off"
            className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-primary"
            name="q"
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by role name"
            type="search"
            value={query}
          />
          <button
            className="inline-flex items-center rounded-md bg-primary px-3 py-2 text-primary-foreground text-sm hover:opacity-90 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            type="submit"
          >
            Search
          </button>
        </form>
        <div className="flex items-center gap-2">
          <AddRoleDialog
            onSubmit={handleAddRole}
            trigger={
              <Button variant="default">
                <Plus className="mr-2 h-4 w-4" />
                Add role
              </Button>
            }
          />
        </div>
      </div>

      <AppTable<DataRow>
        columns={columns}
        data={filtered}
        emptyMessage={query ? 'No roles match the search.' : 'No roles yet.'}
        loading={loading}
      />

      <EditRoleDialog
        onOpenChange={setEditOpen}
        onSubmit={handleEditSubmit}
        open={editOpen}
      />

      <ConfirmDialog
        cancelText="No"
        confirmText="Yes"
        description={`This action cannot be undone. Delete role ${deleteId}?`}
        icon={<Trash2 className="h-6 w-6 text-destructive" />}
        mode="confirm"
        onCancel={() => setConfirmOpen(false)}
        onConfirm={handleConfirmDelete}
        onOpenChange={setConfirmOpen}
        open={confirmOpen}
        title="Delete role?"
      />
    </div>
  );
}
