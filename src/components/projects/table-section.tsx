'use client';
import { format } from 'date-fns';
import { ArrowDownSquare } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import api from '@/lib/api';
import { cn } from '@/lib/utils';
import type { projectListData } from '@/types/project';
import { encryptId } from '@/utils/aes-security-encryption';
import { AppTable, type CommonTableColumn } from '../app-table';
import Pagination from '../pagination';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';

const columns: CommonTableColumn<projectListData>[] = [
  {
    key: 'title',
    label: 'Title',
    width: '1000px',
    render(_, row) {
      return <Link href={`/projects/${encryptId(row.id)}`}>{row.title}</Link>;
    },
  },
  {
    key: 'owner',
    label: 'owner',
    render(_, row) {
      return <Link href={`/projects/${encryptId(row.id)}`}>{row.owner}</Link>;
    },
  },
  {
    key: 'createdAt',
    label: 'CreatedAt',
    render(_, row) {
      const formattedDate = row.createdAt
        ? format(new Date(row.createdAt), 'MMM dd, yyyy')
        : '';

      return (
        <Link href={`/projects/${encryptId(row.id)}`}>{formattedDate}</Link>
      );
    },
  },
];

const createLoadingData = (count: number): projectListData[] => {
  return Array.from({ length: count }, (_, index) => ({
    id: `loading-${index}`,
    title: '',
    createdAt: '',
    owner: '',
    description: '',
  }));
};

export default function TableSection({
  refreshTrigger,
}: {
  refreshTrigger: number;
}) {
  const [data, setData] = useState<projectListData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [total, setTotal] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(0);

  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();

  const currentKeyword = searchParams.get('keyword') || '';
  const currentSortBy = searchParams.get('sortBy') || 'createdAt';
  const currentOrder = searchParams.get('order') || 'asc';
  const currentPage = Number.parseInt(searchParams.get('page') || '1', 10);
  const currentLimit = Number.parseInt(searchParams.get('limit') || '10', 10);

  const updateURL = useCallback(
    (params: Record<string, string | number>) => {
      const newSearchParams = new URLSearchParams(searchParams.toString());

      for (const [key, value] of Object.entries(params)) {
        if (value === '' || value === null || value === undefined) {
          newSearchParams.delete(key);
        } else {
          newSearchParams.set(key, String(value));
        }
      }

      router.push(`${pathname}?${newSearchParams.toString()}`);
    },
    [searchParams, pathname, router]
  );

  const fetchProjects = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (currentKeyword) {
        params.append('keyword', currentKeyword);
      }
      if (currentSortBy) {
        params.append('sortBy', currentSortBy);
      }
      if (currentOrder) {
        params.append('order', currentOrder);
      }
      params.append('page', currentPage.toString());
      params.append('limit', currentLimit.toString());

      const response = await api.get(`api/project?${params.toString()}`);
      setData(response.data.data.data);
      setTotal(response.data.data.pagination.total);
      setTotalPages(response.data.data.pagination.totalPages);
    } catch (err) {
      toast.error(`Failed to fetch projects, ${err}`);
    } finally {
      setLoading(false);
    }
  }, [currentKeyword, currentSortBy, currentOrder, currentPage, currentLimit]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  useEffect(() => {
    if (refreshTrigger && refreshTrigger > 0) {
      fetchProjects();
    }
  }, [refreshTrigger, fetchProjects]);

  const displayData = loading ? createLoadingData(5) : data;

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const keyword = formData.get('q') as string;

    updateURL({
      keyword,
      page: 1,
    });
  };

  const handleSortChange = (sortBy: string) => {
    const newOrder =
      currentSortBy === sortBy && currentOrder === 'asc' ? 'desc' : 'asc';
    updateURL({
      sortBy,
      order: newOrder,
      page: 1,
    });
  };

  const handlePageChange = (page: number) => {
    updateURL({ page });
  };

  const handleLimitChange = (limit: string) => {
    updateURL({
      limit: Number.parseInt(limit, 10),
      page: 1,
    });
  };

  const toggleSortOrder = () => {
    const newOrder = currentOrder === 'asc' ? 'desc' : 'asc';
    updateURL({
      order: newOrder,
      page: 1,
    });
  };

  // navigator.geolocation.getCurrentPosition((position) => {
  //   console.log(position.coords.latitude);
  //   console.log(position.coords.longitude);
  // });

  return (
    <>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <form
          className="flex w-full items-stretch gap-2 sm:max-w-md"
          onSubmit={handleSearch}
        >
          <label className="sr-only" htmlFor="q">
            Search projects
          </label>
          <Input
            aria-label="Search projects"
            autoComplete="off"
            className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-primary"
            defaultValue={currentKeyword}
            disabled={loading}
            name="q"
            placeholder="Search by title or owner"
            type="search"
          />
          <button
            className="inline-flex items-center rounded-md bg-primary px-3 py-2 text-primary-foreground text-sm hover:opacity-90 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={loading}
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
          <Select
            disabled={loading}
            onValueChange={handleSortChange}
            value={currentSortBy}
          >
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="createdAt">Created at</SelectItem>
              <SelectItem value="title">Title</SelectItem>
              <SelectItem value="owner">Owner</SelectItem>
            </SelectContent>
          </Select>

          <Button
            disabled={loading}
            onClick={toggleSortOrder}
            size="sm"
            variant="outline"
          >
            <ArrowDownSquare
              className={cn(
                'h-4 w-4 transition-transform duration-200',
                currentOrder === 'desc' && 'rotate-180'
              )}
            />
          </Button>

          {/* Items per page selector */}
          <Select
            disabled={loading}
            onValueChange={handleLimitChange}
            value={currentLimit.toString()}
          >
            <SelectTrigger className="w-20">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="5">5</SelectItem>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="20">20</SelectItem>
              <SelectItem value="50">50</SelectItem>
              <SelectItem value="100">100</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Results info */}
      {!loading && (
        <div className="flex items-center justify-between text-muted-foreground text-sm">
          <span>
            {currentKeyword ? (
              <>
                Found {total} result{total !== 1 ? 's' : ''} for "
                {currentKeyword}"
              </>
            ) : (
              <>
                Showing {data.length} of {total} project{total !== 1 ? 's' : ''}
              </>
            )}
          </span>
          <span>
            Page {currentPage} of {totalPages}
          </span>
        </div>
      )}

      <div className="rounded-md border">
        <AppTable columns={columns} data={displayData} />
      </div>

      {/* Pagination */}
      {!loading && totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          onPageChange={handlePageChange}
          totalPages={totalPages}
        />
      )}
    </>
  );
}
