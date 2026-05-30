import React from "react";
import PedidoRow from "./PedidoRow";

/**
 * Table container for Pedidos with header and count badge
 */
const PedidosTableContainer = ({ pedidos, totalCount, loading }) => {
    return (
        <div className="bg-white dark:bg-slate-900 shadow-xl shadow-slate-200/50 dark:shadow-none rounded-3xl overflow-hidden border border-slate-100 dark:border-slate-800 flex flex-col">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                    Histórico de Pedidos
                </h2>
                <span className="text-xs text-slate-500 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full">
                    Total: {totalCount}
                </span>
            </div>

            <div className="overflow-x-auto flex-1">
                <table className="w-full text-left text-sm text-slate-600 dark:text-slate-400">
                    <thead className="bg-slate-50 dark:bg-slate-800/50 text-xs uppercase font-bold text-slate-500 dark:text-slate-300">
                        <tr>
                            <th className="hidden md:table-cell px-6 py-4">ID</th>
                            <th className="hidden md:table-cell px-6 py-4">Produto</th>
                            <th className="hidden md:table-cell px-6 py-4">Tipo</th>
                            <th className="hidden md:table-cell px-6 py-4 text-center">Quantidade</th>
                            <th className="hidden md:table-cell px-6 py-4">Data</th>
                            <th className="hidden md:table-cell px-6 py-4">Resp.</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {loading ? (
                            <tr>
                                <td colSpan="6" className="text-center py-8">
                                    Carregando...
                                </td>
                            </tr>
                        ) : pedidos.length === 0 ? (
                            <tr>
                                <td colSpan="6" className="text-center py-8">
                                    Nenhum pedido encontrado.
                                </td>
                            </tr>
                        ) : (
                            pedidos.map((ped, index) => (
                                <PedidoRow key={ped.id} pedido={ped} index={index} />
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default PedidosTableContainer;
