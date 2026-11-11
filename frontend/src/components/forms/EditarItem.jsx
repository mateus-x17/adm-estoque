import React, { useState, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import { useAuthStore } from "../../store/useAuthStore.js";
import { useUserStore } from "../../store/userStore.js";
import { useTenantStore } from "../../store/useTenantStore.js";
import ModalMensagem from "../common/ModalMensagem.jsx";
import { formatImageUrl } from "../../utils/imageHelper.js";

// arquivo responsável pelo painel lateral de criação e edição de entidades respeitando Organização e Loja alvo

const SITUATION_OPTIONS = [
  { id: "ATIVO", nome: "Contratado (Atuando)" },
  { id: "SUSPENSO", nome: "Suspenso" },
  { id: "FERIAS", nome: "Em Férias" },
];

const baseConfigs = {
  usuario: {
    fields: [
      { name: "nome", label: "Nome", type: "text", required: true },
      { name: "email", label: "Email", type: "email", required: true },
      { name: "telefone", label: "Telefone", type: "tel", description: "Contato profissional ou pessoal (ex: (11) 99999-9999)." },
      {
        name: "role",
        label: "Função",
        type: "select",
        options: ["ADMIN", "GERENTE", "OPERADOR"],
        required: true,
      },
      {
        name: "situacao",
        label: "Situação Funcional",
        type: "select",
        options: SITUATION_OPTIONS,
        required: true,
        description: "Colaboradores suspensos ou em férias têm o acesso temporariamente bloqueado.",
      },
      {
        name: "dataAdmissao",
        label: "Data de Admissão",
        type: "date",
        description: "Data de início utilizada nos relatórios trabalhistas e históricos de vendas.",
      },
      {
        name: "lojaId",
        label: "Loja / Filial de Atuação",
        type: "select",
        endpoint: "/stores?status=ativos",
        hideWhen: (f) => f.role === "ADMIN",
        description: "Administradores acessam todas as lojas; Gerentes e Operadores atuam na filial escolhida.",
      },
      { name: "imagem", label: "Foto do Usuário", type: "file" },
    ],
    route: (id) => `${import.meta.env.VITE_API_BASE_URL}/users/${id}`,
  },
  configuracoes: {
    fields: [
      {
        name: "nome",
        label: "Nome",
        type: "text",
        required: true,
        description: "Seu nome exibido no sistema.",
      },
      {
        name: "email",
        label: "Email",
        type: "email",
        required: true,
        description: "Seu email usado para login.",
      },
      {
        name: "telefone",
        label: "Telefone",
        type: "tel",
        description: "Seu telefone de contato cadastrado.",
      },
      {
        name: "imagem",
        label: "Foto",
        type: "file",
        description: "Upload de foto do usuário (JPG, PNG ou WEBP).",
      },
    ],
    route: () => `${import.meta.env.VITE_API_BASE_URL}/users/me`,
  },
  configuracoesAdmin: {
    fields: [
      {
        name: "nome",
        label: "Nome",
        type: "text",
        required: true,
        description: "Seu nome exibido no sistema.",
      },
      {
        name: "email",
        label: "Email",
        type: "email",
        required: true,
        description: "Seu email usado para login.",
      },
      {
        name: "telefone",
        label: "Telefone",
        type: "tel",
        description: "Seu telefone de contato cadastrado.",
      },
      {
        name: "role",
        label: "Role / Permissão",
        type: "select",
        options: ["ADMIN", "GERENTE", "OPERADOR"],
        required: true,
        description: "Define o nível de permissão do usuário na Organização.",
      },
      {
        name: "imagem",
        label: "Foto",
        type: "file",
        description: "Upload de foto do usuário (JPG, PNG ou WEBP).",
      },
    ],
    route: () => `${import.meta.env.VITE_API_BASE_URL}/users/me`,
  },
  CriarUsuario: {
    fields: [
      { name: "nome", label: "Nome", type: "text", required: true },
      { name: "email", label: "Email", type: "email", required: true },
      { name: "telefone", label: "Telefone", type: "tel" },
      { name: "senha", label: "Senha", type: "password", required: true },
      {
        name: "role",
        label: "Função",
        type: "select",
        options: ["ADMIN", "GERENTE", "OPERADOR"],
        required: true,
      },
      {
        name: "situacao",
        label: "Situação Funcional",
        type: "select",
        options: SITUATION_OPTIONS,
        required: true,
      },
      { name: "dataAdmissao", label: "Data de Admissão", type: "date" },
      {
        name: "lojaId",
        label: "Loja / Filial de Atuação",
        type: "select",
        endpoint: "/stores?status=ativos",
        hideWhen: (f) => f.role === "ADMIN",
      },
      { name: "imagem", label: "Foto do Usuário", type: "file" },
    ],
    route: `${import.meta.env.VITE_API_BASE_URL}/users`,
  },
  produto: {
    fields: [
      { name: "nome", label: "Nome", type: "text", required: true },
      { name: "preco", label: "Preço", type: "number", required: true },
      { name: "quantidade", label: "Quantidade", type: "number", required: true },
      { name: "descricao", label: "Descrição", type: "textarea" },
      { name: "categoriaId", label: "Categoria", type: "select", endpoint: "/categories", keyName: "categoria" },
      { name: "fornecedorId", label: "Fornecedor", type: "select", endpoint: "/suppliers", keyName: "fornecedores" },
      { name: "imagem", label: "Imagem do Produto", type: "file" },
    ],
    route: (id) => `${import.meta.env.VITE_API_BASE_URL}/products/${id}`,
  },
  CriarProduto: {
    fields: [
      { name: "nome", label: "Nome", type: "text", required: true },
      { name: "preco", label: "Preço", type: "number", required: true },
      { name: "quantidade", label: "Quantidade", type: "number", required: true },
      { name: "descricao", label: "Descrição", type: "textarea" },
      { name: "categoriaId", label: "Categoria", type: "select", endpoint: "/categories", keyName: "categoria" },
      { name: "fornecedorId", label: "Fornecedor", type: "select", endpoint: "/suppliers", keyName: "fornecedores" },
      { name: "imagem", label: "Imagem do Produto", type: "file" },
    ],
    route: `${import.meta.env.VITE_API_BASE_URL}/products`,
  },
  fornecedor: {
    fields: [
      { name: "nome", label: "Nome", type: "text", required: true },
      { name: "email", label: "Email", type: "email" },
      { name: "telefone", label: "Telefone", type: "text" },
      { name: "endereco", label: "Endereço", type: "text" },
    ],
    route: (id) => `${import.meta.env.VITE_API_BASE_URL}/suppliers/${id}`,
  },
  CriarFornecedor: {
    fields: [
      { name: "nome", label: "Nome", type: "text", required: true },
      { name: "email", label: "Email", type: "email" },
      { name: "telefone", label: "Telefone", type: "text" },
      { name: "endereco", label: "Endereço", type: "text" },
    ],
    route: `${import.meta.env.VITE_API_BASE_URL}/suppliers`,
  },
};

const SearchableSelect = ({ options, value, onChange, placeholder = "Selecione..." }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const filteredOptions = (options || []).filter((opt) =>
    opt.nome?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedOption = (options || []).find((opt) => String(opt.id) === String(value));

  return (
    <div className="relative">
      <div
        className="w-full rounded-full bg-[var(--color-surface)] border border-[var(--color-border-light)] px-4 py-2 text-xs text-text-primary cursor-pointer flex justify-between items-center transition-colors hover:border-accent-purple/50"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className={selectedOption ? "" : "text-text-secondary"}>
          {selectedOption ? selectedOption.nome : placeholder}
        </span>
        <span className="text-text-secondary text-xs">▼</span>
      </div>
      {isOpen && (
        <div className="absolute z-20 w-full mt-2 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.5)] max-h-60 flex flex-col overflow-hidden">
          <div className="p-2 border-b border-[var(--color-border)] sticky top-0 bg-[var(--color-surface)]">
            <input
              type="text"
              className="w-full rounded-full bg-[var(--color-bg)] border border-[var(--color-border-light)] px-4 py-2 text-xs text-text-primary focus:border-accent-purple outline-none transition-colors"
              placeholder="Buscar..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onClick={(e) => e.stopPropagation()}
            />
          </div>
          <div className="overflow-y-auto py-1 bg-[var(--color-surface)]">
            <div
              className="px-4 py-2 text-xs text-text-primary hover:bg-white/5 cursor-pointer"
              onClick={() => {
                onChange("");
                setIsOpen(false);
                setSearchTerm("");
              }}
            >
              Nenhum
            </div>
            {filteredOptions.length > 0 ? (
              filteredOptions.map((opt) => (
                <div
                  key={opt.id}
                  className="px-4 py-2 text-xs text-text-primary hover:bg-white/5 cursor-pointer"
                  onClick={() => {
                    onChange(opt.id);
                    setIsOpen(false);
                    setSearchTerm("");
                  }}
                >
                  {opt.nome}
                </div>
              ))
            ) : (
              <div className="px-4 py-2 text-xs text-text-secondary">Nenhum resultado</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// função responsável por renderizar o drawer lateral de criação e edição dinâmica de entidades.
//
// 1 - recebe type (string), itemData (object opcional), onClose (function) e onItemUpdated (function).
// 2 - carrega opções dinâmicas de selects conforme a filial selecionada e controla estado e upload de imagem.
// 3 - retorna o painel lateral via createPortal ajustado com espaçamento compacto para zoom 100%.
function EditarItem({ type = "usuario", itemData, onClose, onItemUpdated }) {
  const token = useAuthStore((state) => state.token);
  const currentUser = useUserStore((state) => state.user);
  const { stores, selectedLojaId } = useTenantStore();

  const isCreating = type.startsWith("Criar");
  const isAdmin = currentUser?.role === "ADMIN";

  // Para ADMIN criando produto ou fornecedor, injeta campo obrigatório de loja no topo
  const config = useMemo(() => {
    const raw = baseConfigs[type];
    if (!raw) return baseConfigs.usuario;
    if (isAdmin && (type === "CriarProduto" || type === "CriarFornecedor")) {
      return {
        ...raw,
        fields: [
          {
            name: "lojaId",
            label: "Filial / Loja Destino",
            type: "select",
            endpoint: "/stores?status=ativos",
            required: true,
          },
          ...raw.fields,
        ],
      };
    }
    return raw;
  }, [type, isAdmin]);

  const panelTitle = (() => {
    if (!isCreating && (type === "configuracoes" || type === "configuracoesAdmin")) {
      return "Editar Configurações";
    }
    if (isCreating) return `Criar ${type.replace("Criar", "")}`;
    return `Editar ${type}`;
  })();

  const [form, setForm] = useState(() => {
    const initial = config.fields.reduce((acc, field) => {
      const raw = itemData?.[field.name];
      if (field.type === "date" && raw) {
        acc[field.name] = String(raw).slice(0, 10);
      } else {
        acc[field.name] = raw ?? "";
      }
      return acc;
    }, {});

    if (isAdmin && isCreating && !initial.lojaId && (type === "CriarProduto" || type === "CriarFornecedor" || type === "CriarUsuario")) {
      if (selectedLojaId && selectedLojaId !== "all") {
        initial.lojaId = String(selectedLojaId);
      } else if (stores.length > 0) {
        initial.lojaId = String(stores[0].id);
      }
    }
    if (type === "CriarUsuario") {
      if (!initial.role) initial.role = "OPERADOR";
      if (!initial.situacao) initial.situacao = "ATIVO";
      if (!initial.dataAdmissao) initial.dataAdmissao = new Date().toISOString().slice(0, 10);
    }
    if (type === "usuario" && !initial.situacao) {
      initial.situacao = "ATIVO";
    }
    return initial;
  });

  const [file, setFile] = useState(null);
  const [removeImage, setRemoveImage] = useState(false);
  const [modal, setModal] = useState({ visible: false, mensagem: "", tipo: "" });
  const [open, setOpen] = useState(false);
  const [closing, setClosing] = useState(false);
  const [selectOptions, setSelectOptions] = useState({});

  const effectiveLojaHeader =
    form.lojaId ||
    itemData?.lojaId ||
    (selectedLojaId && selectedLojaId !== "all" ? selectedLojaId : "");

  useEffect(() => {
    config.fields.forEach(async (field) => {
      if (field.type !== "select") return;

      if (field.endpoint) {
        const headers = {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          ...(effectiveLojaHeader && field.endpoint !== "/stores?status=ativos"
            ? { "X-Loja-Id": String(effectiveLojaHeader) }
            : {}),
        };
        const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}${field.endpoint}`, {
          headers,
        });
        if (!res.ok) return;
        const data = await res.json();
        const list = Array.isArray(data) ? data : data[field.keyName] || data.data || [];
        setSelectOptions((prev) => ({ ...prev, [field.name]: list }));
      } else if (field.options) {
        setSelectOptions((prev) => ({
          ...prev,
          [field.name]: field.options.map((opt) =>
            typeof opt === "object" && opt !== null ? opt : { id: opt, nome: opt }
          ),
        }));
      }
    });
  }, [token, config.fields, effectiveLojaHeader]);

  useEffect(() => {
    setTimeout(() => setOpen(true), 10);
  }, []);

  const handleClose = () => {
    setOpen(false);
    setClosing(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      Object.entries(form).forEach(([key, value]) => formData.append(key, value ?? ""));
      if (file) formData.append("imagem", file);
      if (removeImage && !file) formData.append("removerImagem", "true");

      const method = isCreating ? "POST" : "PUT";
      let url = isCreating ? config.route : config.route(itemData.id);
      if (config.dynamicRoute) url = config.dynamicRoute(form);

      const hasFileField = config.fields.some((field) => field.type === "file");
      const headers = {};
      if (token) headers.Authorization = `Bearer ${token}`;
      if (effectiveLojaHeader) headers["X-Loja-Id"] = String(effectiveLojaHeader);

      let body;
      if (hasFileField) {
        body = formData;
      } else {
        headers["Content-Type"] = "application/json";
        body = JSON.stringify(form);
      }

      const res = await fetch(url, { method, headers, body });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        setModal({
          visible: true,
          mensagem: err.error || err.message || `Erro ${res.status}`,
          tipo: "erro",
        });
        return;
      }

      const responseData = await res.json();
      const updatedItem =
        responseData.id !== undefined
          ? responseData
          : responseData.fornecedor || responseData.produto || responseData.usuario || responseData;

      setModal({
        visible: true,
        mensagem: `${type.replace("Criar", "")} ${isCreating ? "criado" : "atualizado"} com sucesso`,
        tipo: "sucesso",
      });

      setTimeout(() => {
        setModal({ visible: false });
        handleClose();
        onItemUpdated && onItemUpdated(updatedItem);
      }, 1200);
    } catch {
      setModal({ visible: true, mensagem: "Erro de conexão", tipo: "erro" });
    }
  };

  return createPortal(
    <div
      className={`fixed inset-0 z-[110] bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${
        closing ? "opacity-0" : "opacity-100"
      }`}
      onClick={handleClose}
      onTransitionEnd={() => closing && onClose()}
    >
      <div
        className={`absolute right-0 top-0 h-[100dvh] w-[92%] sm:w-[75%] md:w-[65%] max-w-md transform transition-transform duration-300 ${
          open ? "translate-x-0" : "translate-x-full"
        } bg-[var(--color-bg)] border-l border-[var(--color-border-light)] shadow-[-10px_0_40px_rgba(0,0,0,0.5)] flex flex-col`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-3.5 sm:px-5 sm:py-4 border-b border-[var(--color-border-light)] shrink-0 flex items-center justify-between gap-2">
          <h2 className="font-display text-base sm:text-lg font-semibold text-text-primary">{panelTitle}</h2>
          {!isCreating && type === "usuario" && (itemData?.matricula || itemData?.id) && (
            <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-accent-purple/15 text-accent-purple border border-accent-purple/30">
              {itemData.matricula || `MAT-${String(itemData.id).padStart(5, "0")}`}
            </span>
          )}
        </div>

        <form
          id="editar-item-form"
          onSubmit={handleSubmit}
          className="flex-1 min-h-0 overflow-y-auto p-4 sm:px-5 space-y-3.5 custom-scrollbar"
        >
          {config.fields.map((field) => {
            if (field.hideWhen && field.hideWhen(form)) return null;

            return (
              <div key={field.name}>
                <label className="block text-sm font-medium mb-1.5 text-text-primary">
                  {field.label}
                  {field.required ? <span className="text-accent-pink ml-1">*</span> : null}
                </label>
                {field.description ? (
                  <p className="text-xs mb-3 text-text-secondary">{field.description}</p>
                ) : null}

                {field.type === "select" ? (
                  <SearchableSelect
                    options={selectOptions[field.name]}
                    value={form[field.name]}
                    onChange={(val) => {
                      if (field.name === "lojaId" && (type === "CriarProduto" || type === "produto")) {
                        setForm({ ...form, lojaId: val, categoriaId: "", fornecedorId: "" });
                      } else {
                        setForm({ ...form, [field.name]: val });
                      }
                    }}
                    placeholder="Selecione..."
                  />
                ) : field.type === "textarea" ? (
                  <textarea
                    name={field.name}
                    rows={4}
                    required={Boolean(field.required)}
                    value={form[field.name]}
                    onChange={(e) => setForm({ ...form, [field.name]: e.target.value })}
                    className="w-full rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border-light)] px-4 py-2 text-xs resize-none text-text-primary focus:border-accent-purple outline-none"
                  />
                ) : field.type === "file" ? (
                  <div className="p-4 rounded-xl border border-[var(--color-border-light)] bg-white/5">
                    {!isCreating && itemData?.imagem && !removeImage && !file ? (
                      <div className="mb-4 flex flex-col items-start gap-3">
                        <p className="text-xs font-medium text-text-secondary">Foto atual:</p>
                        <img
                          src={formatImageUrl(itemData.imagem)}
                          alt="Preview"
                          className="w-24 h-24 object-cover rounded-full border-2 border-[var(--color-border)]"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setRemoveImage(true);
                            setFile(null);
                          }}
                          className="text-xs font-semibold text-accent-red hover:opacity-80"
                        >
                          Remover foto
                        </button>
                      </div>
                    ) : null}
                    <input
                      type="file"
                      onChange={(e) => {
                        setFile(e.target.files[0]);
                        setRemoveImage(false);
                      }}
                      className="w-full text-xs text-text-secondary file:mr-4 file:py-1.5 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-accent-purple/10 file:text-accent-purple"
                    />
                  </div>
                ) : (
                  <input
                    type={field.type}
                    name={field.name}
                    step={field.type === "number" && field.name === "preco" ? "0.01" : undefined}
                    required={Boolean(field.required)}
                    value={form[field.name]}
                    onChange={(e) => setForm({ ...form, [field.name]: e.target.value })}
                    className="w-full rounded-full bg-[var(--color-surface)] border border-[var(--color-border-light)] px-4 py-2 text-xs text-text-primary focus:border-accent-purple outline-none"
                  />
                )}
              </div>
            );
          })}
        </form>

        <div className="p-3.5 sm:px-5 sm:py-3.5 border-t border-[var(--color-border-light)] bg-[var(--color-bg)] flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-2.5 shrink-0">
          <button
            type="button"
            onClick={handleClose}
            className="btn-secondary px-4 py-2 text-xs font-semibold w-full sm:w-auto"
          >
            Cancelar
          </button>
          <button
            type="submit"
            form="editar-item-form"
            className="btn-primary px-4 py-2 text-xs font-semibold w-full sm:w-auto"
          >
            Salvar
          </button>
        </div>

        {modal.visible && (
          <ModalMensagem
            mensagem={modal.mensagem}
            tipo={modal.tipo}
            onClose={() => setModal({ visible: false })}
          />
        )}
      </div>
    </div>,
    document.body
  );
}

export default EditarItem;
