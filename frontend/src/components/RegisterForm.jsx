import React from "react";

const RegisterForm = () => {
  return (
    <form className="w-full max-w-sm flex flex-col gap-4 animate-slideUp">
      <input
        type="text"
        placeholder="Nome completo"
        className="p-3 rounded-md border border-gray-300 dark:border-gray-600 bg-transparent focus:ring-2 focus:ring-indigo-500 outline-none"
      />
      <input
        type="email"
        placeholder="Email"
        className="p-3 rounded-md border border-gray-300 dark:border-gray-600 bg-transparent focus:ring-2 focus:ring-indigo-500 outline-none"
      />
      <input
        type="password"
        placeholder="Senha"
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
