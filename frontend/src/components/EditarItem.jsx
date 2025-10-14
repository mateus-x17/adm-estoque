import React, { useState, useEffect } from "react";
import { useThemeStore } from "../store/useThemeStore";
import { useUserStore } from "../store/userStore";
import ModalMensagem from "./ModalMensagem.jsx";

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
      {
        name: "imagem",
        label: "Foto do Usuário",
        type: "file",
        required: false,
      },
    ],
    route: (id) => `http://localhost:5000/users/${id}`,
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
      {
        name: "imagem",
        label: "Foto do Usuário",
        type: "file",
        required: false,
      },
    ],
    route: "http://localhost:5000/users",
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
      {
        name: "descricao",
        label: "Descrição",
        type: "textarea",
        required: false,
      },
      {
        name: "categoriaId",
        label: "Categoria",
        type: "select",
        endpoint: "/categories",
        keyName: "categoria",
        required: false,
      },
      {
        name: "fornecedorId",
        label: "Fornecedor",
        type: "select",
        endpoint: "/suppliers",
        keyName: "fornecedores",
        required: false,
      },
      {
        name: "imagem",
        label: "Imagem do Produto",
        type: "file",
        required: false,
      },
    ],
    route: (id) => `http://localhost:5000/products/${id}`,
  },
   CriarProduto: {
    fields: [
      { name: "nome", label: "Nome", type: "text", required: true },
      { name: "preco", label: "Preço", type: "number", required: true },
      { name: "quantidade", label: "Quantidade", type: "number", required: true },
      { name: "descricao", label: "Descrição", type: "textarea", required: false },
      {
        name: "categoriaId",
        label: "Categoria",
        type: "select",
        endpoint: "/categories",
        keyName: "categoria",
        required: false,
      },
      {
        name: "fornecedorId",
        label: "Fornecedor",
        type: "select",
        endpoint: "/suppliers",
        keyName: "fornecedores",
        required: false,
      },
      { name: "imagem", label: "Imagem do Produto", type: "file", required: false },
    ],
    route: "http://localhost:5000/products",
  }
};

