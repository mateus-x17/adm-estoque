import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiLayers, FiArrowRight } from "react-icons/fi";
import { useUserStore } from "../../store/userStore.js";
import { useAuthStore } from "../../store/useAuthStore.js";
import { useTenantStore } from "../../store/useTenantStore.js";
import { authApi } from "../../services/api/index.js";

// arquivo responsável pelo formulário de autenticação com suporte a Portal Admin/Loja e seletor de Organização

const inputClass =
  "w-full px-4 py-2.5 rounded-full border border-[var(--color-border-light)] bg-[var(--color-surface)] text-xs text-text-primary placeholder:text-text-secondary focus:border-accent-purple outline-none transition-colors duration-200";

const LoginForm = ({ portal = "loja" }) => {
  const { setUser } = useUserStore();
  const { setToken } = useAuthStore();
  const { setStores, setSelectedLojaId } = useTenantStore();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [organizacaoSlug, setOrganizacaoSlug] = useState("");
  const [orgOptions, setOrgOptions] = useState([]);
  const [erro, setErro] = useState("");
  const [loading, setLoading] = useState(false);

  // função para enviar credenciais ao servidor diferenciando portal ('admin' vs 'loja') e tratando múltiplas redes
  const performLogin = async (selectedOrgSlug = null) => {
    setErro("");
    setLoading(true);

    try {
      const slugToUse = selectedOrgSlug !== null ? selectedOrgSlug : organizacaoSlug;
      const payload = {
        email: email.trim(),
        senha,
        portal,
        ...(slugToUse.trim() ? { organizacaoSlug: slugToUse.trim() } : {}),
      };

      const data = await authApi.login(payload);

      if (data.requiresOrgSelection && Array.isArray(data.organizations)) {
        setOrgOptions(data.organizations);
        return;
      }

      setOrgOptions([]);
      setUser(data.user);
      setToken(data.token);

      if (data.user?.role === "ADMIN") {
        setStores(data.lojas || []);
        setSelectedLojaId("all");
      } else {
        setStores(data.user?.loja ? [data.user.loja] : []);
        setSelectedLojaId(data.user?.lojaId ? String(data.user.lojaId) : "all");
      }

      navigate("/dashboard");
    } catch (error) {
      console.error("Erro ao fazer login:", error);
      setErro(error.message || "Não foi possível conectar ao servidor.");
    } finally {
      setLoading(false);
    }
  };

  const submitForm = async (e) => {
    e.preventDefault();
    await performLogin();
  };

  return (
    <div className="w-full max-w-sm">
      {orgOptions.length > 0 ? (
        <div className="flex flex-col gap-3 animate-fade-up">
          <div className="p-3 rounded-2xl border border-accent-purple/30 bg-accent-purple/10 text-xs text-text-primary text-center">
            Seu e-mail está cadastrado em múltiplas redes/organizações. Escolha onde deseja acessar:
          </div>

          <div className="flex flex-col gap-2 max-h-56 overflow-y-auto pr-1 custom-scrollbar">
            {orgOptions.map((org) => (
              <button
                key={org.id}
                type="button"
                disabled={loading}
                onClick={() => {
                  setOrganizacaoSlug(org.slug);
                  performLogin(org.slug);
                }}
                className="w-full flex items-center justify-between gap-3 p-3.5 rounded-2xl border border-[var(--color-border-light)] bg-[var(--color-surface)] hover:border-accent-purple hover:bg-accent-purple/5 transition-all text-left"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-accent-purple/10 text-accent-purple flex items-center justify-center shrink-0">
                    <FiLayers size={16} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-text-primary truncate">{org.nome}</p>
                    <p className="font-mono text-[10px] text-text-secondary truncate">
                      @{org.slug} · {org.lojaNome}
                    </p>
                  </div>
                </div>
                <FiArrowRight size={14} className="text-text-secondary shrink-0" />
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => setOrgOptions([])}
            className="text-xs text-text-secondary hover:text-text-primary mt-1 underline"
          >
            Voltar para credenciais
          </button>
        </div>
      ) : (
        <form className="w-full flex flex-col gap-3 animate-fade-up" onSubmit={submitForm}>
          <input
            type="email"
            placeholder="Email corporativo"
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
            placeholder="Código da organização (opcional, ex: grupo-techstock)"
            value={organizacaoSlug}
            onChange={(e) => setOrganizacaoSlug(e.target.value)}
            className={inputClass}
          />
          <button
            type="submit"
            disabled={loading}
            className="btn-primary mt-1 w-full py-2.5 text-xs font-semibold"
          >
            {loading
              ? "Entrando..."
              : portal === "admin"
              ? "Acessar Painel do Administrador"
              : "Entrar na Loja"}
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
