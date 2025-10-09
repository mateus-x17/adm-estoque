import React from "react";
import { FaUser } from "react-icons/fa";
import {usuarios} from '../dados.js'

const getRoleColor = (role) => {
  switch (role) {
    case "ADMIN":
      return "bg-purple-500";
    case "GERENTE":
      return "bg-blue-500";
    case "OPERADOR":
      return "bg-green-500";
    default:
      return "bg-gray-500";
  }
};

const getInitials = (name) => {
  const names = name.split(" ");
  const initials = names.map((n) => n[0]).join("");
  return initials.toUpperCase();
};

const Usuarios = () => {
  return (
    <div className="w-full min-h-screen bg-gray-100 dark:bg-gray-900 pb-6 pt-2 px-6 transition-all duration-500">
      {/* Banner */}
    {/* <section className="relative w-full h-[20%] p-3 flex flex-col items-center justify-center text-center text-white overflow-hidden bg-gradient-to-r from-purple-800 via-blue-400 to-green-600 bg-[length:400%_400%] animate-gradientShift mb-12 rounded-xl">
        <div className="absolute inset-0 bg-black/30" />
        <h1 className="relative z-10 text-4xl md:text-5xl font-bold drop-shadow-lg animate-fadeInDown">
        Gerenciamento de <span className="text-yellow-300">Usuários</span>
        </h1>
        <p className="relative z-10 text-lg md:text-xl mt-4 max-w-2xl px-4 animate-fadeInUp">
        Visualize, edite e gerencie todos os usuários cadastrados no sistema.
        </p>
    </section> */}

      {/* Cabeçalho */}
        <header className="w-full h-[20%] pt-10 pb-3 text-center bg-gray-100 dark:bg-gray-900 transition-colors duration-500">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2 animate-fadeInDown">
          Gerenciamento de <span className="text-yellow-300">Usuários</span>
        </h1>
        <p className="text-gray-600 dark:text-gray-400 animate-fadeInUp">
          Visualize, edite e gerencie todos os usuários cadastrados no sistema.
        </p>
      </header>

      {/* Grid de usuários */}
      <div className="max-w-6xl mx-auto grid gap-8 sm:grid-cols-2 lg:grid-cols-3 pt-6 ">
        {usuarios.map((user, index) => (
          <div
            key={user.id}
            className={`
                relative rounded-2xl shadow-lg p-6 text-white transform transition-all duration-[700ms]
                bg-gradient-to-r from-green-900 via-green-700 to-green-500
                dark:from-gray-800 dark:via-gray-700 dark:to-gray-600
                dark:hover:shadowLight-lg
                hover:scale-110
                hover:-translate-y-1 hover:shadow-2xl animate-fadeIn`}
                style={{
                animationDelay: `${index * 0.1}s`,
                animationFillMode: "both",
                }}
                >
                {/* Avatar com hover e tamanho fixo, sem distorção */}
                <div className="flex items-center mb-4">
                    <div className="w-12 h-12 flex-shrink-0 rounded-full overflow-hidden border-2 border-white relative">
                        {user.avatar ? (
                        <img
                            src={user.avatar}
                            alt={user.nome}
                            className="w-full h-full object-cover transform transition-transform duration-300 hover:scale-110"
                        />
                        ) : (
                        <div className="w-full h-full bg-white text-indigo-500 flex items-center justify-center font-bold text-lg transform transition-transform duration-300 hover:scale-110">
                            {getInitials(user.nome)}
                        </div>
                        )}
                    </div>
                    <div className="ml-4 flex-1 min-w-0">
                        {/* min-w-0 permite que o texto quebre dentro do container flex */}
                        <h3 className="text-xl font-bold truncate">{user.nome}</h3>
                        <p className="text-sm truncate">{user.email}</p>
                    </div>
                </div>


                {/* Badge de role */}
                <span
                    className={`inline-block px-2 py-1 rounded-full text-xs font-semibold ${getRoleColor(
                    user.role)}`}>
                    {user.role}
                </span>

                {/* Datas */}
                <p className="mt-2 text-xs">
                    Criado: {user.createdAt.toLocaleDateString()}
                </p>
                <p className="text-xs">
                    Atualizado: {user.updatedAt.toLocaleDateString()}
                </p>

                {/* Botões de ação */}
                <div className="mt-4 flex gap-2">
                <button className="px-3 py-1 bg-indigo-500 hover:bg-indigo-600 text-white rounded transition-colors">
                    Editar
                </button>
                <button className="px-3 py-1 bg-red-500 hover:bg-red-600 text-white rounded transition-colors">
                    Excluir
                </button>
                </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Usuarios;
