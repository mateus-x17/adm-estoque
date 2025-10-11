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
    ],
    route: (id) => `http://localhost:5000/produtos/${id}`,
  },
  categoria: {
    fields: [
      { name: "nome", label: "Nome", type: "text", required: true },
    ],
    route: (id) => `http://localhost:5000/categorias/${id}`,
  },
  fornecedor: {
    fields: [
      { name: "nome", label: "Nome", type: "text", required: true },
      { name: "email", label: "Email", type: "email" },
      { name: "telefone", label: "Telefone", type: "text" },
    ],
    route: (id) => `http://localhost:5000/fornecedores/${id}`,
  },
};

function EditarItem({ type = "usuario", itemData, onClose, onItemUpdated }) {
  const { darkMode } = useThemeStore();
  const { token } = useUserStore();

  const config = formConfigs[type];
  const [form, setForm] = useState(
    config.fields.reduce((acc, field) => ({ ...acc, [field.name]: itemData?.[field.name] || "" }), {})
  );

  const [modal, setModal] = useState({ visible: false, mensagem: "", tipo: "" });
  const [closing, setClosing] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const openTimer = setTimeout(() => setOpen(true), 10);
    return () => clearTimeout(openTimer);
  }, []);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleClose = () => { setOpen(false); setClosing(true); };
  const handleTransitionEnd = () => { if(closing) onClose(); };

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
      // mostra o modal primeiro
      setModal({
        visible: true,
        mensagem: `${type[0].toUpperCase() + type.slice(1)} atualizado com sucesso!`,
        tipo: "sucesso",
      });

      // espera 2,5s antes de fechar o modal e o formulário
      timer = setTimeout(() => {
        setModal({ visible: false });
        handleClose(); // fecha o formulário depois do modal
        if (onItemUpdated) onItemUpdated();
      }, 2500);

    } else {
      setModal({
        visible: true,
        mensagem: data.error || "Erro ao atualizar",
        tipo: "erro",
      });
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
          {/* mapeia os compos do formulario de acordo com o tipo */}
          {config.fields.map(field => (
            <div key={field.name}>
              <label className="block mb-1">{field.label}</label>
              {field.type === "select" ? (
                <select
                  name={field.name}
                  value={form[field.name]}
                  onChange={handleChange}
                  required={field.required}
                  className={`w-full p-2 rounded-lg border ${darkMode ? "bg-gray-800 border-gray-700" : "bg-gray-100 border-gray-200"}`}
                >
                  {field.options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
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
          {/* botoes do formulario */}
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
