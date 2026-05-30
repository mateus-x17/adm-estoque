import React from "react";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";

/**
 * Reusable pagination controls component
 * Can be used across different pages (Pedidos, Movimentacoes, etc.)
 */
const PaginationControls = ({ currentPage, totalPages, onPageChange }) => {
    if (totalPages <= 1) return null;

    const goToPage = (page) => {
        if (page >= 1 && page <= totalPages) {
            onPageChange(page);
        }
    };

    // Calculate page window (show up to 5 pages)
    const getPageNumbers = () => {
        const pages = [];
        const maxPagesToShow = 5;

        if (totalPages <= maxPagesToShow) {
            // Show all pages if total is less than max
            for (let i = 1; i <= totalPages; i++) {
                pages.push(i);
            }
        } else {
            // Show window around current page
            let start = Math.max(1, currentPage - 2);
            let end = Math.min(totalPages, start + maxPagesToShow - 1);

            // Adjust start if we're near the end
            if (end === totalPages) {
                start = Math.max(1, end - maxPagesToShow + 1);
            }

            for (let i = start; i <= end; i++) {
                pages.push(i);
            }
        }

        return pages;
    };

    const pageNumbers = getPageNumbers();

    return (
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <button
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage === 1}
                className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-slate-600 dark:text-slate-400"
            >
                <FiChevronLeft size={20} />
            </button>

            <div className="flex gap-2">
                {pageNumbers.map((pageNum) => (
                    <button
                        key={pageNum}
                        onClick={() => goToPage(pageNum)}
                        className={`w-8 h-8 rounded-lg text-sm font-bold transition-all ${currentPage === pageNum
                                ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/30"
                                : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                            }`}
                    >
                        {pageNum}
                    </button>
                ))}
            </div>

            <button
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-slate-600 dark:text-slate-400"
            >
                <FiChevronRight size={20} />
            </button>
        </div>
    );
};

export default PaginationControls;
