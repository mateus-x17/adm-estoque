import React, { useEffect, useMemo, useState } from "react";
import { FaUser, FaShieldAlt } from "react-icons/fa";
import { useThemeStore } from "../store/useThemeStore.js";
import { usersApi } from "../services/api/users.api.js";
import ModalMensagem from "../components/common/ModalMensagem.jsx";
import EditarItem from "../components/forms/EditarItem.jsx";

const fieldMeta = {
  role: {
    label: "Role / Permissão",
    description:
      "Define o nível de permissão do usuário no sistema (ADMIN, GERENTE ou OPERADOR).",
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

  const [modal, setModal] = useState({
    visible: false,
    mensagem: "",
    tipo: "erro",
  });

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
    if (darkMode) document.documentElement.classList.add("dark");
    else document.documentElement.classList.remove("dark");
  }, [darkMode]);

  useEffect(() => {
    loadMe();
  }, []);

  return (
    <div className="w-full min-h-screen pt-6 pb-12 px-4 md:px-10 max-w-screen-2xl mx-auto space-y-6">
      <header>
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white">
          Configurações
        </h1>
        <p className="text-slate-500 dark:text-slate-400">
          Atualize seus dados de conta e gerencie suas preferências.
        </p>
      </header>

      {loading ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/50 rounded-3xl p-6 text-slate-700 dark:text-slate-200">
          Carregando…
        </div>
      ) : (
        me && (
          <>
            <section className="grid gap-6 lg:grid-cols-12">
              {/* Coluna: resumo do usuário */}
              <div className="lg:col-span-5 xl:col-span-4">
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/50 rounded-3xl p-6">
                  <div className="flex items-center gap-4">
                    {me.imagem ? (
                      <img
                        src={`http://localhost:5000${me.imagem}`}
                        alt="Foto do usuário"
                        className="w-20 h-20 rounded-2xl object-cover border border-slate-200 dark:border-slate-700"
                      />
                    ) : (
                      <div className="w-20 h-20 rounded-2xl bg-indigo-600/10 text-indigo-600 border border-indigo-600/20 flex items-center justify-center">
                        <FaUser size={28} />
                      </div>
                    )}

                    <div className="min-w-0">
                      <h2 className="text-xl font-extrabold text-slate-900 dark:text-slate-100 truncate">
                        {me.nome}
                      </h2>
                      <p className="text-sm text-slate-600 dark:text-slate-300 truncate">
                        {me.email}
                      </p>
                    </div>
                  </div>

                  <div className="mt-6 flex flex-col gap-3">
                    <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 p-4">
                      <div className="flex items-center gap-2 text-slate-900 dark:text-slate-100">
                        <FaShieldAlt className="text-indigo-600 dark:text-indigo-400" />
                        <p className="text-sm font-semibold">{fieldMeta.role.label}</p>
                      </div>
                      <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">
                        {fieldMeta.role.description}
                      </p>
                      <p className="mt-3 inline-flex items-center rounded-xl bg-indigo-600/10 dark:bg-indigo-500/15 px-3 py-1 text-sm font-semibold text-indigo-700 dark:text-indigo-300">
                        {me.role}
                      </p>
                    </div>

                    <button
                      onClick={() => setEditOpen(true)}
                      className="w-full px-5 py-2.5 bg-indigo-600 text-white rounded-2xl font-semibold hover:bg-indigo-700 transition"
                    >
                      Editar
                    </button>
                  </div>
                </div>
              </div>

              {/* Coluna: informações detalhadas */}
              <div className="lg:col-span-7 xl:col-span-8">
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/50 rounded-3xl p-6">
                  <h3 className="text-lg font-extrabold text-slate-900 dark:text-slate-100">
                    Informações da conta
                  </h3>
                  <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                    Confira seus dados atuais. Use o botão editar para atualizá-los.
                  </p>

                  <div className="mt-6 grid gap-4 md:grid-cols-2">
                    <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 p-5">
                      <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                        {fieldMeta.nome.label}
                      </p>
                      <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">
                        {fieldMeta.nome.description}
                      </p>
                      <p className="mt-4 text-sm font-semibold text-slate-900 dark:text-slate-100 break-words">
                        {me.nome}
                      </p>
                    </div>

                    <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 p-5">
                      <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                        {fieldMeta.email.label}
                      </p>
                      <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">
                        {fieldMeta.email.description}
                      </p>
                      <p className="mt-4 text-sm font-semibold text-slate-900 dark:text-slate-100 break-words">
                        {me.email}
                      </p>
                    </div>

                    <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 p-5 md:col-span-2">
                      <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                        {fieldMeta.imagem.label}
                      </p>
                      <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">
                        {fieldMeta.imagem.description}
                      </p>
                      <div className="mt-4 flex items-center gap-3">
                        <span
                          className={`inline-flex items-center rounded-xl px-3 py-1 text-sm font-semibold ${
                            me.imagem
                              ? "bg-emerald-600/10 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                              : "bg-slate-400/10 dark:bg-slate-500/15 text-slate-700 dark:text-slate-200"
                          }`}
                        >
                          {me.imagem ? "Disponível" : "Não cadastrada"}
                        </span>
                        <span className="text-xs text-slate-600 dark:text-slate-300">
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
          onClose={() =>
            setModal({
              visible: false,
              mensagem: "",
              tipo: "erro",
            })
          }
        />
      )}
    </div>
  );
}

export default Configuracoes;

