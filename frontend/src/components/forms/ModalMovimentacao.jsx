import { createPortal } from "react-dom";

// -------------------------------------------------------------------------
// Componente Puramente de Apresentação (Read-Only)
// Não realiza validações de transação (ex: bloqueio de estoque negativo), 
// estas são tratadas no EditarItem.jsx(CriarPedido) e pelo backend (productController).
// Serve apenas para detalhamento histórico.
// -------------------------------------------------------------------------
const ModalMovimentacao = ({ isOpen, onClose, movimentacao }) => {
  if (!isOpen || !movimentacao) return null;

  const isEntrada = movimentacao.tipo === "ENTRADA";
  const badgeClass = isEntrada
    ? "bg-accent-green/10 text-accent-green border-accent-green"
    : "bg-accent-red/10 text-accent-red border-accent-red";

  return createPortal(
    <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center px-4 transition-opacity duration-300">
      <div className="w-full max-w-sm bg-[var(--color-bg)] border border-[var(--color-border)] rounded-2xl p-6 space-y-5 shadow-[0_8px_30px_rgb(0,0,0,0.5)] animate-scale-in">
        <div className="flex items-center justify-between border-b border-[var(--color-border)] pb-4">
          <h2 className="font-display text-base font-semibold text-text-primary">
            Detalhes da movimentação
          </h2>
          <button
            onClick={onClose}
            className="text-lg text-text-secondary hover:text-text-primary transition-colors duration-200 leading-none"
          >
            ✕
          </button>
        </div>

        <span className={`inline-block px-3 py-1 rounded-full border font-mono text-[10px] tracking-wide uppercase ${badgeClass}`}>
          {movimentacao.tipo}
        </span>

        <div className="space-y-4 text-xs">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-wide text-text-secondary">
              ID do pedido
            </p>
            <p className="font-medium text-text-primary mt-1">#{movimentacao.id}</p>
          </div>

          <div>
            <p className="font-mono text-[10px] uppercase tracking-wide text-text-secondary">
              Produto
            </p>
            <p className="font-medium text-text-primary mt-1">{movimentacao.produto.nome}</p>
          </div>

          <div className="flex gap-8">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-wide text-text-secondary">
                Quantidade
              </p>
              <p className="font-medium text-text-primary mt-1">{movimentacao.quantidade}</p>
            </div>
            <div>
              <p className="font-mono text-[10px] uppercase tracking-wide text-text-secondary">
                Data
              </p>
              <p className="font-medium text-text-primary mt-1">
                {new Date(movimentacao.data).toLocaleString("pt-BR")}
              </p>
            </div>
          </div>

          <div>
            <p className="font-mono text-[10px] uppercase tracking-wide text-text-secondary">
              Usuário
            </p>
            <p className="font-medium text-text-primary mt-1">{movimentacao.usuario?.nome}</p>
          </div>

          <div className="pt-4 mt-4 border-t border-[var(--color-border)]">
            <p className="font-mono text-[10px] uppercase tracking-wide text-text-secondary">
              Valor Total
            </p>
            <p className="font-medium text-text-primary mt-1 text-base">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(movimentacao.quantidade * (movimentacao.produto?.preco || 0))}
            </p>
          </div>
        </div>

        <div className="flex justify-end pt-4 border-t border-[var(--color-border)]">
          <button
            onClick={onClose}
            className="btn-secondary px-5 py-2 text-xs font-semibold"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default ModalMovimentacao;