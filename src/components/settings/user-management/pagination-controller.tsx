import { Button } from '@/components/ui/button';
import type { PaginationControlsProps } from '@/types/user';

export const PaginationControls = ({
  currentPage,
  pageSize,
  totalUsers,
  totalPages,
  onPageChange,
  onPageSizeChange,
}: PaginationControlsProps) => {
  const handlePreviousPage = () => {
    if (currentPage > 0) {
      onPageChange(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages - 1) {
      onPageChange(currentPage + 1);
    }
  };

  const handlePageSizeChange = (newPageSize: number) => {
    onPageSizeChange(newPageSize);
  };

  const startIndex = currentPage * pageSize + 1;
  const endIndex = Math.min((currentPage + 1) * pageSize, totalUsers);

  return (
    <div className="flex items-center justify-between px-2 py-4">
      <div className="flex items-center space-x-2">
        <span className="text-muted-foreground text-sm">Rows per page:</span>
        <select
          className="rounded border px-2 py-1 text-sm"
          onChange={(e) => handlePageSizeChange(Number(e.target.value))}
          value={pageSize}
        >
          <option value={5}>5</option>
          <option value={10}>10</option>
          <option value={25}>25</option>
          <option value={50}>50</option>
        </select>
      </div>

      <div className="flex items-center space-x-2">
        <span className="text-muted-foreground text-sm">
          {totalUsers > 0
            ? `${startIndex}-${endIndex} of ${totalUsers}`
            : '0 of 0'}
        </span>

        <div className="flex space-x-1">
          <Button
            disabled={currentPage === 0}
            onClick={handlePreviousPage}
            size="sm"
            variant="outline"
          >
            Previous
          </Button>
          <Button
            disabled={currentPage >= totalPages - 1}
            onClick={handleNextPage}
            size="sm"
            variant="outline"
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PaginationControls;
