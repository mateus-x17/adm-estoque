import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useUserStore } from "../../store/userStore.js";
import { useAuthStore } from "../../store/useAuthStore.js";
import { authApi } from "../../services/api/index.js";

const inputClass =
  "p-3 rounded-md border border-[var(--line)] bg-transparent text-[var(--ink)] placeholder:text-[var(--ink-soft)] focus:border-[var(--accent)] outline-none transition-colors duration-200";

const LoginForm = () => {
  const { setUser } = useUserStore();
  const { setToken } = useAuthStore();
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
      setUser(data.user);
      setToken(data.token);
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
      <form className="w-full max-w-sm flex flex-col gap-4 animate-fade-up" onSubmit={submitForm}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          required
          onChange={(e) => setEmail(e.target.value)}
          className={inputClass}
        />
        <input
          type="password"
          placeholder="Senha"
          value={senha}
          required
          onChange={(e) => setSenha(e.target.value)}
          className={inputClass}
        />
        <button
          type="submit"
          disabled={loading}
          className="mt-2 rounded-md bg-[var(--ink)] text-[var(--bg)] font-semibold py-3 text-sm hover:opacity-90 transition-opacity duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Entrando..." : "Entrar"}
        </button>
      </form>

      {erro && (
        <div className="mt-4 w-full max-w-sm p-3 rounded-md border border-red-500/30 bg-red-500/10 text-red-500 text-sm">
          {erro}
        </div>
      )}
    </>
  );
};

export default LoginForm;