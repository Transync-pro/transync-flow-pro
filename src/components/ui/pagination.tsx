
import React from "react";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
}

export const Pagination = ({ currentPage, totalPages, onPageChange, className }: PaginationProps) => {
  // Generate page numbers to display
  const getPageNumbers = () => {
    const pageNumbers = [];
    const maxPagesToShow = 5;
    
    if (totalPages <= maxPagesToShow) {
      // If we have fewer pages than max to show, display all of them
      for (let i = 0; i < totalPages; i++) {
        pageNumbers.push(i);
      }
    } else {
      // Always include first page
      pageNumbers.push(0);
      
      // Calculate start and end for the middle section
      let start = Math.max(currentPage - 1, 1);
      let end = Math.min(currentPage + 1, totalPages - 2);
      
      // Adjust if we're near the beginning or end
      if (currentPage <= 1) {
        end = 3;
      } else if (currentPage >= totalPages - 2) {
        start = totalPages - 4;
      }
      
      // Add ellipsis after first page if needed
      if (start > 1) {
        pageNumbers.push('ellipsis1');
      }
      
      // Add middle pages
      for (let i = start; i <= end; i++) {
        pageNumbers.push(i);
      }
      
      // Add ellipsis before last page if needed
      if (end < totalPages - 2) {
        pageNumbers.push('ellipsis2');
      }
      
      // Always include last page
      pageNumbers.push(totalPages - 1);
    }
    
    return pageNumbers;
  };

  const pageNumbers = getPageNumbers();
  
  return (
    <div className={cn("flex items-center justify-center space-x-2", className)}>
      <Button
        variant="outline"
        size="icon"
        onClick={() => onPageChange(0)}
        disabled={currentPage === 0}
        aria-label="First page"
      >
        <ChevronsLeft className="h-4 w-4" />
      </Button>
      <Button
        variant="outline"
        size="icon"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 0}
        aria-label="Previous page"
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>
      
      <div className="flex items-center space-x-1">
        {pageNumbers.map((pageNumber, index) => {
          if (pageNumber === 'ellipsis1' || pageNumber === 'ellipsis2') {
            return (
              <span key={`ellipsis-${pageNumber}`} className="px-2">
                ...
              </span>
            );
          }
          
          return (
            <Button
              key={`page-${pageNumber}`}
              variant={currentPage === pageNumber ? "default" : "outline"}
              size="sm"
              onClick={() => onPageChange(pageNumber as number)}
              aria-label={`Page ${(pageNumber as number) + 1}`}
              aria-current={currentPage === pageNumber ? "page" : undefined}
            >
              {(pageNumber as number) + 1}
            </Button>
          );
        })}
      </div>
      
      <Button
        variant="outline"
        size="icon"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages - 1 || totalPages === 0}
        aria-label="Next page"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
      <Button
        variant="outline"
        size="icon"
        onClick={() => onPageChange(totalPages - 1)}
        disabled={currentPage === totalPages - 1 || totalPages === 0}
        aria-label="Last page"
      >
        <ChevronsRight className="h-4 w-4" />
      </Button>
    </div>
  );
};
