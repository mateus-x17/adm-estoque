const MovimentacaoRow = ({ movimentacao, abrirModal, index }) => {
  const dataCompacta = new Date(movimentacao.data).toLocaleDateString("pt-BR");
  const isEntrada = movimentacao.tipo === "ENTRADA";

  const badgeClass = isEntrada
    ? "border-[var(--teal)]/30 text-[var(--teal)]"
    : "border-[var(--accent)]/30 text-[var(--accent)]";

  return (
    <>
      {/* Desktop */}
      <tr
        style={{ animationDelay: `${index * 0.04}s` }}
        className="hidden md:table-row border-b border-[var(--line)] hover:bg-[var(--line)]/20 transition-colors duration-200 animate-fade-up"
      >
        <td className="px-4 py-3 text-sm text-[var(--ink)]">{movimentacao.produto.nome}</td>
        <td className="px-4 py-3 text-center">
          <span className={`px-2.5 py-0.5 rounded-md border font-mono text-[11px] uppercase ${badgeClass}`}>
            {movimentacao.tipo}
          </span>
        </td>
        <td className="px-4 py-3 text-center font-mono text-sm text-[var(--ink)]">
          {movimentacao.quantidade}
        </td>
        <td className="px-4 py-3 text-sm text-[var(--ink-soft)]">{movimentacao.usuario?.nome}</td>
        <td className="px-4 py-3 font-mono text-xs text-[var(--ink-soft)]">{dataCompacta}</td>
        <td className="px-4 py-3 text-center">
          <button
            onClick={() => abrirModal(movimentacao)}
            className="text-sm font-medium text-[var(--ink)] hover:text-[var(--accent)] transition-colors duration-200"
          >
            Detalhes
          </button>
        </td>
      </tr>

      {/* Mobile */}
      <tr className="md:hidden border-b border-[var(--line)]">
        <td className="px-4 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex flex-col gap-1.5">
              <span className="text-sm font-medium text-[var(--ink)]">
                {movimentacao.produto.nome}
              </span>
              <span className="font-mono text-xs text-[var(--ink-soft)]">{dataCompacta}</span>
              <span className={`w-fit px-2 py-0.5 rounded-md border font-mono text-[10px] uppercase ${badgeClass}`}>
                {movimentacao.tipo}
              </span>
            </div>

            <button
              onClick={() => abrirModal(movimentacao)}
              className="shrink-0 px-3 py-2 rounded-md border border-[var(--line)] text-xs font-medium text-[var(--ink)] hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors duration-200"
            >
              Ver
            </button>
          </div>
        </td>
      </tr>
    </>
  );
};

export default MovimentacaoRow;