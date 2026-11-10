import React, { useEffect, useMemo, useState } from "react";
import { User, Shield, Store, Building2 } from "lucide-react";
import { useThemeStore } from "../store/useThemeStore.js";
import { usersApi } from "../services/api/users.api.js";
import ModalMensagem from "../components/common/ModalMensagem.jsx";
import EditarItem from "../components/forms/EditarItem.jsx";
import { formatImageUrl } from "../utils/imageHelper.js";

// arquivo responsável pela página de configurações e perfil do usuário dentro da Organização/Loja

const fieldMeta = {
  role: {
    label: "Role / Permissão",
    description: "Define seu nível de acesso na Organização (ADMIN, GERENTE ou OPERADOR).",
  },
  nome: { label: "Nome", description: "Seu nome exibido no sistema." },
  email: { label: "Email", description: "Seu email usado para login e identificação." },
  imagem: { label: "Foto", description: "Foto do usuário exibida na barra lateral e no perfil." },
};

function Configuracoes() {
  const { darkMode } = useThemeStore();

  const [me, setMe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState({ visible: false, mensagem: "", tipo: "erro" });
  const [editOpen, setEditOpen] = useState(false);

  const editType = useMemo(() => {
    if (!me) return "configuracoes";
    return me.role === "ADMIN" ? "configuracoesAdmin" : "configuracoes";
  }, [me]);

  const loadMe = async () => {
    try {
      setLoading(true);
      const data = await usersApi.getMe();
      setMe(data);
    } catch (err) {
      setModal({
        visible: true,
        mensagem: err.message || "Erro de conexão com o servidor",
        tipo: "erro",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
  }, [darkMode]);

  useEffect(() => {
    loadMe();
  }, []);

  return (
    <div className="w-full min-h-screen pt-2 sm:pt-4 pb-12 max-w-7xl mx-auto space-y-6 transition-colors duration-300">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 py-3 sm:py-4 border-b border-[var(--color-border)] mb-6">
        <div>
          <span className="font-mono text-xs tracking-[0.2em] uppercase text-accent-pink">
            Conta #{me?.id || "—"}
          </span>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-text-primary tracking-tight mt-1">
            Configurações
          </h1>
          <p className="text-xs sm:text-sm text-text-secondary mt-1">
            Confira os dados da sua Organização, filial vinculada, cargo RBAC e atualize seu perfil.
          </p>
        </div>
      </header>

      {loading ? (
        <div className="glass-card rounded-2xl p-6 text-sm text-text-secondary text-center">
          Carregando configurações…
        </div>
      ) : (
        me && (
          <>
            <section className="grid gap-6 lg:grid-cols-12">
              <div className="lg:col-span-5 xl:col-span-4 space-y-5">
                <div className="glass-card hover-card rounded-3xl p-5 md:p-7 border border-[var(--color-border)] shadow-sm">
                  <div className="flex items-center gap-4 mb-6">
                    {me.imagem ? (
                      <img
                        src={formatImageUrl(me.imagem)}
                        alt="Foto do usuário"
                        className="w-20 h-20 sm:w-24 sm:h-24 rounded-full object-cover border-4 border-[var(--color-border)] shadow-md shrink-0"
                      />
                    ) : (
                      <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full border-4 border-[var(--color-border)] bg-[var(--color-surface)] text-text-secondary flex items-center justify-center shadow-md shrink-0">
                        <User size={30} strokeWidth={1.5} />
                      </div>
                    )}

                    <div className="min-w-0">
                      <h2 className="font-display text-lg sm:text-xl font-semibold text-text-primary truncate">
                        {me.nome}
                      </h2>
                      <p className="text-xs sm:text-sm text-text-secondary truncate mt-1">
                        {me.email}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col gap-4">
                    <div className="rounded-2xl border border-[var(--color-border-light)] bg-[var(--color-surface)] p-4 sm:p-5">
                      <div className="flex items-center gap-2 text-text-primary mb-2">
                        <Shield className="text-accent-purple" size={16} strokeWidth={1.5} />
                        <p className="text-sm font-semibold">{fieldMeta.role.label}</p>
                      </div>
                      <p className="text-xs text-text-secondary leading-relaxed mb-3">
                        {fieldMeta.role.description}
                      </p>
                      <span className="inline-flex items-center rounded-full border border-accent-purple/30 bg-accent-purple/10 px-3 py-1 font-mono text-[10px] uppercase tracking-wider text-accent-purple">
                        {me.role}
                      </span>
                    </div>

                    {me.organizacao && (
                      <div className="rounded-2xl border border-[var(--color-border-light)] bg-[var(--color-surface)] p-4 sm:p-5 space-y-2">
                        <div className="flex items-center gap-2 text-text-primary">
                          <Building2 className="text-accent-purple" size={16} strokeWidth={1.5} />
                          <p className="text-sm font-semibold">Organização / Rede</p>
                        </div>
                        <p className="text-sm font-semibold text-text-primary truncate">
                          {me.organizacao.nome}
                        </p>
                        <p className="font-mono text-xs text-text-secondary truncate">
                          Slug: @{me.organizacao.slug}
                        </p>
                      </div>
                    )}

                    <div className="rounded-2xl border border-[var(--color-border-light)] bg-[var(--color-surface)] p-4 sm:p-5 space-y-1.5">
                      <div className="flex items-center gap-2 text-text-primary">
                        <Store className="text-accent-pink" size={16} strokeWidth={1.5} />
                        <p className="text-sm font-semibold">Unidade / Filial</p>
                      </div>
                      <p className="text-sm font-semibold text-text-primary truncate">
                        {me.role === "ADMIN"
                          ? "Acesso Global (Todas as Lojas da Rede)"
                          : me.loja?.nome || "Não vinculada"}
                      </p>
                      {me.loja?.slug && (
                        <p className="font-mono text-xs text-text-secondary truncate">
                          @{me.loja.slug}
                        </p>
                      )}
                    </div>

                    <button
                      onClick={() => setEditOpen(true)}
                      className="btn-primary w-full py-3 mt-1 text-xs sm:text-sm font-semibold"
                    >
                      Editar Perfil
                    </button>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-7 xl:col-span-8">
                <div className="glass-card hover-card rounded-3xl p-5 md:p-8 border border-[var(--color-border)] shadow-sm h-full">
                  <h3 className="font-display text-lg font-semibold text-text-primary">
                    Informações da conta
                  </h3>
                  <p className="mt-2 text-xs sm:text-sm text-text-secondary">
                    Confira seus dados atuais. Use o botão Editar Perfil para atualizá-los.
                  </p>

                  <div className="mt-6 sm:mt-8 grid gap-4 sm:gap-6 md:grid-cols-2">
                    <div className="rounded-2xl border border-[var(--color-border-light)] bg-[var(--color-surface)] p-5">
                      <p className="text-sm font-semibold text-text-primary mb-1">
                        {fieldMeta.nome.label}
                      </p>
                      <p className="text-xs text-text-secondary mb-4">{fieldMeta.nome.description}</p>
                      <p className="text-sm font-medium text-text-primary break-all bg-[var(--color-bg)] px-4 py-2 rounded-lg border border-[var(--color-border-light)]">
                        {me.nome}
                      </p>
                    </div>

                    <div className="rounded-2xl border border-[var(--color-border-light)] bg-[var(--color-surface)] p-5">
                      <p className="text-sm font-semibold text-text-primary mb-1">
                        {fieldMeta.email.label}
                      </p>
                      <p className="text-xs text-text-secondary mb-4">{fieldMeta.email.description}</p>
                      <p className="text-sm font-medium text-text-primary break-all bg-[var(--color-bg)] px-4 py-2 rounded-lg border border-[var(--color-border-light)]">
                        {me.email}
                      </p>
                    </div>

                    <div className="rounded-2xl border border-[var(--color-border-light)] bg-[var(--color-surface)] p-5 md:col-span-2">
                      <p className="text-sm font-semibold text-text-primary mb-1">
                        {fieldMeta.imagem.label}
                      </p>
                      <p className="text-xs text-text-secondary mb-4">
                        {fieldMeta.imagem.description}
                      </p>
                      <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 bg-[var(--color-bg)] px-4 sm:px-5 py-3 rounded-xl border border-[var(--color-border-light)] w-full sm:w-fit">
                        <span
                          className={`inline-flex items-center rounded-full px-3 py-1 font-mono text-[10px] uppercase tracking-wider w-fit ${
                            me.imagem
                              ? "bg-accent-green/10 text-accent-green border border-accent-green/20"
                              : "bg-[var(--color-surface)] text-text-secondary border border-[var(--color-border-light)]"
                          }`}
                        >
                          {me.imagem ? "Disponível" : "Não cadastrada"}
                        </span>
                        <span className="text-xs text-text-secondary">
                          (Você pode alterar através do formulário)
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {editOpen && (
              <EditarItem
                type={editType}
                itemData={me}
                onClose={() => setEditOpen(false)}
                onItemUpdated={loadMe}
              />
            )}
          </>
        )
      )}

      {modal.visible && (
        <ModalMensagem
          mensagem={modal.mensagem}
          tipo={modal.tipo}
          onClose={() => setModal({ visible: false, mensagem: "", tipo: "erro" })}
        />
      )}
    </div>
  );
}

export default Configuracoes;
