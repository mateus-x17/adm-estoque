import React, { useState, useEffect } from "react";
import { useThemeStore } from "../store/useThemeStore";
import { useUserStore } from "../store/userStore";
import ModalMensagem from "./ModalMensagem";

function EditarUsuario({ userData, onClose, onUserUpdated }) {
  const { darkMode } = useThemeStore(); // tema dark/light
  const { token } = useUserStore(); // token do usuário logado

  // Estado do formulário
  const [form, setForm] = useState({
    nome: userData?.nome || "",
    email: userData?.email || "",
    role: userData?.role || "",
  });

  // ESTADO DO MODAL - mensagem e tipo (sucesso/erro)
  const [modal, setModal] = useState({
    visible: false,
    mensagem: "",
    tipo: "",
  });

  // Estado de abertura/fechamento
  const [closing, setClosing] = useState(false);
  const [open, setOpen] = useState(false); // controla animação de entrada

  useEffect(() => {
    // dispara animação de entrada logo após montar o componente
    setTimeout(() => setOpen(true), 10); // delay mínimo para garantir transição
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleClose = () => {
    setOpen(false); // slide para direita
    setClosing(true); // fade do overlay
  };

  const handleTransitionEnd = () => {
    if (closing) onClose();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(
        `http://localhost:5000/users/${userData.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(form),
        }
      );

      const data = await response.json();
      if (response.ok) {
        alert("Dados atualizados com sucesso!");
        // mostra o modal primeiro
        setModal({
          visible: true,
          mensagem: "Usuário atualizado com sucesso!",
          tipo: "sucesso",
        });
        // fecha modal sozinho depois de 2,5s
        setTimeout(() => setModal({ visible: false }), 2500);
        onUserUpdated(); // avisa o componente pai para recarregar a lista
      } else {
        alert("Erro ao atualizar usuário: " + data.error);
        setModal({ visible: true, mensagem: data.error, tipo: "erro" });
      }
    } catch (error) {
      console.error("Erro ao atualizar:", error);
      alert("Erro de conexão com o servidor");
    }
  };

  return (
    <div
      className={`fixed inset-0 flex justify-end items-start transition-opacity duration-300
        ${closing ? "opacity-0" : "opacity-100"}
        bg-black bg-opacity-50`}
      onClick={handleClose}
      onTransitionEnd={handleTransitionEnd}
    >
      <div
        className={`
          w-full max-w-md h-full p-6 shadow-lg border-l rounded-tl-2xl rounded-bl-2xl
          transform transition-transform duration-300
          ${open ? "translate-x-0" : "translate-x-full"}
          ${
            darkMode
              ? "bg-gray-900 text-white border-gray-700"
              : "bg-white text-gray-800 border-gray-200"
          }
        `}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-xl font-bold mb-4">Editar Usuário</h2>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="block mb-1">Nome</label>
            <input
              type="text"
              name="nome"
              value={form.nome}
              onChange={handleChange}
              className={`w-full p-2 rounded-lg border ${
                darkMode
                  ? "bg-gray-800 border-gray-700"
                  : "bg-gray-100 border-gray-200"
              }`}
            />
          </div>

          <div>
            <label className="block mb-1">Email</label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              className={`w-full p-2 rounded-lg border ${
                darkMode
                  ? "bg-gray-800 border-gray-700"
                  : "bg-gray-100 border-gray-200"
              }`}
            />
          </div>
          {/* input de senha */}
          {/* <div>
            <label className="block mb-1">Senha</label>
            <input
              type="password"
              name="senha"
              value={form.senha || ""}
              onChange={handleChange}
              className={`w-full p-2 rounded border ${
                darkMode
                  ? "bg-gray-800 border-gray-600"
                  : "bg-gray-100 border-gray-300"
              }`}
            />
          </div> */}

          <div>
            <label className="block mb-1">Função (role)</label>
            <select
              name="role"
              value={form.role}
              onChange={handleChange}
              className={`w-full p-2 rounded-lg border ${
                darkMode
                  ? "bg-gray-800 border-gray-700"
                  : "bg-gray-100 border-gray-200"
              }`}
            >
              <option value="ADMIN">ADMIN</option>
              <option value="GERENTE">GERENTE</option>
              <option value="OPERADOR">OPERADOR</option>
            </select>
          </div>
          
          {/* botões  */}
          <div className="flex justify-between mt-6">
            <button
              type="button"
              onClick={handleClose}
              className={`px-4 py-2 rounded ${
                darkMode
                  ? "bg-gray-700 hover:bg-gray-600"
                  : "bg-gray-300 hover:bg-gray-200"
              }`}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className={`px-4 py-2 rounded ${
                darkMode
                  ? "bg-blue-600 hover:bg-blue-500 text-white"
                  : "bg-blue-500 hover:bg-blue-400 text-white"
              }`}
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

export default EditarUsuario;
