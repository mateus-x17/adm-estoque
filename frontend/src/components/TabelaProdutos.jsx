import React, { useState, useEffect } from "react";
import ModalProduto from "../components/ModalProduto.jsx";
import ProdutoRow from "../components/ProdutoRow.jsx";
import { productsApi } from "../services/api";

const Produtos = () => {
  const [produtos, setProdutos] = useState([]);
  const [produtoSelecionado, setProdutoSelecionado] = useState(null);
  const [loaded, setLoaded] = useState(false);

  const abrirModal = (produto) => setProdutoSelecionado(produto);
  const fecharModal = () => setProdutoSelecionado(null);

  const carregarProdutos = async () => {
    try {
      const data = await productsApi.getProducts();
      setProdutos(data);
    } catch (error) {
      console.error("Erro ao carregar produtos:", error);
    }
  };

  useEffect(() => {
    carregarProdutos();
  }, []);

  useEffect(() => {
    if (produtos.length > 0) {
      const timer = setTimeout(() => setLoaded(true), 50);
      return () => clearTimeout(timer);
    }
  }, [produtos]);

  return (
    <div className="flex flex-col h-full w-full p-6 overflow-hidden bg-gray-200 dark:bg-gray-900 transition-all duration-500">

      {/* Tabela com animação */}
      {loaded && (
        <div className="flex-1 overflow-auto overflow-x-auto overflow-y-auto bg-gray-300 dark:bg-gray-800 p-4 rounded-xl shadow-inner animate-fadeInUp transition-all duration-500">
          <table className="w-full min-w-[600px] bg-white dark:bg-gray-600 rounded-xl shadow-md">
            <thead className="sticky top-0 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-200">
              <tr>
                <th className="px-4 py-3 text-left">Imagem</th>
                <th className="px-4 py-3 text-left">Nome</th>
                <th className="px-4 py-3 text-left">Categoria</th>
                <th className="px-4 py-3 text-center">Detalhes</th>
              </tr>
            </thead>
            <tbody>
              {produtos.map((produto, index) => (
                <ProdutoRow
                  key={produto.id}
                  produto={produto}
                  index={index}
                  abrirModal={abrirModal}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal de informações */}
      {produtoSelecionado && (
        <ModalProduto produtoSelecionado={produtoSelecionado} fecharModal={fecharModal} />
      )}
    </div>
  );
};

export default Produtos;
