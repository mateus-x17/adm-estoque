const ModalMovimentacao = ({ isOpen, onClose, movimentacao }) => {
    if (!isOpen || !movimentacao) return null

    const isEntrada = movimentacao.tipo === "ENTRADA"

    return (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center px-4">
            <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl p-6 space-y-6 shadow-xl">
                {/* header */}
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">
                        Detalhes da Movimentação
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                    >
                        ✕
                    </button>
                </div>

                {/* tipo */}
                <div>
                    <span
                        className={`inline-block px-4 py-1.5 rounded-full text-sm font-bold
              ${isEntrada
                                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                                : "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400"
                            }`}
                    >
                        {movimentacao.tipo}
                    </span>
                </div>

                {/* infos */}
                <div className="space-y-3 text-sm">
                    <div>
                        <p className="text-slate-500">Produto</p>
                        <p className="font-semibold text-slate-900 dark:text-white">
                            {movimentacao.produto.nome}
                        </p>
                    </div>

                    <div>
                        <p className="text-slate-500">Quantidade</p>
                        <p className="font-semibold text-slate-900 dark:text-white">
                            {movimentacao.quantidade}
                        </p>
                    </div>

                    <div>
                        <p className="text-slate-500">Usuário</p>
                        <p className="font-semibold text-slate-900 dark:text-white">
                            {movimentacao.usuario?.nome}
                        </p>
                    </div>

                    <div>
                        <p className="text-slate-500">Data</p>
                        <p className="font-semibold text-slate-900 dark:text-white">
                            {new Date(movimentacao.data).toLocaleString("pt-BR")}
                        </p>
                    </div>
                </div>

                {/* footer */}
                <div className="flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-5 py-2.5 rounded-2xl font-semibold
                       bg-slate-200 hover:bg-slate-300
                       dark:bg-slate-800 dark:hover:bg-slate-700"
                    >
                        Fechar
                    </button>
                </div>
            </div>
        </div>
    )
}

export default ModalMovimentacao;
