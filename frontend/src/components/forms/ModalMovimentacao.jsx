import { createPortal } from "react-dom";

// arquivo responsável pelo modal de auditoria detalhada de uma movimentação unitária do livro-razão

// função responsável por exibir em modal os dados completos e o snapshot financeiro de uma movimentação.
//
// 1 - recebe isOpen (boolean), onClose (function) e movimentacao (object).
// 2 - identifica tipo da movimentação, código de pedido e calcula o valor total da época.
// 3 - retorna o modal via createPortal dimensionado em max-h-[92dvh] ou null se fechado.
const ModalMovimentacao = ({ isOpen, onClose, movimentacao }) => {
  if (!isOpen || !movimentacao) return null;

  const isVenda = movimentacao.tipo === "VENDA" || movimentacao.tipo === "SAIDA";
  const badgeClass = movimentacao.estorno
    ? "bg-amber-500/15 text-amber-400 border-amber-500/40"
    : isVenda
    ? "bg-accent-green/10 text-accent-green border-accent-green"
    : "bg-accent-red/10 text-accent-red border-accent-red";

  const vendedorNome =
    movimentacao.usuario?.nome || movimentacao.vendedorNomeSnapshot || "Colaborador";
  const valorCalculado =
    movimentacao.valorTotal !== undefined
      ? Number(movimentacao.valorTotal)
      : movimentacao.quantidade * Number(movimentacao.produto?.preco || 0);

  return createPortal(
    <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center px-3 sm:px-4 transition-opacity duration-300">
      <div className="w-full max-w-sm max-h-[92dvh] overflow-y-auto custom-scrollbar bg-[var(--color-bg)] border border-[var(--color-border)] rounded-2xl p-5 space-y-3.5 shadow-[0_8px_30px_rgb(0,0,0,0.5)] animate-scale-in">
        <div className="flex items-center justify-between border-b border-[var(--color-border)] pb-3">
          <h2 className="font-display text-base font-semibold text-text-primary">
            Detalhes da movimentação
          </h2>
          <button
            onClick={onClose}
            className="text-lg text-text-secondary hover:text-text-primary leading-none"
          >
            ✕
          </button>
        </div>

        <div className="flex flex-wrap gap-2">
          <span
            className={`inline-block px-3 py-1 rounded-full border font-mono text-[10px] tracking-wide uppercase ${badgeClass}`}
          >
            {isVenda ? "VENDA" : "REPOSIÇÃO"}
            {movimentacao.estorno ? " • ESTORNO" : ""}
          </span>
          {movimentacao.pedido?.codigo && (
            <span className="inline-block px-3 py-1 rounded-full border border-[var(--color-border)] font-mono text-[10px] text-text-secondary">
              {movimentacao.pedido.codigo}
            </span>
          )}
        </div>

        <div className="space-y-3 text-xs">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-wide text-text-secondary">
              ID da Movimentação
            </p>
            <p className="font-medium text-text-primary mt-0.5">#{movimentacao.id}</p>
          </div>

          <div>
            <p className="font-mono text-[10px] uppercase tracking-wide text-text-secondary">
              Produto
            </p>
            <p className="font-medium text-text-primary mt-0.5">{movimentacao.produto?.nome}</p>
          </div>

          <div className="flex gap-8">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-wide text-text-secondary">
                Quantidade
              </p>
              <p className="font-medium text-text-primary mt-0.5">{movimentacao.quantidade}</p>
            </div>
            <div>
              <p className="font-mono text-[10px] uppercase tracking-wide text-text-secondary">
                Data
              </p>
              <p className="font-medium text-text-primary mt-0.5">
                {new Date(movimentacao.data).toLocaleString("pt-BR")}
              </p>
            </div>
          </div>

          <div>
            <p className="font-mono text-[10px] uppercase tracking-wide text-text-secondary">
              Responsável / Auditoria
            </p>
            <p className="font-medium text-text-primary mt-0.5">
              {vendedorNome}{" "}
              <span className="font-mono text-text-secondary">
                (#{movimentacao.vendedorRefId}
                {!movimentacao.usuario ? " · Conta removida" : ""})
              </span>
            </p>
          </div>

          {movimentacao.observacao && (
            <div>
              <p className="font-mono text-[10px] uppercase tracking-wide text-text-secondary">
                Observação
              </p>
              <p className="text-text-secondary mt-0.5">{movimentacao.observacao}</p>
            </div>
          )}

          <div className="pt-3 border-t border-[var(--color-border)]">
            <p className="font-mono text-[10px] uppercase tracking-wide text-text-secondary">
              Valor Total (Preço da época)
            </p>
            <p className="font-medium text-text-primary mt-0.5 text-base">
              {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
                valorCalculado
              )}
            </p>
          </div>
        </div>

        <div className="flex justify-end pt-3 border-t border-[var(--color-border)]">
          <button onClick={onClose} className="btn-secondary px-5 py-2 text-xs font-semibold">
            Fechar
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default ModalMovimentacao;
