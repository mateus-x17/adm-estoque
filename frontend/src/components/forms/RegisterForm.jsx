import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useUserStore } from "../../store/userStore.js";
import { useAuthStore } from "../../store/useAuthStore.js";
import { useTenantStore } from "../../store/useTenantStore.js";
import { authApi } from "../../services/api/index.js";

// arquivo responsável pelo cadastro público de nova Organização (Rede), 1ª Loja e fundador ADMIN

const inputClass =
  "w-full px-4 py-2 rounded-full border border-[var(--color-border-light)] bg-[var(--color-surface)] text-xs text-text-primary placeholder:text-text-secondary focus:border-accent-purple outline-none transition-colors duration-200";

function slugifyName(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

const RegisterForm = () => {
  const { setUser } = useUserStore();
  const { setToken } = useAuthStore();
  const { setStores, setSelectedLojaId } = useTenantStore();
  const navigate = useNavigate();

  const [nomeOrganizacao, setNomeOrganizacao] = useState("");
  const [nomeLoja, setNomeLoja] = useState("");
  const [slug, setSlug] = useState("");
  const [slugEdited, setSlugEdited] = useState(false);
  const [cnpj, setCnpj] = useState("");
  const [telefone, setTelefone] = useState("");
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");
  const [loading, setLoading] = useState(false);

  const handleOrgNameChange = (e) => {
    const val = e.target.value;
    setNomeOrganizacao(val);
    if (!slugEdited) {
      setSlug(slugifyName(val));
    }
  };

  // função para submeter abertura da Organização + 1ª Loja + ADMIN e logar automaticamente
  const submitForm = async (e) => {
    e.preventDefault();
    setErro("");
    setSucesso("");

    if (senha.length < 6) {
      setErro("A senha deve ter pelo menos 6 caracteres.");
      return;
    }

    setLoading(true);
    try {
      const data = await authApi.register({
        nomeOrganizacao: nomeOrganizacao.trim(),
        nomeLoja: (nomeLoja || `${nomeOrganizacao} Matriz`).trim(),
        slug: slug.trim() || undefined,
        cnpj: cnpj.trim() || undefined,
        telefone: telefone.trim() || undefined,
        nome: nome.trim(),
        email: email.trim(),
        senha,
      });

      setSucesso("Rede e 1ª loja criadas com sucesso! Entrando no painel...");

      if (data.token && data.user) {
        setUser(data.user);
        setToken(data.token);
        setStores(data.lojas || []);
        setSelectedLojaId("all");
        setTimeout(() => navigate("/dashboard"), 800);
      }
    } catch (error) {
      console.error("Erro ao cadastrar organização:", error);
      setErro(error.message || "Não foi possível criar a organização.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-sm">
      <form className="w-full flex flex-col gap-2 animate-fade-up" onSubmit={submitForm}>
        <input
          type="text"
          placeholder="Nome da Organização / Rede *"
          value={nomeOrganizacao}
          onChange={handleOrgNameChange}
          required
          className={inputClass}
        />

        <input
          type="text"
          placeholder="Nome da 1ª Loja / Matriz *"
          value={nomeLoja}
          onChange={(e) => setNomeLoja(e.target.value)}
          required
          className={inputClass}
        />

        <input
          type="text"
          placeholder="Código único da rede (ex: grupo-techstock)"
          value={slug}
          onChange={(e) => {
            setSlugEdited(true);
            setSlug(slugifyName(e.target.value));
          }}
          className={`${inputClass} font-mono`}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <input
            type="text"
            placeholder="CNPJ (opcional)"
            value={cnpj}
            onChange={(e) => setCnpj(e.target.value)}
            className={inputClass}
          />
          <input
            type="text"
            placeholder="Telefone (opcional)"
            value={telefone}
            onChange={(e) => setTelefone(e.target.value)}
            className={inputClass}
          />
        </div>

        <input
          type="text"
          placeholder="Seu nome completo (Admin da Rede) *"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          required
          className={inputClass}
        />

        <input
          type="email"
          placeholder="Email do administrador *"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className={inputClass}
        />

        <input
          type="password"
          placeholder="Senha (mín. 6 caracteres) *"
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
          required
          className={inputClass}
        />

        <button
          type="submit"
          disabled={loading}
          className="btn-primary mt-1.5 w-full py-2.5 text-xs font-semibold"
        >
          {loading ? "Criando Organização..." : "Criar Rede e 1ª Loja"}
        </button>
      </form>

      {erro && (
        <div className="mt-3 w-full p-3 rounded-xl border border-accent-red/20 bg-accent-red/10 text-accent-red text-xs text-center">
          {erro}
        </div>
      )}

      {sucesso && (
        <div className="mt-3 w-full p-3 rounded-xl border border-accent-emerald/20 bg-accent-emerald/10 text-accent-emerald text-xs text-center">
          {sucesso}
        </div>
      )}
    </div>
  );
};

export default RegisterForm;
