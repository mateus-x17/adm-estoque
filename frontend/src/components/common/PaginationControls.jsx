import React from "react";

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
        className="px-4 py-2 rounded-md border border-[var(--line)] text-sm text-[var(--ink)] hover:border-[var(--accent)] transition-colors duration-200 disabled:opacity-40 disabled:hover:border-[var(--line)]"
      >
        Anterior
      </button>

      <span className="font-mono text-xs text-[var(--ink-soft)]">
        Página {currentPage} de {totalPages}
      </span>

      <button
        disabled={currentPage === totalPages}
        onClick={() => goToPage(currentPage + 1)}
        className="px-4 py-2 rounded-md border border-[var(--line)] text-sm text-[var(--ink)] hover:border-[var(--accent)] transition-colors duration-200 disabled:opacity-40 disabled:hover:border-[var(--line)]"
      >
        Próximo
      </button>
    </div>
  );
};

export default PaginationControls;