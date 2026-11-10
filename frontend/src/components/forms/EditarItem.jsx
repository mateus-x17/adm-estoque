import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useAuthStore } from "../../store/useAuthStore.js";
import ModalMensagem from "../common/ModalMensagem.jsx";
import { formatImageUrl } from "../../utils/imageHelper.js";

// arquivo responsável pelo painel lateral universal de criação e edição de entidades da loja (usuários, produtos, fornecedores, pedidos e perfil)

const formConfigs = {
  usuario: {
    fields: [
      { name: "nome", label: "Nome", type: "text", required: true },
      { name: "email", label: "Email", type: "email", required: true },
      {
        name: "role",
        label: "Função",
        type: "select",
        options: ["ADMIN", "GERENTE", "OPERADOR"],
        required: true,
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
        description: "Seu email usado para login e identificação do usuário.",
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
        description: "Seu email usado para login e identificação do usuário.",
      },
      {
        name: "role",
        label: "Role / Permissão",
        type: "select",
        options: ["ADMIN", "GERENTE", "OPERADOR"],
        required: true,
        description: "Define o nível de permissão do usuário no sistema.",
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
      { name: "senha", label: "Senha", type: "password", required: true },
      {
        name: "role",
        label: "Função",
        type: "select",
        options: ["ADMIN", "GERENTE", "OPERADOR"],
        required: true,
      },
      { name: "imagem", label: "Foto do Usuário", type: "file" },
    ],
    route: `${import.meta.env.VITE_API_BASE_URL}/users`,
  },
  produto: {
    fields: [
      { name: "nome", label: "Nome", type: "text", required: true },
      { name: "preco", label: "Preço", type: "number", required: true },
      {
        name: "quantidade",
        label: "Quantidade",
        type: "number",
        required: true,
      },
      { name: "descricao", label: "Descrição", type: "textarea" },
      {
        name: "categoriaId",
        label: "Categoria",
        type: "select",
        endpoint: "/categories",
        keyName: "categoria",
      },
      {
        name: "fornecedorId",
        label: "Fornecedor",
        type: "select",
        endpoint: "/suppliers",
        keyName: "fornecedores",
      },
      { name: "imagem", label: "Imagem do Produto", type: "file" },
    ],
    route: (id) => `${import.meta.env.VITE_API_BASE_URL}/products/${id}`,
  },
  CriarProduto: {
    fields: [
      { name: "nome", label: "Nome", type: "text", required: true },
      { name: "preco", label: "Preço", type: "number", required: true },
      {
        name: "quantidade",
        label: "Quantidade",
        type: "number",
        required: true,
      },
      { name: "descricao", label: "Descrição", type: "textarea" },
      {
        name: "categoriaId",
        label: "Categoria",
        type: "select",
        endpoint: "/categories",
        keyName: "categoria",
      },
      {
        name: "fornecedorId",
        label: "Fornecedor",
        type: "select",
        endpoint: "/suppliers",
        keyName: "fornecedores",
      },
      { name: "imagem", label: "Imagem do Produto", type: "file" },
    ],
    route: `${import.meta.env.VITE_API_BASE_URL}/products`,
  },
  fornecedor: {
    fields: [
      { name: "nome", label: "Nome", type: "text", required: true },
      { name: "email", label: "Email", type: "email", required: false },
      { name: "telefone", label: "Telefone", type: "text", required: false },
      { name: "endereco", label: "Endereço", type: "text", required: false },
    ],
    route: (id) => `${import.meta.env.VITE_API_BASE_URL}/suppliers/${id}`,
  },
  CriarFornecedor: {
    fields: [
      { name: "nome", label: "Nome", type: "text", required: true },
      { name: "email", label: "Email", type: "email", required: false },
      { name: "telefone", label: "Telefone", type: "text", required: false },
      { name: "endereco", label: "Endereço", type: "text", required: false },
    ],
    route: `${import.meta.env.VITE_API_BASE_URL}/suppliers`,
  },
  CriarPedido: {
    fields: [
      {
        name: "produtoId",
        label: "Produto",
        type: "select",
        endpoint: "/products?limit=100",
        keyName: "data",
        required: true,
      },
      {
        name: "quantidade",
        label: "Quantidade",
        type: "number",
        required: true,
      },
      {
        name: "tipo",
        label: "Tipo",
        type: "select",
        options: [
          { id: "VENDA", nome: "Venda" },
          { id: "REPOSICAO", nome: "Reposição" },
        ],
        required: true,
      },
      { name: "observacao", label: "Observação", type: "textarea" },
    ],
    // Special route handling for this one
    dynamicRoute: (formData) =>
      `${import.meta.env.VITE_API_BASE_URL}/products/${formData.produtoId}/adjust`,
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
        <div className="absolute z-10 w-full mt-2 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.5)] max-h-60 flex flex-col overflow-hidden">
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
              className="px-4 py-2 text-xs text-text-primary hover:bg-white/5 cursor-pointer transition-colors"
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
                  className="px-4 py-2 text-xs text-text-primary hover:bg-white/5 cursor-pointer transition-colors"
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

function EditarItem({ type = "usuario", itemData, onClose, onItemUpdated }) {
  const token = useAuthStore((state) => state.token);
  const config = formConfigs[type];
  const isCreating = type.startsWith("Criar");

  const panelTitle = (() => {
    if (
      !isCreating &&
      (type === "configuracoes" || type === "configuracoesAdmin")
    ) {
      return "Editar Configurações";
    }
    if (isCreating) return `Criar ${type.replace("Criar", "")}`;
    return `Editar ${type}`;
  })();

  const [form, setForm] = useState(
    config.fields.reduce((acc, field) => {
      acc[field.name] = itemData?.[field.name] ?? "";
      return acc;
    }, {}),
  );

  const [file, setFile] = useState(null);
  const [removeImage, setRemoveImage] = useState(false);
  const [modal, setModal] = useState({
    visible: false,
    mensagem: "",
    tipo: "",
  });
  const [open, setOpen] = useState(false);
  const [closing, setClosing] = useState(false);
  const [selectOptions, setSelectOptions] = useState({});

  useEffect(() => {
    config.fields.forEach(async (field) => {
      if (field.type !== "select") return;

      if (field.endpoint) {
        const res = await fetch(
          `${import.meta.env.VITE_API_BASE_URL}${field.endpoint}`,
          {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
          },
        );
        if (!res.ok) return;
        const data = await res.json();
        const list = Array.isArray(data) ? data : data[field.keyName] || [];
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
  }, [token, config.fields]);

  useEffect(() => {
    setTimeout(() => setOpen(true), 10);
  }, []);

  const handleClose = () => {
    setOpen(false);
    setClosing(true);
  };

  // função principal para validar e enviar o formulário (Criação POST ou Atualização PUT) ao backend
  // 1 - Serializa texto e upload opcional usando FormData quando há campo file, ou JSON para entidades textuais/pedidos
  // 2 - Injeta Bearer Token da store Zustand no cabeçalho Authorization
  // 3 - Processa resposta, exibe feedback visual e aciona onItemUpdated após fechamento suave
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const formData = new FormData();
      Object.entries(form).forEach(([key, value]) =>
        formData.append(key, value ?? ""),
      );

      // Anexa foto caso usuário tenha selecionado imagem
      if (file) formData.append("imagem", file);
      // Sinaliza exclusão de foto prévia
      if (removeImage && !file) formData.append("removerImagem", "true");

      const method = isCreating ? "POST" : "PUT";
      let url = isCreating ? config.route : config.route(itemData.id);

      if (config.dynamicRoute) {
        url = config.dynamicRoute(form);
      }

      const hasFileField = config.fields.some((field) => field.type === "file");
      let body;
      const headers = {};

      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      if (type === "CriarPedido") {
        headers["Content-Type"] = "application/json";

        const payload = {
          ...form,
          quantidade: Number(form.quantidade),
        };

        body = JSON.stringify(payload);
      } else if (hasFileField) {
        body = formData;
      } else {
        headers["Content-Type"] = "application/json";
        body = JSON.stringify(form);
      }

      const res = await fetch(url, {
        method,
        headers,
        body,
      });

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
          : responseData.fornecedor ||
            responseData.produto ||
            responseData.usuario ||
            responseData;

      setModal({
        visible: true,
        mensagem: `${type.replace("Criar", "")} ${isCreating ? "criado" : "atualizado"} com sucesso`,
        tipo: "sucesso",
      });

      setTimeout(() => {
        setModal({ visible: false });
        handleClose();
        onItemUpdated && onItemUpdated(updatedItem);
      }, 1500);
    } catch {
      setModal({ visible: true, mensagem: "Erro de conexão", tipo: "erro" });
    }
  };

  return createPortal(
      <div
        className={`fixed inset-0 z-[110] bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${closing ? "opacity-0" : "opacity-100"}`}
        onClick={handleClose}
        onTransitionEnd={() => closing && onClose()}
      >
        <div
          className={`absolute right-0 top-0 h-[100dvh] w-[92%] sm:w-[75%] md:w-[65%] max-w-md transform transition-transform duration-300 ${
            open ? "translate-x-0" : "translate-x-full"
          } bg-[var(--color-bg)] border-l border-[var(--color-border-light)] shadow-[-10px_0_40px_rgba(0,0,0,0.5)] flex flex-col`}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-4 sm:p-6 border-b border-[var(--color-border-light)] shrink-0">
            <h2 className="font-display text-lg font-semibold text-text-primary">
              {panelTitle}
            </h2>
          </div>

          <form
            id="editar-item-form"
            onSubmit={handleSubmit}
            className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-6 space-y-5 custom-scrollbar"
          >
            {config.fields.map((field) => (
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
                    onChange={(val) => setForm({ ...form, [field.name]: val })}
                    placeholder="Selecione..."
                  />
                ) : field.type === "textarea" ? (
                  <textarea
                    name={field.name}
                    rows={4}
                    required={Boolean(field.required)}
                    value={form[field.name]}
                    onChange={(e) => setForm({ ...form, [field.name]: e.target.value })}
                    className="w-full rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border-light)] px-4 py-2 text-xs resize-none text-text-primary focus:border-accent-purple outline-none transition-colors duration-200"
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
                          className="text-xs font-semibold text-accent-red hover:opacity-80 transition-opacity duration-200"
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
                      className="w-full text-xs text-text-secondary file:mr-4 file:py-1.5 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-accent-purple/10 file:text-accent-purple hover:file:bg-accent-purple/20 transition-colors"
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
                    className="w-full rounded-full bg-[var(--color-surface)] border border-[var(--color-border-light)] px-4 py-2 text-xs text-text-primary focus:border-accent-purple outline-none transition-colors duration-200"
                  />
                )}
              </div>
            ))}
          </form>

          <div className="p-4 sm:p-6 border-t border-[var(--color-border-light)] bg-[var(--color-bg)] flex flex-col-reverse sm:flex-row justify-end gap-2.5 sm:gap-3 shrink-0">
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
