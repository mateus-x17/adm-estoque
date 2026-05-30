import React from "react";

const PedidoRow = ({ pedido, index }) => {
    const dataCompacta = new Date(pedido.data).toLocaleDateString("pt-BR");
    const horaCompacta = new Date(pedido.data).toLocaleTimeString("pt-BR", { hour: '2-digit', minute: '2-digit' });
    const isEntrada = pedido.tipo === "ENTRADA";

    return (
        <tr
            style={{ animationDelay: `${index * 0.05}s` }}
            className="
                block md:table-row
                border-b border-gray-200 dark:border-gray-800
                hover:bg-gray-50 dark:hover:bg-gray-800/30
                transition animate-fadeIn
            "
        >
            {/* Mobile Card */}
            <td className="block md:hidden p-4 space-y-3">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="font-semibold text-gray-900 dark:text-white">{pedido.produto?.nome}</p>
                        <p className="text-xs text-gray-500">#{pedido.id} • {dataCompacta} {horaCompacta}</p>
                    </div>
                    <span
                        className={`px-2 py-1 rounded-full text-xs font-bold ${isEntrada
                            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                            : "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400"
                            }`}
                    >
                        {pedido.tipo}
                    </span>
                </div>
                <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Qtd: <span className="font-bold text-gray-900 dark:text-white">{pedido.quantidade}</span></span>
                    <span className="text-gray-500 text-xs">Resp: {pedido.usuario?.nome}</span>
                </div>
            </td>

            {/* Desktop Cells */}
            <td className="hidden md:table-cell px-6 py-4 font-mono text-xs text-gray-500">#{pedido.id}</td>
            <td className="hidden md:table-cell px-6 py-4 font-medium text-slate-900 dark:text-white">
                {pedido.produto?.nome}
            </td>
            <td className="hidden md:table-cell px-6 py-4">
                <span
                    className={`px-2 py-1 rounded-full text-xs font-bold ${isEntrada
                        ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400"
                        : "bg-rose-100 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400"
                        }`}
                >
                    {pedido.tipo}
                </span>
            </td>
            <td className="hidden md:table-cell px-6 py-4 text-center font-bold text-slate-700 dark:text-slate-300">{pedido.quantidade}</td>
            <td className="hidden md:table-cell px-6 py-4 text-slate-600 dark:text-slate-400">
                {dataCompacta} <span className="text-xs opacity-70">{horaCompacta}</span>
            </td>
            <td className="hidden md:table-cell px-6 py-4 text-sm text-slate-600 dark:text-slate-400">{pedido.usuario?.nome}</td>
        </tr>
    );
};

export default PedidoRow;
