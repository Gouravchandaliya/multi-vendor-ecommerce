import React from 'react';

const Pagination = ({ currentPage = 1, totalPages = 1, onPageChange }) => {
  if (totalPages <= 1) return null;

  const generatePageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;

    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);

      let start = Math.max(2, currentPage - 1);
      let end   = Math.min(totalPages - 1, currentPage + 1);

      if (currentPage <= 3) {
        start = 2;
        end   = 4;
      } else if (currentPage >= totalPages - 2) {
        start = totalPages - 3;
        end   = totalPages - 1;
      }

      if (start > 2) pages.push('...');
      for (let i = start; i <= end; i++) pages.push(i);
      if (end < totalPages - 1) pages.push('...');

      pages.push(totalPages);
    }

    return pages;
  };

  const pages = generatePageNumbers();

  return (
    <nav className="flex items-center justify-center gap-1 sm:gap-2 pt-6 select-none" aria-label="Pagination Navigation">
      {/* Previous Button */}
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="px-3 py-2 rounded-xl border border-gray-200 text-xs font-bold text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-40 disabled:hover:bg-white transition flex items-center gap-1 shadow-sm"
      >
        <span>←</span>
        <span className="hidden sm:inline">Previous</span>
      </button>

      {/* Page Numbers */}
      <div className="flex items-center gap-1">
        {pages.map((p, idx) => {
          if (p === '...') {
            return (
              <span key={`ellipsis-${idx}`} className="px-2 py-1 text-xs text-gray-400 font-bold">
                …
              </span>
            );
          }

          const isCurrent = p === currentPage;

          return (
            <button
              key={p}
              onClick={() => onPageChange(p)}
              className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl text-xs font-bold transition flex items-center justify-center ${
                isCurrent
                  ? 'bg-blue-600 text-white shadow-sm ring-2 ring-blue-600/30'
                  : 'bg-white text-gray-700 border border-gray-200 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200'
              }`}
            >
              {p}
            </button>
          );
        })}
      </div>

      {/* Next Button */}
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="px-3 py-2 rounded-xl border border-gray-200 text-xs font-bold text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-40 disabled:hover:bg-white transition flex items-center gap-1 shadow-sm"
      >
        <span className="hidden sm:inline">Next</span>
        <span>→</span>
      </button>
    </nav>
  );
};

export default Pagination;
