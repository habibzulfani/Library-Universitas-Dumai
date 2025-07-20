import React from 'react';

interface PaginationProps {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
    className?: string;
}

const Pagination: React.FC<PaginationProps> = ({ currentPage, totalPages, onPageChange, className = '' }) => {
    if (totalPages <= 1) return null;

    // Helper to generate page numbers (show up to 5 pages, with ... if needed)
    const getPageNumbers = () => {
        const pages = [];
        if (totalPages <= 5) {
            for (let i = 1; i <= totalPages; i++) pages.push(i);
        } else {
            if (currentPage <= 3) {
                pages.push(1, 2, 3, 4, '...', totalPages);
            } else if (currentPage >= totalPages - 2) {
                pages.push(1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
            } else {
                pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
            }
        }
        return pages;
    };

    return (
        <nav className={`flex items-center justify-center space-x-1 mt-6 ${className}`} aria-label="Pagination">
            <button
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-3 py-1 rounded bg-gray-200 disabled:opacity-50"
            >
                Previous
            </button>
            {getPageNumbers().map((page, idx) =>
                typeof page === 'number' ? (
                    <button
                        key={page}
                        onClick={() => onPageChange(page)}
                        className={`px-3 py-1 rounded ${page === currentPage ? 'bg-[#38b36c] text-white font-bold' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                        aria-current={page === currentPage ? 'page' : undefined}
                    >
                        {page}
                    </button>
                ) : (
                    <span key={idx} className="px-2 py-1 text-gray-400 select-none">...</span>
                )
            )}
            <button
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="px-3 py-1 rounded bg-gray-200 disabled:opacity-50"
            >
                Next
            </button>
        </nav>
    );
};

export default Pagination; 