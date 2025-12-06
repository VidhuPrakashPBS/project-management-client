import { Skeleton } from './ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './ui/table';

export interface CommonTableColumn<T> {
  key: string;
  label: string;
  width?: string;
  headClassName?: string;
  className?: string;
  render?: (value: T[keyof T], row: T, rowIndex: number) => React.ReactNode;
}

export interface CommonTableProps<T> {
  columns: CommonTableColumn<T>[];
  data: T[];
  loading?: boolean;
  loadingRows?: number;
  emptyMessage?: string;
  currentPage?: number;
  itemsPerPage?: number;
  onRowClick?: (row: T, index?: number) => void;
  getRowClassName?: (row: T, index: number) => string;
}

export function AppTable<T extends { id?: React.Key }>({
  columns = [],
  data = [],
  loading = false,
  loadingRows = 5,
  emptyMessage = 'No items found',
  onRowClick,
  getRowClassName,
}: CommonTableProps<T>) {
  const renderTableBody = () => {
    if (loading) {
      return Array.from({ length: loadingRows })?.map((_, i) => (
        <TableRow key={i as React.Key}>
          {columns?.map((_col, colIndex) => (
            <TableCell key={colIndex as React.Key}>
              <Skeleton className="h-4 w-full" />
            </TableCell>
          ))}
        </TableRow>
      ));
    }

    if (data.length > 0) {
      return data?.map((row, idx) => {
        let rowClassName = '';
        if (getRowClassName) {
          rowClassName = getRowClassName(row, idx);
        } else if (onRowClick) {
          rowClassName = 'cursor-pointer hover:bg-muted/50';
        }

        return (
          <TableRow
            className={rowClassName}
            key={row.id || idx}
            onClick={() => {
              onRowClick?.(row, idx);
            }}
          >
            {columns?.map((col) => (
              <TableCell className={col.className} key={col.key as string}>
                {col.render
                  ? col.render(row[col.key as keyof typeof row], row, idx)
                  : String(row[col.key as keyof typeof row])}
              </TableCell>
            ))}
          </TableRow>
        );
      });
    }

    return (
      <TableRow>
        <TableCell className="py-12 text-center" colSpan={columns.length}>
          <div>
            <p className="font-semibold text-lg">{emptyMessage}</p>
            <p className="text-sm">Add a new item to get started.</p>
          </div>
        </TableCell>
      </TableRow>
    );
  };

  return (
    <div className="overflow-auto rounded-lg border">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              {columns?.map((col) => (
                <TableHead
                  className={`font-semibold ${col.headClassName || ''}`}
                  key={col.key as string}
                  style={col.width ? { width: col.width } : {}}
                >
                  {col.label}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>{renderTableBody()}</TableBody>
        </Table>
      </div>
    </div>
  );
}