function EditarItem({ type = "usuario", itemData, onClose, onItemUpdated }) {
  const { darkMode } = useThemeStore();
  const { token } = useUserStore();
  const config = formConfigs[type];

  const isCreating = type.startsWith("Criar");

  const [form, setForm] = useState(
    config.fields.reduce((acc, field) => {
      acc[field.name] = itemData?.[field.name] || "";
      return acc;
    }, {})
  );
  const [file, setFile] = useState(null);
  const [modal, setModal] = useState({ visible: false, mensagem: "", tipo: "" });
  const [closing, setClosing] = useState(false);
  const [open, setOpen] = useState(false);
  const [selectOptions, setSelectOptions] = useState({});

  // Carregar opções de selects
  useEffect(() => {
    config.fields.forEach(async (field) => {
      if (field.type === "select") {
        if (field.endpoint) {
          try {
            const res = await fetch(`http://localhost:5000${field.endpoint}`, {
              headers: token ? { Authorization: `Bearer ${token}` } : {},
            });
            if (!res.ok) return;
            const data = await res.json();
            const list = Array.isArray(data) ? data : data[field.keyName] || [];
            if (Array.isArray(list)) {
              setSelectOptions((prev) => ({ ...prev, [field.name]: list }));
            }
          } catch (err) {
            console.error(`Erro ao carregar ${field.name}:`, err);
          }
        } else if (field.options) {
          const list = field.options.map((opt) => ({ id: opt, nome: opt }));
          setSelectOptions((prev) => ({ ...prev, [field.name]: list }));
        }
      }
    });
  }, [token]);

  useEffect(() => {
    const openTimer = setTimeout(() => setOpen(true), 10);
    return () => clearTimeout(openTimer);
  }, []);

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });
  const handleClose = () => {
    setOpen(false);
    setClosing(true);
  };
  const handleTransitionEnd = () => {
    if (closing) onClose();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    let timer;

    try {
      const formData = new FormData();
      Object.keys(form).forEach((key) => formData.append(key, form[key]));
      if (file) formData.append("imagem", file);

      const method = isCreating ? "POST" : "PUT";
      const url = isCreating ? config.route : config.route(itemData.id);

      const response = await fetch(url, {
        method,
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        setModal({ visible: true, mensagem: errorData?.error || "Erro ao atualizar", tipo: "erro" });
        timer = setTimeout(() => setModal({ visible: false }), 2500);
        return;
      }

      let updatedItem;
      if (isCreating) {
        updatedItem = await response.json();
      } else {
        const itemResponse = await fetch(config.route(itemData.id), {
          method: "GET",
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        updatedItem = await itemResponse.json();
      }

      setModal({
        visible: true,
        mensagem: `${type.replace(/^Criar/, "")} ${isCreating ? "criado" : "atualizado"} com sucesso!`,
        tipo: "sucesso",
      });

      timer = setTimeout(() => {
        setModal({ visible: false });
        handleClose();
        if (onItemUpdated) onItemUpdated(updatedItem);
      }, 2500);
    } catch (err) {
      setModal({ visible: true, mensagem: "Erro de conexão com o servidor", tipo: "erro" });
      console.error("Erro ao atualizar item:", err);
      timer = setTimeout(() => setModal({ visible: false }), 2500);
    }

    return () => clearTimeout(timer);
  };

  return (
    <div
      className={`fixed inset-0 z-[9999] flex justify-end items-start transition-opacity duration-300 ${
        closing ? "opacity-0" : "opacity-100"
      } bg-black bg-opacity-50`}
      onClick={handleClose}
      onTransitionEnd={handleTransitionEnd}
    >
      <div
        className={`w-[70%] max-w-md h-full p-6 shadow-lg border-l rounded-tl-2xl rounded-bl-2xl transform transition-transform duration-300 ${
          open ? "translate-x-0" : "translate-x-full"
        } ${darkMode ? "bg-gray-900 text-white border-gray-700" : "bg-white text-gray-800 border-gray-200"} flex flex-col`}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-xl font-bold mb-4 flex-shrink-0">
          {isCreating ? `Criar ${type.replace("Criar", "")}` : `Editar ${type}`}
        </h2>

        <form className="space-y-4 flex-1 overflow-auto pr-2" onSubmit={handleSubmit}>
          {config.fields.map((field) => (
            <div key={field.name}>
              <label className="block mb-1">{field.label}</label>
              {field.type === "select" ? (
                <select
                  name={field.name}
                  value={form[field.name]}
                  onChange={handleChange}
                  required={field.required}
                  className={`w-full px-3 py-2 rounded-md border ${
                    darkMode ? "bg-gray-800 border-gray-700 text-white" : "bg-gray-100 border-gray-200 text-gray-800"
                  }`}
                >
                  <option value="">Selecione</option>
                  {selectOptions[field.name]?.map((opt) => (
                    <option key={opt.id} value={opt.id}>
                      {opt.nome}
                    </option>
                  ))}
                </select>
              ) : field.type === "file" ? (
                <input
                  type="file"
                  name={field.name}
                  accept="image/*"
                  onChange={(e) => setFile(e.target.files[0])}
                  className={`w-full px-3 py-2 rounded-md border ${
                    darkMode ? "bg-gray-800 border-gray-700 text-white" : "bg-gray-100 border-gray-200 text-gray-800"
                  }`}
                />
              ) : field.type === "textarea" ? (
                <textarea
                  name={field.name}
                  value={form[field.name]}
                  onChange={handleChange}
                  required={field.required}
                  rows={3}
                  className={`w-full px-3 py-2 rounded-md border resize-none ${
                    darkMode ? "bg-gray-800 border-gray-700 text-white" : "bg-gray-100 border-gray-200 text-gray-800"
                  }`}
                />
              ) : (
                <input
                  type={field.type}
                  name={field.name}
                  value={form[field.name]}
                  onChange={handleChange}
                  required={field.required}
                  className={`w-full px-3 py-2 rounded-md border ${
                    darkMode ? "bg-gray-800 border-gray-700 text-white" : "bg-gray-100 border-gray-200 text-gray-800"
                  }`}
                />
              )}
            </div>
          ))}

          <div className="flex justify-between mt-6 flex-shrink-0">
            <button
              type="button"
              onClick={handleClose}
              className={`px-4 py-2 rounded ${darkMode ? "bg-gray-700 hover:bg-gray-600" : "bg-gray-300 hover:bg-gray-200"}`}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className={`px-4 py-2 rounded ${darkMode ? "bg-blue-600 hover:bg-blue-500 text-white" : "bg-blue-500 hover:bg-blue-400 text-white"}`}
            >
              Salvar
            </button>
          </div>
        </form>

        {modal.visible && (
          <ModalMensagem
            mensagem={modal.mensagem}
            tipo={modal.tipo}
            onClose={() => setModal({ visible: false })}
          />
        )}
      </div>
    </div>
  );
}

export default EditarItem;
