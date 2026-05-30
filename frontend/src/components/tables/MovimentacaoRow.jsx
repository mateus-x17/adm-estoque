const MovimentacaoRow = ({ movimentacao, abrirModal, index }) => {
    const dataCompacta = new Date(movimentacao.data).toLocaleDateString("pt-BR")

    const isEntrada = movimentacao.tipo === "ENTRADA"

    return (
        <>
            {/* DESKTOP */}
            <tr
                style={{ animationDelay: `${index * 0.05}s` }}
                className="hidden md:table-row border-b border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 transition animate-fadeIn">
                <td className="px-4 py-3">{movimentacao.produto.nome}</td>
                <td className="px-4 py-3 text-center">
                    <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold
              ${isEntrada
                                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                                : "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400"
                            }`}
                    >
                        {movimentacao.tipo}
                    </span>
                </td>
                <td className="px-4 py-3 text-center">{movimentacao.quantidade}</td>
                <td className="px-4 py-3">{movimentacao.usuario?.nome}</td>
                <td className="px-4 py-3">{dataCompacta}</td>
                <td className="px-4 py-3 text-center">
                    <button
                        onClick={() => abrirModal(movimentacao)}
                        className="text-indigo-600 hover:text-indigo-700 font-semibold"
                    >
                        Detalhes
                    </button>
                </td>
            </tr>

            {/* MOBILE */}
            <tr className="md:hidden border-b border-slate-200 dark:border-slate-800">
                <td className="px-4 py-4">
                    <div className="flex items-center justify-between gap-4">
                        {/* infos */}
                        <div className="flex flex-col gap-1">
                            <span className="font-semibold text-slate-900 dark:text-white">
                                {movimentacao.produto.nome}
                            </span>

                            <span className="text-xs text-slate-500 dark:text-slate-400">
                                {dataCompacta}
                            </span>

                            <span
                                className={`w-fit px-2 py-0.5 rounded-full text-[11px] font-semibold
                  ${isEntrada
                                        ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                                        : "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400"
                                    }`}
                            >
                                {movimentacao.tipo}
                            </span>
                        </div>

                        {/* ação */}
                        <button
                            onClick={() => abrirModal(movimentacao)}
                            className="shrink-0 px-3 py-2 rounded-xl text-xs font-semibold
                         bg-indigo-600 text-white hover:bg-indigo-700 transition"
                        >
                            Ver
                        </button>
                    </div>
                </td>
            </tr>
        </>
    )
}

export default MovimentacaoRow
