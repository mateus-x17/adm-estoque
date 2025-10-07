import HeaderHome from "../components/HeaderHome";
import FooterHome from "../components/FooterHome";
import { FiBox, FiBarChart2 } from "react-icons/fi";
import { FaUsers, FaTruck, FaShieldAlt } from "react-icons/fa";
import { MdLayers } from "react-icons/md";
import { HiClipboardList } from "react-icons/hi";
import { Link } from "react-router-dom";

const features = [
  {
    title: "Gestão de Produtos",
    description:
      "Cadastre, edite e controle o estoque com imagens e categorias personalizadas.",
    icon: <FiBox className="w-10 h-10 text-indigo-500" />,
  },
  {
    title: "Controle de Categorias",
    description:
      "Organize produtos em categorias intuitivas para facilitar a navegação e o gerenciamento.",
    icon: <MdLayers className="w-10 h-10 text-green-500" />,
  },
  {
    title: "Gestão de Fornecedores",
    description:
      "Registre e atualize fornecedores, vinculando-os diretamente aos produtos.",
    icon: <FaTruck className="w-10 h-10 text-amber-500" />,
  },
  {
    title: "Movimentações de Estoque",
    description:
      "Registre entradas e saídas de produtos com histórico detalhado por usuário e data.",
    icon: <HiClipboardList className="w-10 h-10 text-blue-500" />,
  },
  {
    title: "Gestão de Usuários",
    description:
      "Controle de acesso seguro via JWT, com níveis ADMIN, GERENTE e OPERADOR.",
    icon: <FaUsers className="w-10 h-10 text-pink-500" />,
  },
  {
    title: "Relatórios e KPIs",
    description:
      "Visualize indicadores-chave e tenha uma visão completa da operação.",
    icon: <FiBarChart2 className="w-10 h-10 text-purple-500" />,
  },
  {
    title: "Interface Responsiva",
    description:
      "Design adaptável, modo claro/escuro e navegação otimizada em qualquer dispositivo.",
    icon: <FaShieldAlt className="w-10 h-10 text-cyan-500" />,
  },
];

const Home = () => {
  return (
    <>
      <HeaderHome />

      {/* Banner com gradiente animado */}
      <section
        className="
          relative w-full h-[60vh] flex flex-col items-center justify-center text-center text-white overflow-hidden 
          bg-gradient-to-r from-indigo-500 via-blue-500 to-green-400 
          bg-[length:400%_400%] animate-gradientShift
        "
      >
        <div className="absolute inset-0 bg-black/30" />
        <h1 className="relative z-10 text-4xl md:text-5xl font-bold drop-shadow-lg animate-fadeInDown">
          Bem-vindo ao <span className="text-yellow-300">Dashboard-ADM</span>
        </h1>
        <p className="relative z-10 text-lg md:text-xl mt-4 max-w-2xl px-4 animate-fadeInUp">
          Gerencie produtos, fornecedores, categorias e usuários de forma moderna,
          eficiente e segura.
        </p>
      </section>

      {/* Sessão de Cards */}
      <main className="w-full bg-gray-100 dark:bg-gray-900 py-16 px-6 min-h-screen">
        <h2 className="text-3xl font-bold text-center mb-10 text-gray-900 dark:text-white animate-fadeInDown">
          Funcionalidades Principais
        </h2>

        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3 max-w-6xl mx-auto">
          {features.map((feature, index) => (
            <div
              key={index}
              className="
                bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 
                hover:-translate-y-2 hover:shadow-2xl hover:dark:shadowDark-lg transition-all duration-300
                animate-fadeIn
              "
              style={{ animationDelay: `${index * 0.1}s`, animationFillMode: "both" }}
            >
              <div className="flex items-center mb-4">{feature.icon}</div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                {feature.title}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                {feature.description}
              </p>
            </div>
          ))}
        </div>

        {/* Chamada final */}
        <div className="mt-16 text-center animate-fadeInUp">
          <h3 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
            Pronto para começar?
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Faça login ou registre-se para acessar todas as funcionalidades.
          </p>
          <div className="flex justify-center gap-4">
            <Link to="/auth" className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-6 rounded-full transition">
              Login / registrar-se
            </Link>
          </div>
        </div>
      </main>

      <FooterHome />
    </>
  );
};

export default Home;
































// import { motion } from "framer-motion";
// import HeaderHome from "../components/HeaderHome";
// import FooterHome from "../components/FooterHome";
// // Importação dos ícones
// import { FiBox, FiBarChart2 } from "react-icons/fi";
// import { FaUsers, FaTruck, FaShieldAlt } from "react-icons/fa";
// import { MdLayers } from "react-icons/md";
// import { HiClipboardList } from "react-icons/hi";
// import {Link} from "react-router-dom"

