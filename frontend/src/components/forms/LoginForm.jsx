import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useUserStore } from "../../store/userStore.js";
import { useAuthStore } from "../../store/useAuthStore.js";
import { authApi } from "../../services/api/index.js";

const inputClass =
  "w-full px-4 py-2 rounded-full border border-[var(--color-border-light)] bg-[var(--color-surface)] text-xs text-text-primary placeholder:text-text-secondary focus:border-accent-purple outline-none transition-colors duration-200";

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
          className="btn-primary mt-4 w-full py-2 text-xs font-semibold"
        >
          {loading ? "Entrando..." : "Entrar"}
        </button>
      </form>

      {erro && (
        <div className="mt-4 w-full max-w-sm p-4 rounded-xl border border-accent-red/20 bg-accent-red/10 text-accent-red text-sm text-center">
          {erro}
        </div>
      )}
    </>
  );
};

export default LoginForm;