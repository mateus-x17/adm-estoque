import React, { useState, useEffect } from "react";
import { useThemeStore } from "../store/useThemeStore";
import { useUserStore } from "../store/userStore";
import ModalMensagem from "./ModalMensagem.jsx";

const formConfigs = {
  usuario: {
    fields: [
      { name: "nome", label: "Nome", type: "text", required: true },
      { name: "email", label: "Email", type: "email", required: true },
      { name: "role", label: "Função", type: "select", options: ["ADMIN","GERENTE","OPERADOR"], required: true },
    ],
    route: (id) => `http://localhost:5000/users/${id}`,
  },
  produto: {
    fields: [
      { name: "nome", label: "Nome", type: "text", required: true },
      { name: "preco", label: "Preço", type: "number", required: true },
      { name: "quantidade", label: "Quantidade", type: "number", required: true },
      { name: "descricao", label: "Descrição", type: "text", required: false, multiline: true },
      { name: "categoriaId", label: "Categoria", type: "select", endpoint: "/categories", required: false },
      { name: "fornecedorId", label: "Fornecedor", type: "select", endpoint: "/suppliers", required: false },
    ],
    route: (id) => `http://localhost:5000/products/${id}`,
  },
  categoria: {
    fields: [
      { name: "nome", label: "Nome", type: "text", required: true },
    ],
    route: (id) => `http://localhost:5000/categories/${id}`,
  },
  fornecedor: {
    fields: [
      { name: "nome", label: "Nome", type: "text", required: true },
      { name: "email", label: "Email", type: "email" },
      { name: "telefone", label: "Telefone", type: "text" },
    ],
    route: (id) => `http://localhost:5000/suppliers/${id}`,
  },
};

function EditarItem({ type = "usuario", itemData, onClose, onItemUpdated }) {
  const { darkMode } = useThemeStore();
  const { token } = useUserStore();
  const config = formConfigs[type];

  const [form, setForm] = useState(
    config.fields.reduce((acc, field) => {
      if (field.name === "categoriaId" && itemData?.categoria?.id) acc[field.name] = itemData.categoria.id;
      else if (field.name === "fornecedorId" && itemData?.fornecedor?.id) acc[field.name] = itemData.fornecedor.id;
      else acc[field.name] = itemData?.[field.name] || "";
      return acc;
    }, {})
  );

  const [options, setOptions] = useState({});
  const [modal, setModal] = useState({ visible: false, mensagem: "", tipo: "" });
  const [closing, setClosing] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const openTimer = setTimeout(() => setOpen(true), 10);
    return () => clearTimeout(openTimer);
  }, []);

  // Fetch de opções para selects (categorias e fornecedores)
  useEffect(() => {
    const fetchOptions = async () => {
      const opts = {};
      for (let field of config.fields) {
        if (field.type === "select" && field.endpoint) {
          try {
            const res = await fetch(`http://localhost:5000${field.endpoint}`, {
              headers: token ? { Authorization: `Bearer ${token}` } : {},
            });

            // Ler como texto e tentar parsear JSON
            const text = await res.text();
            let data;
            try {
              data = JSON.parse(text);
            } catch (err) {
              console.error(`Erro ao interpretar JSON de ${field.name}:`, text);
              opts[field.name] = [];
              continue;
            }

            // Diferencia categorias x fornecedores
            if (field.endpoint === "/categories") {
              opts[field.name] = Array.isArray(data) ? data : [];
            } else {
              // fornecedores retorna { fornecedores: [...] }
              opts[field.name] = data.fornecedores || [];
            }

            // Define valor inicial caso ainda não tenha
            if (!form[field.name] && itemData?.[field.name]) {
              setForm(prev => ({ ...prev, [field.name]: itemData[field.name] }));
            }
          } catch (err) {
            console.error(`Erro ao buscar ${field.name}:`, err);
            opts[field.name] = [];
          }
        }
      }
      setOptions(opts);
    };

    fetchOptions();
  }, [config.fields, itemData, token]);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleClose = () => { setOpen(false); setClosing(true); };
  const handleTransitionEnd = () => { if (closing) onClose(); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    let timer;
    try {
      const response = await fetch(config.route(itemData.id), {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(form),
      });

      const data = await response.json();

      if (response.ok) {
        setModal({ visible: true, mensagem: `${type[0].toUpperCase() + type.slice(1)} atualizado com sucesso!`, tipo: "sucesso" });
        timer = setTimeout(() => {
          setModal({ visible: false });
          handleClose();
          if (onItemUpdated) onItemUpdated();
        }, 2500);
      } else {
        setModal({ visible: true, mensagem: data.error || "Erro ao atualizar", tipo: "erro" });
        timer = setTimeout(() => setModal({ visible: false }), 2500);
      }
    } catch (err) {
      console.error(err);
      setModal({ visible: true, mensagem: "Erro de conexão com o servidor", tipo: "erro" });
      timer = setTimeout(() => setModal({ visible: false }), 2500);
    }

    return () => clearTimeout(timer);
  };

  return (
    <div className={`fixed inset-0 flex justify-end items-start transition-opacity duration-300 ${closing ? "opacity-0" : "opacity-100"} bg-black bg-opacity-50`}
         onClick={handleClose} onTransitionEnd={handleTransitionEnd}>
      <div className={`w-full max-w-md h-full p-6 shadow-lg border-l rounded-tl-2xl rounded-bl-2xl transform transition-transform duration-300 ${open ? "translate-x-0" : "translate-x-full"} ${darkMode ? "bg-gray-900 text-white border-gray-700" : "bg-white text-gray-800 border-gray-200"}`}
           onClick={e => e.stopPropagation()}>
        <h2 className="text-xl font-bold mb-4">Editar {type[0].toUpperCase() + type.slice(1)}</h2>
        <form className="space-y-4" onSubmit={handleSubmit}>
          {config.fields.map(field => (
            <div key={field.name}>
              <label className="block mb-1">{field.label}</label>
              {field.type === "select" ? (
                <select
                  name={field.name}
                  value={form[field.name] || ""}
                  onChange={handleChange}
                  required={field.required}
                  className={`w-full p-2 rounded-lg border ${darkMode ? "bg-gray-800 border-gray-700" : "bg-gray-100 border-gray-200"}`}
                >
                  <option value="">Selecione</option>
                  {(options[field.name] || []).map(opt => (
                    <option key={opt.id} value={opt.id}>{opt.nome}</option>
                  ))}
                </select>
              ) : (
                <input
                  type={field.type}
                  name={field.name}
                  value={form[field.name]}
                  onChange={handleChange}
                  required={field.required}
                  className={`w-full p-2 rounded-lg border ${darkMode ? "bg-gray-800 border-gray-700" : "bg-gray-100 border-gray-200"}`}
                />
              )}
            </div>
          ))}
          <div className="flex justify-between mt-6">
            <button type="button" onClick={handleClose} className={`px-4 py-2 rounded ${darkMode ? "bg-gray-700 hover:bg-gray-600" : "bg-gray-300 hover:bg-gray-200"}`}>Cancelar</button>
            <button type="submit" className={`px-4 py-2 rounded ${darkMode ? "bg-blue-600 hover:bg-blue-500 text-white" : "bg-blue-500 hover:bg-blue-400 text-white"}`}>Salvar</button>
          </div>
        </form>
        {modal.visible && <ModalMensagem mensagem={modal.mensagem} tipo={modal.tipo} onClose={() => setModal({ visible: false })} />}
      </div>
    </div>
  );
}

export default EditarItem;
