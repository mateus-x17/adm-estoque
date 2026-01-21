import React from "react";
import FornecedorRow from "./FornecedorRow";

/**
 * Table component for displaying suppliers list
 */
const FornecedoresTable = ({ fornecedores, loading, onEdit, onDelete }) => {
    return (
        <div className="bg-white dark:bg-slate-900 shadow-xl shadow-slate-200/50 dark:shadow-none rounded-3xl overflow-hidden border border-slate-100 dark:border-slate-800">
            <table className="w-full text-left text-sm text-slate-600 dark:text-slate-400">
                <thead className="bg-slate-50 dark:bg-slate-800/50 text-xs uppercase font-bold text-slate-500 dark:text-slate-300">
                    <tr>
                        <th className="hidden md:table-cell px-6 py-4">ID</th>
                        <th className="hidden md:table-cell px-6 py-4">Nome</th>
                        <th className="hidden md:table-cell px-6 py-4">Contato</th>
                        <th className="hidden md:table-cell px-6 py-4">Endereço</th>
                        <th className="hidden md:table-cell px-6 py-4 text-center">Ações</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {loading ? (
                        <tr>
                            <td colSpan="5" className="p-6 text-center">
                                Carregando...
                            </td>
                        </tr>
                    ) : fornecedores.length === 0 ? (
                        <tr>
                            <td colSpan="5" className="p-6 text-center">
                                Nenhum fornecedor cadastrado.
                            </td>
                        </tr>
                    ) : (
                        fornecedores.map((sup, index) => (
                            <FornecedorRow
                                key={sup.id}
                                fornecedor={sup}
                                index={index}
                                onEdit={onEdit}
                                onDelete={onDelete}
                            />
                        ))
                    )}
                </tbody>
            </table>
        </div>
    );
};

export default FornecedoresTable;
