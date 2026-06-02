import React from "react";
import { FiEdit, FiTrash, FiTruck } from "react-icons/fi";

const FornecedorRow = ({ fornecedor, index, onEdit, onDelete, onOpenDetails }) => {
    const email = fornecedor.email || "";
    const telefone = fornecedor.telefone || "";
    const contatoCompacto = [email, telefone].filter(Boolean).join(" • ") || "-";

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
            <td
                className="block md:hidden p-4 space-y-3 cursor-pointer"
                onClick={() => onOpenDetails?.(fornecedor)}
            >
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                            <FiTruck />
                        </div>
                        <div>
                            <p className="font-semibold text-gray-900 dark:text-white">
                                {fornecedor.nome}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                #{fornecedor.id}
                            </p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onEdit(fornecedor);
                            }}
                            className="p-2 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition"
                        >
                            <FiEdit />
                        </button>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onDelete(fornecedor.id);
                            }}
                            className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition"
                        >
                            <FiTrash />
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <div>
                        <span className="block text-xs text-gray-400">Contato</span>
                        <span className="break-words">{contatoCompacto}</span>
                    </div>
                    <div>
                        <span className="block text-xs text-gray-400">Endereço</span>
                        {fornecedor.endereco || "-"}
                    </div>
                </div>
            </td>

            {/* Desktop Cells */}
            <td className="hidden md:table-cell px-6 py-4 text-gray-500 dark:text-gray-400">#{fornecedor.id}</td>
            <td
                className="hidden md:table-cell px-6 py-4 font-semibold text-gray-900 dark:text-white cursor-pointer"
                onClick={() => onOpenDetails?.(fornecedor)}
                title="Clique para ver detalhes"
            >
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                        <FiTruck size={14} />
                    </div>
                    {fornecedor.nome}
                </div>
            </td>
            <td
                className="hidden md:table-cell px-6 py-4 text-gray-600 dark:text-gray-300 cursor-pointer"
                onClick={() => onOpenDetails?.(fornecedor)}
                title="Clique para ver detalhes"
            >
                <div className="max-w-[280px]">
                    <p className="truncate">{email || "-"}</p>
                    <p className="truncate text-xs text-gray-500 dark:text-gray-400">{telefone || "-"}</p>
                </div>
            </td>
            <td className="hidden md:table-cell px-6 py-4 text-gray-600 dark:text-gray-300">
                <p className="max-w-[360px] truncate" title={fornecedor.endereco || ""}>
                    {fornecedor.endereco || "-"}
                </p>
            </td>
            <td className="hidden md:table-cell px-6 py-4">
                <div className="flex justify-center gap-3">
                    <button
                        onClick={() => onEdit(fornecedor)}
                        className="text-blue-500 hover:text-blue-700 transition-colors p-1"
                    >
                        <FiEdit size={18} />
                    </button>
                    <button
                        onClick={() => onDelete(fornecedor.id)}
                        className="text-red-500 hover:text-red-700 transition-colors p-1"
                    >
                        <FiTrash size={18} />
                    </button>
                </div>
            </td>
        </tr>
    );
};

export default FornecedorRow;
