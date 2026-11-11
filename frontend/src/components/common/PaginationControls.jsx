import React from "react";

// arquivo responsável pelos controles reutilizáveis de paginação das listagens do Estoque.OS em React.

// função responsável por renderizar os botões de navegação entre páginas de tabelas e cards.
//
// 1 - recebe currentPage (number), totalPages (number) e onPageChange (function).
// 2 - oculta a barra quando totalPages for menor ou igual a 1 e valida os limites na troca de página.
// 3 - retorna o bloco centralizado de paginação ou null.
const PaginationControls = ({ currentPage, totalPages, onPageChange }) => {
  if (totalPages <= 1) return null;

  const goToPage = (page) => {
    if (page >= 1 && page <= totalPages) {
      onPageChange(page);
    }
  };

  return (
    <div className="flex items-center justify-center gap-3 mt-5">
      <button
        disabled={currentPage === 1}
        onClick={() => goToPage(currentPage - 1)}
        className="px-4 py-2 rounded-full border border-[var(--color-border-light)] bg-[var(--color-surface)] text-xs sm:text-sm font-semibold text-text-primary hover:border-accent-purple/50 transition-colors duration-300 disabled:opacity-40 disabled:hover:border-[var(--color-border-light)]"
      >
        Anterior
      </button>

      <span className="font-mono text-xs text-text-secondary">
        Página {currentPage} de {totalPages}
      </span>

      <button
        disabled={currentPage === totalPages}
        onClick={() => goToPage(currentPage + 1)}
        className="px-4 py-2 rounded-full border border-[var(--color-border-light)] bg-[var(--color-surface)] text-xs sm:text-sm font-semibold text-text-primary hover:border-accent-purple/50 transition-colors duration-300 disabled:opacity-40 disabled:hover:border-[var(--color-border-light)]"
      >
        Próximo
      </button>
    </div>
  );
};

export default PaginationControls;