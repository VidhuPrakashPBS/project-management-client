'use client';
import { ArrowDownSquare } from 'lucide-react';
import Link from 'next/link';
import { AppTable, type CommonTableColumn } from '../app-table';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Select } from '../ui/select';

interface DataRow {
  id: number;
  title: string;
  description: string;
  status: 'on-hold' | 'in-progress' | 'completed' | 'cancelled';
  project: string;
  noOfTasks: number;
  createdAt: string;
  owner: string;
}

const columns: CommonTableColumn<DataRow>[] = [
  {
    key: 'id',
    label: 'ID',
    width: '50px',
    render(_value, row, rowIndex) {
      return <Link href={`/task-category/${row.id}`}>{rowIndex + 1}</Link>;
    },
  },
  {
    key: 'title',
    label: 'Title',
    render(value, row) {
      return <Link href={`/task-category/${row.id}`}>{value}</Link>;
    },
  },
  {
    key: 'description',
    label: 'Description',
    render(value, row) {
      return <Link href={`/task-category/${row.id}`}>{value}</Link>;
    },
  },
  {
    key: 'status',
    label: 'Status',
    render(value, row) {
      return <Link href={`/task-category/${row.id}`}>{value}</Link>;
    },
  },
  {
    key: 'project',
    label: 'Project',
    render(value, row) {
      return <Link href={`/task-category/${row.id}`}>{value}</Link>;
    },
  },
  {
    key: 'noOfTasks',
    label: 'NoOfTasks',
    render(value, row) {
      return <Link href={`/task-category/${row.id}`}>{value}</Link>;
    },
  },
  {
    key: 'createdAt',
    label: 'CreatedAt',
    render(value, row) {
      return <Link href={`/task-category/${row.id}`}>{value}</Link>;
    },
  },
  {
    key: 'owner',
    label: 'Owner',
    render(value, row) {
      return <Link href={`/task-category/${row.id}`}>{value}</Link>;
    },
  },
];

const data: DataRow[] = [
  {
    id: 101,
    title: 'LOI Paperwork',
    description: 'Prepare Letter of Intent docs for Mukkam Metals',
    status: 'in-progress',
    project: 'Mukkam Metals',
    noOfTasks: 7,
    createdAt: '2025-08-10T10:15:00Z',
    owner: 'Saleem',
  },
  {
    id: 102,
    title: 'Vendor Onboarding',
    description: 'Create vendor profile and upload compliance documents',
    status: 'on-hold',
    project: 'Supply Ops',
    noOfTasks: 5,
    createdAt: '2025-08-05T09:00:00Z',
    owner: 'Aisha',
  },
  {
    id: 103,
    title: 'Contract Finalization',
    description: 'Negotiate terms and finalize contract deliverables',
    status: 'in-progress',
    project: 'Acme Contract',
    noOfTasks: 9,
    createdAt: '2025-07-28T14:30:00Z',
    owner: 'Rahul',
  },
  {
    id: 104,
    title: 'Internal Review',
    description: 'Run internal compliance and security review',
    status: 'completed',
    project: 'Compliance',
    noOfTasks: 4,
    createdAt: '2025-07-20T08:45:00Z',
    owner: 'Priya',
  },
  {
    id: 105,
    title: 'PO Cancellation',
    description: 'Audit and cancel stale purchase orders',
    status: 'cancelled',
    project: 'Finance Ops',
    noOfTasks: 3,
    createdAt: '2025-08-18T12:05:00Z',
    owner: 'Manoj',
  },
  {
    id: 106,
    title: 'RFP Draft',
    description: 'Draft RFP for sheet metal suppliers',
    status: 'in-progress',
    project: 'Sourcing',
    noOfTasks: 6,
    createdAt: '2025-08-14T16:20:00Z',
    owner: 'Neha',
  },
  {
    id: 107,
    title: 'QA Checklist',
    description: 'Define QA checks for incoming materials',
    status: 'on-hold',
    project: 'Quality',
    noOfTasks: 8,
    createdAt: '2025-07-31T11:10:00Z',
    owner: 'Arun',
  },
  {
    id: 108,
    title: 'Docs Consolidation',
    description: 'Consolidate all project docs and rename',
    status: 'completed',
    project: 'Documentation',
    noOfTasks: 2,
    createdAt: '2025-06-22T07:55:00Z',
    owner: 'Fatima',
  },
];

export default function TableSection() {
  return (
    <section className="space-y-4">
      <h1 className="font-bold text-2xl">Task Category</h1>
      <p className="text-muted-foreground">Manage your task categories</p>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <form
          className="flex w-full items-stretch gap-2 sm:max-w-md"
          onSubmit={(e) => e.preventDefault()}
        >
          <label className="sr-only" htmlFor="q">
            Search task category
          </label>
          <Input
            aria-label="Search projects"
            autoComplete="off"
            className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-primary"
            name="q"
            placeholder="Search by title or owner"
            type="search"
          />
          <button
            className="inline-flex items-center rounded-md bg-primary px-3 py-2 text-primary-foreground text-sm hover:opacity-90 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            type="submit"
          >
            Search
          </button>
        </form>

        {/* Sort controls */}
        <div className="flex items-center gap-2">
          <label className="text-muted-foreground text-sm" htmlFor="sort-by">
            Sort by
          </label>
          <Select aria-label="Sort by">
            <option value="createdAt">Created at</option>
            <option value="title">Title</option>
            <option value="owner">Project</option>
          </Select>

          <Button variant={'default'}>
            <ArrowDownSquare />
          </Button>
        </div>
      </div>
      <div className="rounded-md border">
        <AppTable columns={columns} data={data} />
      </div>
    </section>
  );
}
