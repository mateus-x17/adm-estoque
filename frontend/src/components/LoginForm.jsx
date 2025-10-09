import React from "react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {setUser} from '../store/userStore'

const LoginForm = () => {
  // http://localhost:5000/auth/login - rota de login do backend
  const url = "http://localhost:5000/auth/login";

  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");


  const submitForm = async (e) => {
    e.preventDefault();
    const dados = { email, senha };
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
      console.log("resposta do login: ", data);
      if (response.ok) {
        // login bem-sucedido - salvar token e dados no storage e redirecionar para dashboard
        setUser(data.user, data.token);
        alert("Login bem-sucedido:", data.message);
        navigate("/dashboard");
      }
    } catch (error) {
      console.error("Erro ao fazer login:", error);
    }
  };

  return (
    <form className="w-full max-w-sm flex flex-col gap-4 animate-slideUp"
      onSubmit={submitForm}>
      <input
        type="email"
        placeholder="Email"
        value={email}
        required
        onChange={(e) => {
          setEmail(e.target.value);
          // console.log("email: ", e.target.value);
        }}
        className="p-3 rounded-md border border-gray-300 dark:border-gray-600 bg-transparent focus:ring-2 focus:ring-blue-500 outline-none"
      />
      <input
        type="password"
        placeholder="Senha"
        value={senha}
        required
        onChange={(e) => {
          setSenha(e.target.value);
          // console.log("senha: ", e.target.value);
        }}
        className="p-3 rounded-md border border-gray-300 dark:border-gray-600 bg-transparent focus:ring-2 focus:ring-blue-500 outline-none"
      />
      <button
        type="submit"
        className="mt-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-md transition-all duration-300"
      >
        Entrar
      </button>
    </form>
  );
};

export default LoginForm;

// armazenar credenciais no estado
// criar função de login com fetch para a rota /auth/login do backend
// adc no evento onSubmit do form
// redirecionar para dashboard na resposta positiva
// mostrar mensagem de erro na resposta negativa como popup ou texto vermelho abaixo do form