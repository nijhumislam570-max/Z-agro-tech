import { useState, useCallback, useMemo } from 'react';

interface UsePaginationOptions<T> {
  /** Initial page number (default: 1) */
  initialPage?: number;
  /** Items per page (default: 10) */
  pageSize?: number;
  /** Total number of items (for server-side pagination) */
  totalItems?: number;
  /** Data array (for client-side pagination) */
  data?: T[];
}

interface UsePaginationReturn<T> {
  /** Current page number (1-indexed) */
  currentPage: number;
  /** Total number of pages */
  totalPages: number;
  /** Items per page */
  pageSize: number;
  /** Whether there's a previous page */
  hasPreviousPage: boolean;
  /** Whether there's a next page */
  hasNextPage: boolean;
  /** Go to a specific page */
  goToPage: (page: number) => void;
  /** Go to the next page */
  nextPage: () => void;
  /** Go to the previous page */
  previousPage: () => void;
  /** Go to the first page */
  firstPage: () => void;
  /** Go to the last page */
  lastPage: () => void;
  /** Change the page size */
  setPageSize: (size: number) => void;
  /** Paginated data (for client-side pagination) */
  paginatedData: T[];
  /** Start index (0-indexed) for current page */
  startIndex: number;
  /** End index (0-indexed) for current page */
  endIndex: number;
  /** Page numbers for pagination UI */
  pageNumbers: number[];
}

/**
 * Comprehensive pagination hook for both client-side and server-side pagination.
 * 
 * @param options - Pagination configuration
 * @returns Pagination state and controls
 * 
 * @example Client-side pagination:
 * ```tsx
 * const { paginatedData, currentPage, totalPages, nextPage, previousPage } = usePagination({
 *   data: products,
 *   pageSize: 12,
 * });
 * 
 * return (
 *   <>
 *     {paginatedData.map(product => <ProductCard key={product.id} {...product} />)}
 *     <button onClick={previousPage} disabled={currentPage === 1}>Previous</button>
 *     <span>Page {currentPage} of {totalPages}</span>
 *     <button onClick={nextPage} disabled={currentPage === totalPages}>Next</button>
 *   </>
 * );
 * ```
 * 
 * @example Server-side pagination:
 * ```tsx
 * const { currentPage, pageSize, goToPage } = usePagination({
 *   totalItems: totalCount,
 *   pageSize: 20,
 * });
 * 
 * useEffect(() => {
 *   fetchData({ page: currentPage, limit: pageSize });
 * }, [currentPage, pageSize]);
 * ```
 */
export function usePagination<T = unknown>(
  options: UsePaginationOptions<T> = {}
): UsePaginationReturn<T> {
  const {
    initialPage = 1,
    pageSize: initialPageSize = 10,
    totalItems,
    data = [],
  } = options;

  const [currentPage, setCurrentPage] = useState(initialPage);
  const [pageSize, setPageSizeState] = useState(initialPageSize);

  // Calculate total pages
  const totalPages = useMemo(() => {
    if (totalItems !== undefined) {
      return Math.max(1, Math.ceil(totalItems / pageSize));
    }
    return Math.max(1, Math.ceil(data.length / pageSize));
  }, [totalItems, data.length, pageSize]);

  // Navigation state
  const hasPreviousPage = currentPage > 1;
  const hasNextPage = currentPage < totalPages;

  // Calculate indices
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize - 1, (totalItems ?? data.length) - 1);

  // Paginated data for client-side
  const paginatedData = useMemo(() => {
    return data.slice(startIndex, startIndex + pageSize);
  }, [data, startIndex, pageSize]);

  // Generate page numbers for UI (showing max 7 pages with ellipsis logic)
  const pageNumbers = useMemo(() => {
    const maxVisible = 7;
    const pages: number[] = [];

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Always show first page
      pages.push(1);

      if (currentPage > 3) {
        pages.push(-1); // Ellipsis marker
      }

      // Pages around current
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);

      for (let i = start; i <= end; i++) {
        if (!pages.includes(i)) {
          pages.push(i);
        }
      }

      if (currentPage < totalPages - 2) {
        pages.push(-2); // Ellipsis marker
      }

      // Always show last page
      if (!pages.includes(totalPages)) {
        pages.push(totalPages);
      }
    }

    return pages;
  }, [currentPage, totalPages]);

  // Navigation functions
  const goToPage = useCallback((page: number) => {
    const validPage = Math.max(1, Math.min(page, totalPages));
    setCurrentPage(validPage);
  }, [totalPages]);

  const nextPage = useCallback(() => {
    if (hasNextPage) {
      setCurrentPage((prev) => prev + 1);
    }
  }, [hasNextPage]);

  const previousPage = useCallback(() => {
    if (hasPreviousPage) {
      setCurrentPage((prev) => prev - 1);
    }
  }, [hasPreviousPage]);

  const firstPage = useCallback(() => {
    setCurrentPage(1);
  }, []);

  const lastPage = useCallback(() => {
    setCurrentPage(totalPages);
  }, [totalPages]);

  const setPageSize = useCallback((size: number) => {
    setPageSizeState(size);
    setCurrentPage(1); // Reset to first page when page size changes
  }, []);

  return {
    currentPage,
    totalPages,
    pageSize,
    hasPreviousPage,
    hasNextPage,
    goToPage,
    nextPage,
    previousPage,
    firstPage,
    lastPage,
    setPageSize,
    paginatedData,
    startIndex,
    endIndex,
    pageNumbers,
  };
}

export default usePagination;
