const ModalMovimentacao = ({ isOpen, onClose, movimentacao }) => {
  if (!isOpen || !movimentacao) return null;

  const isEntrada = movimentacao.tipo === "ENTRADA";
  const badgeClass = isEntrada
    ? "border-[var(--teal)]/30 text-[var(--teal)]"
    : "border-[var(--accent)]/30 text-[var(--accent)]";

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center px-4">
      <div className="w-full max-w-lg bg-[var(--bg-elevated)] border border-[var(--line)] rounded-lg p-6 space-y-5 shadow-xl animate-scale-in">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold text-[var(--ink)]">
            Detalhes da movimentação
          </h2>
          <button
            onClick={onClose}
            className="text-[var(--ink-soft)] hover:text-[var(--ink)] transition-colors duration-200"
          >
            ✕
          </button>
        </div>

        <span className={`inline-block px-3 py-1 rounded-md border font-mono text-xs uppercase ${badgeClass}`}>
          {movimentacao.tipo}
        </span>

        <div className="space-y-3 text-sm">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-wide text-[var(--ink-soft)]">
              ID do pedido
            </p>
            <p className="font-medium text-[var(--ink)] mt-0.5">#{movimentacao.id}</p>
          </div>

          <div>
            <p className="font-mono text-[11px] uppercase tracking-wide text-[var(--ink-soft)]">
              Produto
            </p>
            <p className="font-medium text-[var(--ink)] mt-0.5">{movimentacao.produto.nome}</p>
          </div>

          <div>
            <p className="font-mono text-[11px] uppercase tracking-wide text-[var(--ink-soft)]">
              Quantidade
            </p>
            <p className="font-medium text-[var(--ink)] mt-0.5">{movimentacao.quantidade}</p>
          </div>

          <div>
            <p className="font-mono text-[11px] uppercase tracking-wide text-[var(--ink-soft)]">
              Usuário
            </p>
            <p className="font-medium text-[var(--ink)] mt-0.5">{movimentacao.usuario?.nome}</p>
          </div>

          <div>
            <p className="font-mono text-[11px] uppercase tracking-wide text-[var(--ink-soft)]">
              Data
            </p>
            <p className="font-medium text-[var(--ink)] mt-0.5">
              {new Date(movimentacao.data).toLocaleString("pt-BR")}
            </p>
          </div>
        </div>

        <div className="flex justify-end pt-1">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-md border border-[var(--line)] text-sm font-medium text-[var(--ink)] hover:border-[var(--accent)] transition-colors duration-200"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};

export default ModalMovimentacao;