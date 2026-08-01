import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useUserStore } from "../../store/userStore.js";
import { authApi } from "../../services/api/index.js";

const inputClass =
  "p-3 rounded-md border border-[var(--line)] bg-transparent text-[var(--ink)] placeholder:text-[var(--ink-soft)] focus:border-[var(--accent)] outline-none transition-colors duration-200";

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
          className="mt-2 rounded-md bg-[var(--ink)] text-[var(--bg)] font-semibold py-3 text-sm hover:opacity-90 transition-opacity duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Registrando..." : "Registrar"}
        </button>
      </form>

      {erro && (
        <div className="mt-4 w-full max-w-sm p-3 rounded-md border border-red-500/30 bg-red-500/10 text-red-500 text-sm">
          {erro}
        </div>
      )}

      {sucesso && (
        <div className="mt-4 w-full max-w-sm p-3 rounded-md border border-[var(--teal)]/30 bg-[var(--teal)]/10 text-[var(--teal)] text-sm">
          {sucesso}
        </div>
      )}
    </>
  );
};

export default RegisterForm;