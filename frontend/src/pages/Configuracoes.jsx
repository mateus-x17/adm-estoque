import React, { useEffect, useMemo, useState } from "react";
import { FaUser, FaShieldAlt } from "react-icons/fa";
import { useThemeStore } from "../store/useThemeStore.js";
import { usersApi } from "../services/api/users.api.js";
import ModalMensagem from "../components/common/ModalMensagem.jsx";
import EditarItem from "../components/forms/EditarItem.jsx";
import { formatImageUrl } from "../utils/imageHelper.js";

const fieldMeta = {
  role: {
    label: "Role / Permissão",
    description: "Define o nível de permissão do usuário no sistema (ADMIN, GERENTE ou OPERADOR).",
  },
  nome: {
    label: "Nome",
    description: "Seu nome exibido no sistema.",
  },
  email: {
    label: "Email",
    description: "Seu email usado para login e identificação do usuário.",
  },
  imagem: {
    label: "Foto",
    description: "Foto do usuário exibida na sidebar e nesta página.",
  },
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
    <div className="w-full min-h-screen pt-6 pb-12 px-4 md:px-10 max-w-screen-2xl mx-auto space-y-6">
      <header>
        <span className="font-mono text-xs tracking-[0.2em] uppercase text-[var(--accent)]">
          Conta
        </span>
        <h1 className="font-display text-3xl font-bold text-[var(--ink)] mt-1">
          Configurações
        </h1>
        <p className="text-sm text-[var(--ink-soft)] mt-1">
          Atualize seus dados de conta e gerencie suas preferências.
        </p>
      </header>

      {loading ? (
        <div className="glass-panel rounded-lg p-6 text-sm text-[var(--ink-soft)]">
          Carregando…
        </div>
      ) : (
        me && (
          <>
            <section className="grid gap-6 lg:grid-cols-12">
              {/* Resumo do usuário */}
              <div className="lg:col-span-5 xl:col-span-4">
                <div className="glass-panel rounded-lg p-6">
                  <div className="flex items-center gap-4">
                    {me.imagem ? (
                      <img
                        src={formatImageUrl(me.imagem)}
                        alt="Foto do usuário"
                        className="w-20 h-20 rounded-lg object-cover border border-[var(--line)]"
                      />
                    ) : (
                      <div className="w-20 h-20 rounded-lg border border-[var(--line)] text-[var(--ink-soft)] flex items-center justify-center">
                        <FaUser size={26} />
                      </div>
                    )}

                    <div className="min-w-0">
                      <h2 className="font-display text-lg font-semibold text-[var(--ink)] truncate">
                        {me.nome}
                      </h2>
                      <p className="text-sm text-[var(--ink-soft)] truncate">{me.email}</p>
                    </div>
                  </div>

                  <div className="mt-6 flex flex-col gap-3">
                    <div className="rounded-lg border border-[var(--line)] p-4">
                      <div className="flex items-center gap-2 text-[var(--ink)]">
                        <FaShieldAlt className="text-[var(--accent)]" size={14} />
                        <p className="text-sm font-medium">{fieldMeta.role.label}</p>
                      </div>
                      <p className="mt-1 text-xs text-[var(--ink-soft)]">
                        {fieldMeta.role.description}
                      </p>
                      <p className="mt-3 inline-flex items-center rounded-md border border-[var(--accent)]/30 px-2.5 py-1 font-mono text-xs uppercase text-[var(--accent)]">
                        {me.role}
                      </p>
                    </div>

                    <button
                      onClick={() => setEditOpen(true)}
                      className="w-full px-5 py-2.5 bg-[var(--ink)] text-[var(--bg)] rounded-md font-semibold text-sm hover:opacity-90 transition-opacity duration-200"
                    >
                      Editar
                    </button>
                  </div>
                </div>
              </div>

              {/* Informações detalhadas */}
              <div className="lg:col-span-7 xl:col-span-8">
                <div className="glass-panel rounded-lg p-6">
                  <h3 className="font-display text-base font-semibold text-[var(--ink)]">
                    Informações da conta
                  </h3>
                  <p className="mt-1 text-sm text-[var(--ink-soft)]">
                    Confira seus dados atuais. Use o botão editar para atualizá-los.
                  </p>

                  <div className="mt-6 grid gap-4 md:grid-cols-2">
                    <div className="rounded-lg border border-[var(--line)] p-5">
                      <p className="text-sm font-medium text-[var(--ink)]">
                        {fieldMeta.nome.label}
                      </p>
                      <p className="mt-1 text-xs text-[var(--ink-soft)]">
                        {fieldMeta.nome.description}
                      </p>
                      <p className="mt-4 text-sm font-medium text-[var(--ink)] break-words">
                        {me.nome}
                      </p>
                    </div>

                    <div className="rounded-lg border border-[var(--line)] p-5">
                      <p className="text-sm font-medium text-[var(--ink)]">
                        {fieldMeta.email.label}
                      </p>
                      <p className="mt-1 text-xs text-[var(--ink-soft)]">
                        {fieldMeta.email.description}
                      </p>
                      <p className="mt-4 text-sm font-medium text-[var(--ink)] break-words">
                        {me.email}
                      </p>
                    </div>

                    <div className="rounded-lg border border-[var(--line)] p-5 md:col-span-2">
                      <p className="text-sm font-medium text-[var(--ink)]">
                        {fieldMeta.imagem.label}
                      </p>
                      <p className="mt-1 text-xs text-[var(--ink-soft)]">
                        {fieldMeta.imagem.description}
                      </p>
                      <div className="mt-4 flex items-center gap-3">
                        <span
                          className={`inline-flex items-center rounded-md border px-2.5 py-1 font-mono text-xs uppercase ${
                            me.imagem
                              ? "border-[var(--teal)]/30 text-[var(--teal)]"
                              : "border-[var(--line)] text-[var(--ink-soft)]"
                          }`}
                        >
                          {me.imagem ? "Disponível" : "Não cadastrada"}
                        </span>
                        <span className="text-xs text-[var(--ink-soft)]">
                          (Você pode trocar no formulário de edição)
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