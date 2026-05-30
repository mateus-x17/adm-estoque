import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useUserStore } from "../store/userStore";
import { authApi } from "../services/api";

const LoginForm = () => {
  const { setUser } = useUserStore();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [loading, setLoading] = useState(false);

  const submitForm = async (e) => {
    e.preventDefault();
    setErro("");
    setLoading(true);

    try {
      const data = await authApi.login({ email, senha });

      // login OK
      setUser(data.user, data.token);
      console.log("Login bem-sucedido. Usuário:", data.user.email);
      navigate("/dashboard");

    } catch (error) {
      console.error("Erro ao fazer login:", error);
      setErro(error.message || "Não foi possível conectar ao servidor.");
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
          type="email"
          placeholder="Email"
          value={email}
          required
          onChange={(e) => setEmail(e.target.value)}
          className="p-3 rounded-md border border-gray-300 dark:border-gray-600 bg-transparent text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
        />
        <input
          type="password"
          placeholder="Senha"
          value={senha}
          required
          onChange={(e) => setSenha(e.target.value)}
          className="p-3 rounded-md border border-gray-300 dark:border-gray-600 bg-transparent text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
        />
        <button
          type="submit"
          disabled={loading}
          className="mt-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-md transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Entrando..." : "Entrar"}
        </button>
      </form>

      {/* Modal ou mensagem de erro */}
      {/*{erro && <ModalMensagem mensagem={erro} onClose={() => setErro("")} />}*/}
      {erro && (
        <div className="mt-4 p-3 bg-red-100 text-red-700 border border-red-400 rounded-md">
          {erro}
        </div>
      )}
    </>
  );
};

export default LoginForm;
