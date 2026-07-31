import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useAuthStore } from "../../store/useAuthStore.js";
import ModalMensagem from "../common/ModalMensagem.jsx";
import { formatImageUrl } from "../../utils/imageHelper.js";

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
      { name: "email", label: "Email", type: "email", required: true },
      { name: "telefone", label: "Telefone", type: "text", required: true },
      { name: "endereco", label: "Endereço", type: "text", required: true },
    ],
    route: (id) => `${import.meta.env.VITE_API_BASE_URL}/suppliers/${id}`,
  },
  CriarFornecedor: {
    fields: [
      { name: "nome", label: "Nome", type: "text", required: true },
      { name: "email", label: "Email", type: "email", required: true },
      { name: "telefone", label: "Telefone", type: "text", required: true },
      { name: "endereco", label: "Endereço", type: "text", required: true },
    ],
    route: `${import.meta.env.VITE_API_BASE_URL}/suppliers`,
  },
  CriarPedido: {
    fields: [
      {
        name: "produtoId",
        label: "Produto",
        type: "select",
        endpoint: "/products",
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
        options: ["SAIDA", "ENTRADA"],
        required: true,
      },
      { name: "observacao", label: "Observação", type: "textarea" },
    ],
    // Special route handling for this one
    dynamicRoute: (formData) =>
      `${import.meta.env.VITE_API_BASE_URL}/products/${formData.produtoId}/adjust`,
  },
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
      acc[field.name] = itemData?.[field.name] || "";
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
        /////
        console.log("PRODUCTS RESPONSE", data);
        /////
        const list = Array.isArray(data) ? data : data[field.keyName] || [];
        setSelectOptions((prev) => ({ ...prev, [field.name]: list }));
      } else if (field.options) {
        setSelectOptions((prev) => ({
          ...prev,
          [field.name]: field.options.map((opt) => ({ id: opt, nome: opt })),
        }));
      }
    });
  }, [token]);

  useEffect(() => {
    setTimeout(() => setOpen(true), 10);
  }, []);

  const handleClose = () => {
    setOpen(false);
    setClosing(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log("TOKEN", token);

    try {
      const formData = new FormData();
      Object.entries(form).forEach(([key, value]) =>
        formData.append(key, value),
      );
      if (file) formData.append("imagem", file);
      if (removeImage && !file) formData.append("removerImagem", "true");

      const method = isCreating ? "POST" : "PUT";
      let url = isCreating ? config.route : config.route(itemData.id);

      if (config.dynamicRoute) {
        url = config.dynamicRoute(form);
      }

      // Special body handling for adjust-quantity which expects JSON, not FormData usually,
      // but the original code used FormData for everything.
      // The original Pedidos.jsx used JSON. Let's send JSON if it's adjust-quantity or if no file is present?
      // Actually, existing backend likely handles FormData for products/users (w/ images).
      // adjust-quantity might expect JSON. Let's check Pedidos.jsx again in thought.
      // Pedidos.jsx uses JSON.stringify.
      // Let's force JSON for CriarPedido or if no file.
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

      console.log("FORM:", form);
      for (const pair of formData.entries()) {
        console.log(pair[0], pair[1]);
      }

      const res = await fetch(url, {
        method,
        headers,
        body,
      });

      console.log("STATUS:", res.status);
      const responseText = await res.clone().text();
      console.log("RESPONSE:", responseText);

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));

        console.error("BACKEND ERROR:", err);

        setModal({
          visible: true,
          mensagem: err.error || err.message || `Erro ${res.status}`,
          tipo: "erro",
        });

        return;
      }

      // const updatedItem = isCreating
      //   ? await res.json()
      //   : await fetch(config.route(itemData.id), {
      //     headers: token ? { Authorization: `Bearer ${token}` } : {},
      //   }).then((r) => r.json())

      // const updatedItem = await res.json()
      ///////////////////////////////////////
      // const responseData = await res.json()
      // const updatedItem =
      //   responseData.fornecedor ||
      //   responseData.produto ||
      //   responseData.usuario ||
      //   responseData
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
      }, 2000);
    } catch {
      setModal({ visible: true, mensagem: "Erro de conexão", tipo: "erro" });
    }
  };

  return createPortal(
      <div
        className={`fixed inset-0 z-50 bg-black/50 transition-opacity ${closing ? "opacity-0" : "opacity-100"}`}
        onClick={handleClose}
        onTransitionEnd={() => closing && onClose()}
      >
        <div
          className={`absolute right-0 top-0 h-[100dvh] w-[65%] max-w-md transform transition-transform duration-300 ${
            open ? "translate-x-0" : "translate-x-full"
          } bg-[var(--bg-elevated)] border-l border-[var(--line)] shadow-2xl flex flex-col`}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-6 border-b border-[var(--line)] shrink-0">
            <h2 className="font-display text-lg font-semibold text-[var(--ink)]">
              {panelTitle}
            </h2>
          </div>

          <form onSubmit={handleSubmit} className="flex-1 min-h-0 overflow-y-auto p-6 space-y-4">
            {config.fields.map((field) => (
              <div key={field.name}>
                <label className="block text-sm mb-1 text-[var(--ink-soft)]">
                  {field.label}
                </label>
                {field.description ? (
                  <p className="text-xs mb-2 text-[var(--ink-soft)]">{field.description}</p>
                ) : null}

                {field.type === "select" ? (
                  <select
                    name={field.name}
                    value={form[field.name]}
                    onChange={(e) => setForm({ ...form, [field.name]: e.target.value })}
                    className="w-full rounded-md bg-transparent border border-[var(--line)] px-3 py-2 text-sm text-[var(--ink)] focus:border-[var(--accent)] outline-none transition-colors duration-200"
                  >
                    <option value="" className="bg-[var(--bg-elevated)] text-[var(--ink)]">
                      Selecione
                    </option>
                    {selectOptions[field.name]?.map((opt) => (
                      <option
                        key={opt.id}
                        value={opt.id}
                        className="bg-[var(--bg-elevated)] text-[var(--ink)]"
                      >
                        {opt.nome}
                      </option>
                    ))}
                  </select>
                ) : field.type === "textarea" ? (
                  <textarea
                    name={field.name}
                    rows={3}
                    value={form[field.name]}
                    onChange={(e) => setForm({ ...form, [field.name]: e.target.value })}
                    className="w-full rounded-md bg-transparent border border-[var(--line)] px-3 py-2 text-sm resize-none text-[var(--ink)] focus:border-[var(--accent)] outline-none transition-colors duration-200"
                  />
                ) : field.type === "file" ? (
                  <div>
                    {!isCreating && itemData?.imagem && !removeImage && !file ? (
                      <div className="mb-4 flex flex-col items-start gap-2">
                        <p className="text-xs text-[var(--ink-soft)]">Foto atual:</p>
                        <img
                          src={formatImageUrl(itemData.imagem)}
                          alt="Preview"
                          className="w-28 h-28 object-cover rounded-md border border-[var(--line)]"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setRemoveImage(true);
                            setFile(null);
                          }}
                          className="text-sm font-medium text-[var(--danger)] hover:opacity-80 transition-opacity duration-200"
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
                      className="w-full rounded-md bg-transparent border border-[var(--line)] px-3 py-2 text-sm text-[var(--ink)]"
                    />
                  </div>
                ) : (
                  <input
                    type={field.type}
                    name={field.name}
                    value={form[field.name]}
                    onChange={(e) => setForm({ ...form, [field.name]: e.target.value })}
                    className="w-full rounded-md bg-transparent border border-[var(--line)] px-3 py-2 text-sm text-[var(--ink)] focus:border-[var(--accent)] outline-none transition-colors duration-200"
                  />
                )}
              </div>
            ))}
          </form>

          <div className="p-4 border-t border-[var(--line)] flex justify-end gap-3 shrink-0">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-sm rounded-md border border-[var(--line)] text-[var(--ink)] hover:border-[var(--accent)] transition-colors duration-200"
            >
              Cancelar
            </button>
            <button
              type="submit"
              onClick={handleSubmit}
              className="px-4 py-2 text-sm rounded-md bg-[var(--ink)] text-[var(--bg)] font-medium hover:opacity-90 transition-opacity duration-200"
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
