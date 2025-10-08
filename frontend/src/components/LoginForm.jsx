import React from "react";

const LoginForm = () => {
  return (
    <form className="w-full max-w-sm flex flex-col gap-4 animate-slideUp">
      <input
        type="email"
        placeholder="Email"
        className="p-3 rounded-md border border-gray-300 dark:border-gray-600 bg-transparent focus:ring-2 focus:ring-blue-500 outline-none"
      />
      <input
        type="password"
        placeholder="Senha"
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