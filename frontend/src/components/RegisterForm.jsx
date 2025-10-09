import React from "react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useUserStore } from "../store/userStore";

const RegisterForm = () => {
  const url = "http://localhost:5000/auth/register";
  const { setUser } = useUserStore();

  const navigate = useNavigate();
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");

  const submitForm = async (e) => {
    e.preventDefault();
    const dados = { nome, email, senha };
    console.log("dados do form: ", dados);
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(dados),
      });
      const data = await response.json();
      console.log("resposta do registro: ", data);
      if (response.ok) {
        // login bem-sucedido - salvar token e dados no storage e redirecionar para dashboard
        // setUser(data.usuario.user, data.usuario.token);
        alert("registro de usuario bem-sucedido: faça login", data.message);
      }
    } catch (error) {
      console.error("Erro ao fazer login:", error);
    }
  };


  return (
    <form className="w-full max-w-sm flex flex-col gap-4 animate-slideUp"
      onSubmit={submitForm}>
      <input
        type="text"
        onChange={(e) => setNome(e.target.value)}
        required
        placeholder="Nome completo"
        className="p-3 rounded-md border border-gray-300 dark:border-gray-600 bg-transparent focus:ring-2 focus:ring-indigo-500 outline-none"
      />
      <input
        type="email"
        placeholder="Email"
        onChange={(e) => setEmail(e.target.value)}
        required
        className="p-3 rounded-md border border-gray-300 dark:border-gray-600 bg-transparent focus:ring-2 focus:ring-indigo-500 outline-none"
      />
      <input
        type="password"
        placeholder="Senha"
        onChange={(e) => setSenha(e.target.value)}
        required
        className="p-3 rounded-md border border-gray-300 dark:border-gray-600 bg-transparent focus:ring-2 focus:ring-indigo-500 outline-none"
      />
      <button
        type="submit"
        className="mt-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 rounded-md transition-all duration-300"
      >
        Registrar
      </button>
    </form>
  );
};

export default RegisterForm;