
import { useState, useEffect } from 'react';

export const usePagination = (records: any[]) => {
  const [pageSize, setPageSize] = useState(10);
  const [pageIndex, setPageIndex] = useState(0);
  
  // Calculate pagination
  const totalPages = Math.ceil(records.length / pageSize);
  const paginatedRecords = records.slice(pageIndex * pageSize, (pageIndex + 1) * pageSize);
  
  // Reset to first page when records change
  useEffect(() => {
    setPageIndex(0);
  }, [records.length]);
  
  return {
    pageSize,
    setPageSize,
    pageIndex,
    setPageIndex,
    totalPages,
    paginatedRecords
  };
};
