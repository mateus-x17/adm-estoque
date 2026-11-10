import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useUserStore } from "../../store/userStore.js";
import { useAuthStore } from "../../store/useAuthStore.js";
import { authApi } from "../../services/api/index.js";

// arquivo responsável pelo cadastro público de novo estabelecimento (tenant) e seu administrador fundador

const inputClass =
  "w-full px-4 py-2 rounded-full border border-[var(--color-border-light)] bg-[var(--color-surface)] text-xs text-text-primary placeholder:text-text-secondary focus:border-accent-purple outline-none transition-colors duration-200";

// função auxiliar para transformar o nome comercial da loja em um slug URL-safe amigável
// 1 - Normaliza acentos e converte para letras minúsculas
// 2 - Substitui espaços por hífens e remove símbolos inválidos
function slugifyStoreName(value) {
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
  const navigate = useNavigate();

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

  // função para atualizar o nome da loja e sincronizar o slug automaticamente caso ainda não editado à mão
  const handleStoreNameChange = (e) => {
    const val = e.target.value;
    setNomeLoja(val);
    if (!slugEdited) {
      setSlug(slugifyStoreName(val));
    }
  };

  // função para enviar os dados de abertura da loja e efetuar login automático no novo ambiente isolado
  // 1 - Valida comprimento mínimo de senha (6 caracteres) no cliente
  // 2 - Chama authApi.register criando Empresa + Usuário ADMIN fundador em transação no servidor
  // 3 - Salva token JWT e usuário na store Zustand e redireciona para o dashboard da nova loja
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
        nomeLoja: nomeLoja.trim(),
        slug: slug.trim() || undefined,
        cnpj: cnpj.trim() || undefined,
        telefone: telefone.trim() || undefined,
        nome: nome.trim(),
        email: email.trim(),
        senha,
      });

      setSucesso("Loja criada com sucesso! Preparando seu ambiente...");

      if (data.token && data.user) {
        setUser(data.user);
        setToken(data.token);
        setTimeout(() => navigate("/dashboard"), 1000);
      }
    } catch (error) {
      console.error("Erro ao cadastrar estabelecimento:", error);
      setErro(error.message || "Não foi possível cadastrar a loja.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-sm">
      <form className="w-full flex flex-col gap-2.5 animate-fade-up" onSubmit={submitForm}>
        <input
          type="text"
          placeholder="Nome da loja / estabelecimento *"
          value={nomeLoja}
          onChange={handleStoreNameChange}
          required
          className={inputClass}
        />

        <input
          type="text"
          placeholder="Código único da loja (ex: minha-loja)"
          value={slug}
          onChange={(e) => {
            setSlugEdited(true);
            setSlug(slugifyStoreName(e.target.value));
          }}
          className={`${inputClass} font-mono`}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
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
          placeholder="Seu nome completo (Admin) *"
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
          className="btn-primary mt-2 w-full py-2.5 text-xs font-semibold"
        >
          {loading ? "Criando loja..." : "Criar Loja e Acessar"}
        </button>
      </form>

      {erro && (
        <div className="mt-3 w-full p-3 rounded-xl border border-accent-red/20 bg-accent-red/10 text-accent-red text-xs text-center">
          {erro}
        </div>
      )}

      {sucesso && (
        <div className="mt-3 w-full p-3 rounded-xl border border-accent-green/20 bg-accent-green/10 text-accent-green text-xs text-center">
          {sucesso}
        </div>
      )}
    </div>
  );
};

export default RegisterForm;
