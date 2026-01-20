import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useUserStore } from "../store/userStore";

const RegisterForm = () => {
  const url = "http://localhost:5000/auth/register";
  const { setUser } = useUserStore();
  const navigate = useNavigate();

  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [confirmEmail, setConfirmEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState(""); // mensagem de erro
  const [loading, setLoading] = useState(false); // estado de carregamento

  const submitForm = async (e) => {
    e.preventDefault();
    setErro("");

    // validação de email
    if (email !== confirmEmail) {
      setErro("Os emails não correspondem");
      return;
    }

    setLoading(true);
    const dados = { nome, email, senha };

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dados),
      });
      const data = await response.json();

      if (!response.ok) {
        const mensagemErro = data?.error || "Erro no servidor";
        setErro(mensagemErro);
        // limpar fomrmulário
        setNome("");
        setEmail("");
        setConfirmEmail("");
        setSenha("");
        return;
      }

      // registro bem-sucedido
      alert(data.message || "Usuário cadastrado com sucesso, faça login.");
      // limpar formulário
      setNome("");
      setEmail("");
      setConfirmEmail("");
      setSenha("");
      // redirecionar para login
      navigate("/auth");
    } catch (error) {
      console.error("Erro ao registrar usuário:", error);
      setErro("Não foi possível conectar ao servidor.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <form
        className="w-full max-w-sm flex flex-col gap-4 animate-slideUp"
        onSubmit={submitForm}
      >
        <input
          type="text"
          placeholder="Nome completo"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          required
          className="p-3 rounded-md border border-gray-300 dark:border-gray-600 bg-transparent text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
        />
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="p-3 rounded-md border border-gray-300 dark:border-gray-600 bg-transparent text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
        />
        <input
          type="email"
          placeholder="Confirmar Email"
          value={confirmEmail}
          onChange={(e) => setConfirmEmail(e.target.value)}
          required
          className="p-3 rounded-md border border-gray-300 dark:border-gray-600 bg-transparent text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
        />
        <input
          type="password"
          placeholder="Senha"
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
          required
          className="p-3 rounded-md border border-gray-300 dark:border-gray-600 bg-transparent text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
        />
        <button
          type="submit"
          disabled={loading}
          className="mt-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 rounded-md transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Registrando..." : "Registrar"}
        </button>
      </form>

      {erro && (
        <div className="mt-4 p-3 bg-red-100 text-red-700 border border-red-400 rounded-md">
          {erro}
        </div>
      )}
    </>
  );
};

export default RegisterForm;
