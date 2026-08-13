import React from "react";

const PaginationControls = ({ currentPage, totalPages, onPageChange }) => {
  if (totalPages <= 1) return null;

  const goToPage = (page) => {
    if (page >= 1 && page <= totalPages) {
      onPageChange(page);
    }
  };

  return (
    <div className="flex items-center justify-center gap-4 mt-8">
      <button
        disabled={currentPage === 1}
        onClick={() => goToPage(currentPage - 1)}
        className="px-5 py-2.5 rounded-full border border-[var(--color-border-light)] bg-[var(--color-surface)] text-sm font-semibold text-text-primary hover:border-accent-purple/50 transition-colors duration-300 disabled:opacity-40 disabled:hover:border-[var(--color-border-light)]"
      >
        Anterior
      </button>

      <span className="font-mono text-xs text-text-secondary">
        Página {currentPage} de {totalPages}
      </span>

      <button
        disabled={currentPage === totalPages}
        onClick={() => goToPage(currentPage + 1)}
        className="px-5 py-2.5 rounded-full border border-[var(--color-border-light)] bg-[var(--color-surface)] text-sm font-semibold text-text-primary hover:border-accent-purple/50 transition-colors duration-300 disabled:opacity-40 disabled:hover:border-[var(--color-border-light)]"
      >
        Próximo
      </button>
    </div>
  );
};

export default PaginationControls;