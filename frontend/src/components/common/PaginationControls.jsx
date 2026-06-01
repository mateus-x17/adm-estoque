import React from "react";

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

return (
    <div className="flex items-center justify-center gap-3">
        <button
            disabled={currentPage === 1}
            onClick={() => goToPage(currentPage - 1)}
            className="px-4 py-2 rounded-xl text-sm bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white disabled:opacity-40"
        >
            Anterior
        </button>

        <span className="text-sm text-slate-600 dark:text-slate-400">
            Página {currentPage} de {totalPages}
        </span>

        <button
            disabled={currentPage === totalPages}
            onClick={() => goToPage(currentPage + 1)}
            className="px-4 py-2 rounded-xl text-sm bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white disabled:opacity-40"
        >
            Próximo
        </button>
    </div>
);
};

export default PaginationControls;
