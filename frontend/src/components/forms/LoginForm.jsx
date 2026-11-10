import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiHome, FiArrowRight } from "react-icons/fi";
import { useUserStore } from "../../store/userStore.js";
import { useAuthStore } from "../../store/useAuthStore.js";
import { authApi } from "../../services/api/index.js";

// arquivo responsável pelo formulário de autenticação com suporte a login por estabelecimento (multi-tenant)

const inputClass =
  "w-full px-4 py-2.5 rounded-full border border-[var(--color-border-light)] bg-[var(--color-surface)] text-xs text-text-primary placeholder:text-text-secondary focus:border-accent-purple outline-none transition-colors duration-200";

const LoginForm = () => {
  const { setUser } = useUserStore();
  const { setToken } = useAuthStore();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [lojaSlug, setLojaSlug] = useState("");
  const [storeOptions, setStoreOptions] = useState([]);
  const [erro, setErro] = useState("");
  const [loading, setLoading] = useState(false);

  // função auxiliar para executar a chamada de autenticação com ou sem lojaSlug explícito
  // 1 - Limpa erros anteriores e aciona estado de carregamento
  // 2 - Envia email, senha e lojaSlug opcional para authApi.login
  // 3 - Caso a conta exista em múltiplas lojas com mesma senha, exibe lista de estabelecimentos para seleção
  // 4 - Quando autenticado, persiste usuário e token JWT nas stores Zustand e redireciona ao dashboard
  const performLogin = async (selectedSlug = null) => {
    setErro("");
    setLoading(true);

    try {
      const slugToUse = selectedSlug !== null ? selectedSlug : lojaSlug;
      const payload = {
        email: email.trim(),
        senha,
        ...(slugToUse.trim() ? { lojaSlug: slugToUse.trim() } : {}),
      };

      const data = await authApi.login(payload);

      if (data.requiresStoreSelection && Array.isArray(data.stores)) {
        setStoreOptions(data.stores);
        return;
      }

      setStoreOptions([]);
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

  // função manipuladora de submissão padrão do formulário
  const submitForm = async (e) => {
    e.preventDefault();
    await performLogin();
  };

  return (
    <div className="w-full max-w-sm">
      {storeOptions.length > 0 ? (
        <div className="flex flex-col gap-3 animate-fade-up">
          <div className="p-3 rounded-2xl border border-accent-purple/30 bg-accent-purple/10 text-xs text-text-primary text-center">
            Seu e-mail está ativo em múltiplos estabelecimentos. Escolha em qual loja deseja entrar:
          </div>

          <div className="flex flex-col gap-2 max-h-56 overflow-y-auto pr-1 custom-scrollbar">
            {storeOptions.map((store) => (
              <button
                key={store.id}
                type="button"
                disabled={loading}
                onClick={() => {
                  setLojaSlug(store.slug);
                  performLogin(store.slug);
                }}
                className="w-full flex items-center justify-between gap-3 p-3.5 rounded-2xl border border-[var(--color-border-light)] bg-[var(--color-surface)] hover:border-accent-purple hover:bg-accent-purple/5 transition-all text-left"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-accent-purple/10 text-accent-purple flex items-center justify-center shrink-0">
                    <FiHome size={16} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-text-primary truncate">{store.nome}</p>
                    <p className="font-mono text-[10px] text-text-secondary truncate">@{store.slug}</p>
                  </div>
                </div>
                <FiArrowRight size={14} className="text-text-secondary shrink-0" />
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => setStoreOptions([])}
            className="text-xs text-text-secondary hover:text-text-primary mt-1 underline"
          >
            Voltar para credenciais
          </button>
        </div>
      ) : (
        <form className="w-full flex flex-col gap-3.5 animate-fade-up" onSubmit={submitForm}>
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
          <input
            type="text"
            placeholder="Código da loja (opcional, ex: techstock-matriz)"
            value={lojaSlug}
            onChange={(e) => setLojaSlug(e.target.value)}
            className={inputClass}
          />
          <button
            type="submit"
            disabled={loading}
            className="btn-primary mt-2 w-full py-2.5 text-xs font-semibold"
          >
            {loading ? "Entrando..." : "Entrar no Painel"}
          </button>
        </form>
      )}

      {erro && (
        <div className="mt-4 w-full p-3.5 rounded-xl border border-accent-red/20 bg-accent-red/10 text-accent-red text-xs text-center">
          {erro}
        </div>
      )}
    </div>
  );
};

export default LoginForm;
