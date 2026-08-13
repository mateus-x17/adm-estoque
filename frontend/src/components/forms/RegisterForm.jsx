import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useUserStore } from "../../store/userStore.js";
import { authApi } from "../../services/api/index.js";

const inputClass =
  "w-full px-4 py-2 rounded-full border border-[var(--color-border-light)] bg-[var(--color-surface)] text-xs text-text-primary placeholder:text-text-secondary focus:border-accent-purple outline-none transition-colors duration-200";

const RegisterForm = () => {
  const { setUser } = useUserStore();
  const navigate = useNavigate();

  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [confirmEmail, setConfirmEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");
  const [loading, setLoading] = useState(false);

  const submitForm = async (e) => {
    e.preventDefault();
    setErro("");

    if (email !== confirmEmail) {
      setErro("Os emails não correspondem");
      return;
    }

    setLoading(true);
    const dados = { nome, email, senha };

    try {
      const data = await authApi.register(dados);
      setSucesso(data.message || "Usuário cadastrado com sucesso! Redirecionando...");
      setNome("");
      setEmail("");
      setConfirmEmail("");
      setSenha("");
      setTimeout(() => navigate("/auth"), 2000);
    } catch (error) {
      console.error("Erro ao registrar usuário:", error);
      setErro(error.message || "Não foi possível conectar ao servidor.");
      setNome("");
      setEmail("");
      setConfirmEmail("");
      setSenha("");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <form className="w-full max-w-sm flex flex-col gap-4 animate-fade-up" onSubmit={submitForm}>
        <input
          type="text"
          placeholder="Nome completo"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          required
          className={inputClass}
        />
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className={inputClass}
        />
        <input
          type="email"
          placeholder="Confirmar Email"
          value={confirmEmail}
          onChange={(e) => setConfirmEmail(e.target.value)}
          required
          className={inputClass}
        />
        <input
          type="password"
          placeholder="Senha"
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
          required
          className={inputClass}
        />
        <button
          type="submit"
          disabled={loading}
          className="btn-primary mt-4 w-full py-2 text-xs font-semibold"
        >
          {loading ? "Registrando..." : "Registrar"}
        </button>
      </form>

      {erro && (
        <div className="mt-4 w-full max-w-sm p-4 rounded-xl border border-accent-red/20 bg-accent-red/10 text-accent-red text-sm text-center">
          {erro}
        </div>
      )}

      {sucesso && (
        <div className="mt-4 w-full max-w-sm p-4 rounded-xl border border-accent-green/20 bg-accent-green/10 text-accent-green text-sm text-center">
          {sucesso}
        </div>
      )}
    </>
  );
};

export default RegisterForm;