// const features = [
//   {
//     title: "Gestão de Produtos",
//     description:
//       "Cadastre, edite e controle o estoque com imagens e categorias personalizadas.",
//     icon: <FiBox className="w-10 h-10 text-indigo-500" />,
//   },
//   {
//     title: "Controle de Categorias",
//     description:
//       "Organize produtos em categorias intuitivas para facilitar a navegação e o gerenciamento.",
//     icon: <MdLayers className="w-10 h-10 text-green-500" />,
//   },
//   {
//     title: "Gestão de Fornecedores",
//     description:
//       "Registre e atualize fornecedores, vinculando-os diretamente aos produtos.",
//     icon: <FaTruck className="w-10 h-10 text-amber-500" />,
//   },
//   {
//     title: "Movimentações de Estoque",
//     description:
//       "Registre entradas e saídas de produtos com histórico detalhado por usuário e data.",
//     icon: <HiClipboardList className="w-10 h-10 text-blue-500" />,
//   },
//   {
//     title: "Gestão de Usuários",
//     description:
//       "Controle de acesso seguro via JWT, com níveis ADMIN, GERENTE e OPERADOR.",
//     icon: <FaUsers className="w-10 h-10 text-pink-500" />,
//   },
//   {
//     title: "Relatórios e KPIs",
//     description:
//       "Visualize indicadores-chave e tenha uma visão completa da operação.",
//     icon: <FiBarChart2 className="w-10 h-10 text-purple-500" />,
//   },
//   {
//     title: "Interface Responsiva",
//     description:
//       "Design adaptável, modo claro/escuro e navegação otimizada em qualquer dispositivo.",
//     icon: <FaShieldAlt className="w-10 h-10 text-cyan-500" />,
//   },
// ];

// const Home = () => {
//   return (
//     <>
//       <HeaderHome />

//       {/* Banner com fundo animado */}
//       <motion.section
//         className="relative w-full h-[60vh] flex flex-col items-center justify-center text-center text-white overflow-hidden"
//         animate={{
//           background: [
//             "linear-gradient(135deg, #6366f1, #3b82f6)",
//             "linear-gradient(135deg, #10b981, #14b8a6)",
//             "linear-gradient(135deg, #f59e0b, #ef4444)",
//             "linear-gradient(135deg, #6366f1, #3b82f6)",
//           ],
//         }}
//         transition={{ duration: 10, repeat: Infinity, repeatType: "mirror" }}
//       >
//         <div className="absolute inset-0 bg-black/30" />
//         <motion.h1
//           initial={{ opacity: 0, y: -30 }}
//           animate={{ opacity: 1, y: 0 }}
//           transition={{ duration: 1 }}
//           className="relative z-10 text-4xl md:text-5xl font-bold drop-shadow-lg"
//         >
//           Bem-vindo ao <span className="text-yellow-300">Dashboard-ADM</span>
//         </motion.h1>
//         <motion.p
//           initial={{ opacity: 0, y: 30 }}
//           animate={{ opacity: 1, y: 0 }}
//           transition={{ duration: 1, delay: 0.3 }}
//           className="relative z-10 text-lg md:text-xl mt-4 max-w-2xl px-4"
//         >
//           Gerencie produtos, fornecedores, categorias e usuários de forma moderna,
//           eficiente e segura.
//         </motion.p>
//       </motion.section>

//       {/* Sessão de Cards */}
//       <main className="w-full bg-gray-100 dark:bg-gray-900 py-16 px-6 min-h-screen">
//         <motion.h2
//           initial={{ opacity: 0, y: -20 }}
//           whileInView={{ opacity: 1, y: 0 }}
//           viewport={{ once: true }}
//           transition={{ duration: 0.6 }}
//           className="text-3xl font-bold text-center mb-10 text-gray-900 dark:text-white"
//         >
//           Funcionalidades Principais
//         </motion.h2>

//         <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3 max-w-6xl mx-auto">
//           {features.map((feature, index) => (
//             <motion.div
//               key={index}
//               initial={{ opacity: 0, y: 30 }}
//               whileInView={{ opacity: 1, y: 0 }}
//               transition={{ duration: 0.6, delay: index * 0.1 }}
//               viewport={{ once: true }}
//               className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 hover:-translate-y-2 hover:shadow-2xl transition-all duration-300"
//             >
//               <div className="flex items-center mb-4">{feature.icon}</div>
//               <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
//                 {feature.title}
//               </h3>
//               <p className="text-gray-600 dark:text-gray-400 text-sm">
//                 {feature.description}
//               </p>
//             </motion.div>
//           ))}
//         </div>

//         <motion.div
//           initial={{ opacity: 0, scale: 0.9 }}
//           whileInView={{ opacity: 1, scale: 1 }}
//           transition={{ duration: 0.8, delay: 0.3 }}
//           viewport={{ once: true }}
//           className="mt-16 text-center"
//         >
//           <h3 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
//             Pronto para começar?
//           </h3>
//           <p className="text-gray-600 dark:text-gray-400 mb-6">
//             Faça login ou registre-se para acessar todas as funcionalidades.
//           </p>
//           <div className="flex justify-center gap-4">
//             <Link to="/auth" className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-6 rounded-full transition">
//               inscrever-se
//             </Link>
//           </div>
//         </motion.div>
//       </main>

//       <FooterHome />
//     </>
//   );
// };

// export default Home;
