import React, { useState, useEffect } from "react";
import ModalProduto from "../components/ModalProduto.jsx";
import TabelaProdutos from "../components/TabelaProdutos.jsx";
import { useUserStore } from "../store/userStore.js";

const Produtos = () => {
  const url = "http://localhost:5000/products";
  const [produtos, setProdutos] = useState([]);
  const [produtoSelecionado, setProdutoSelecionado] = useState(null);
  const [loaded, setLoaded] = useState(false);

  const { token } = useUserStore();

  const abrirModal = (produto) => setProdutoSelecionado(produto);
  const fecharModal = () => setProdutoSelecionado(null);

  const carregarProdutos = async () => {
    try {
      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (response.ok) {
        setProdutos(data);
        console.log("Produtos carregados:", data);
        setTimeout(() => setLoaded(true), 50); // delay para animação
      } else {
        console.error("Erro ao carregar produtos:", data.message);
      }
    } catch (error) {
      console.error("Erro ao carregar produtos:", error);
    }
  };
  const buscarProdutosNovamente = async () => {
  const response = await fetch("http://localhost:5000/products", {
    headers: { Authorization: `Bearer ${token}` }
  });
  const data = await response.json();
  setProdutos(data); // ✅ isso faz a tabela atualizar
};

  useEffect(() => {
    carregarProdutos();
  }, []);

  return (
    <div className="flex flex-col h-full w-full p-6 overflow-hidden bg-gray-200 dark:bg-gray-900 transition-all duration-500">
      <header className="mb-6 text-center animate-fadeInDown">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 dark:text-white break-words">
          Gerenciamento de <span className="text-yellow-400">Produtos</span>
        </h1>
        <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-base">
          Visualize, edite e gerencie os produtos cadastrados.
        </p>
      </header>

      {
        loaded ? (
          <TabelaProdutos produtos={produtos} abrirModal={abrirModal} />
        ) : (
          <div className="flex-grow flex items-center justify-center">
            <div className="loader ease-linear rounded-full border-8 border-t-8 border-gray-200 h-16 w-16">
            </div>
          </div>
        )
      }

      {produtoSelecionado && (
        <ModalProduto
          produtoSelecionado={produtoSelecionado}
          fecharModal={fecharModal}
          buscarProdutosNovamente={buscarProdutosNovamente} 
        />
      )}
    </div>
  );
};

export default Produtos;
