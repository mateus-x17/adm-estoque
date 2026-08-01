import HeaderHome from "../components/common/HeaderHome.jsx";
import FooterHome from "../components/common/FooterHome.jsx";
import { FiBox, FiBarChart2 } from "react-icons/fi";
import { FaUsers, FaTruck, FaShieldAlt } from "react-icons/fa";
import { MdLayers } from "react-icons/md";
import { HiClipboardList } from "react-icons/hi";
import { Link } from "react-router-dom";

const features = [
  {
    tag: "PROD",
    title: "Gestão de Produtos",
    description: "Cadastre, edite e controle o estoque com imagens e categorias personalizadas.",
    icon: <FiBox className="w-6 h-6" />,
  },
  {
    tag: "CAT",
    title: "Controle de Categorias",
    description: "Organize produtos em categorias intuitivas para facilitar a navegação.",
    icon: <MdLayers className="w-6 h-6" />,
  },
  {
    tag: "FORN",
    title: "Gestão de Fornecedores",
    description: "Registre e atualize fornecedores, vinculando-os diretamente aos produtos.",
    icon: <FaTruck className="w-6 h-6" />,
  },
  {
    tag: "MOV",
    title: "Movimentações de Estoque",
    description: "Registre entradas e saídas com histórico detalhado por usuário e data.",
    icon: <HiClipboardList className="w-6 h-6" />,
  },
  {
    tag: "USR",
    title: "Gestão de Usuários",
    description: "Controle de acesso via JWT, com níveis ADMIN, GERENTE e OPERADOR.",
    icon: <FaUsers className="w-6 h-6" />,
  },
  {
    tag: "REL",
    title: "Relatórios e KPIs",
    description: "Visualize indicadores-chave e tenha uma visão completa da operação.",
    icon: <FiBarChart2 className="w-6 h-6" />,
  },
  {
    tag: "SEG",
    title: "Interface Responsiva",
    description: "Design adaptável, modo claro/escuro e navegação otimizada em qualquer dispositivo.",
    icon: <FaShieldAlt className="w-6 h-6" />,
  },
];

const stockFeed = [
  { sku: "SKU-1042", name: "Parafuso M6", qty: "1.240", status: "Em estoque", tone: "teal" },
  { sku: "SKU-2287", name: "Cabo HDMI 2m", qty: "38", status: "Estoque baixo", tone: "amber" },
  { sku: "SKU-0931", name: "Luva de proteção", qty: "512", status: "Em estoque", tone: "teal" },
  { sku: "SKU-3350", name: "Filtro de ar", qty: "0", status: "Esgotado", tone: "red" },
];

const statusStyle = {
  teal: "text-[var(--teal)] bg-[var(--teal)]/10",
  amber: "text-[var(--accent)] bg-[var(--accent)]/10",
  red: "text-red-400 bg-red-400/10",
};

const Home = () => {
  return (
    <>
      <HeaderHome />

      {/* Hero */}
      <section className="border-b border-[var(--line)] bg-[var(--bg)] transition-colors duration-300">
        <div className="max-w-6xl mx-auto px-6 py-20 lg:py-28 grid lg:grid-cols-2 gap-14 items-center">
          <div className="animate-fade-up">
            <span className="font-mono text-xs tracking-[0.2em] uppercase text-[var(--accent)]">
              Plataforma de gestão de estoque
            </span>
            <h1 className="font-display text-4xl md:text-5xl font-bold tracking-tight text-[var(--ink)] leading-[1.1] mt-4 mb-6">
              Seu estoque, sob controle total.
            </h1>
            <p className="text-base md:text-lg text-[var(--ink-soft)] max-w-md mb-8">
              Produtos, categorias, fornecedores e movimentações — organizados em um só painel,
              com histórico completo de cada operação.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                to="/auth"
                className="rounded-md bg-[var(--ink)] text-[var(--bg)] px-6 py-3 text-sm font-semibold hover:opacity-90 transition-opacity"
              >
                Entrar na plataforma
              </Link>
              <Link
                to="/auth"
                className="rounded-md border border-[var(--line)] px-6 py-3 text-sm font-semibold text-[var(--ink)] hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors duration-200"
              >
                Criar conta
              </Link>
            </div>
          </div>

          {/* Painel de operação — elemento assinatura */}
          <div className="rounded-lg border border-[var(--console-line)] bg-[var(--console-bg)] p-5 shadow-[0_20px_60px_-30px_rgba(0,0,0,0.6)]">
            <div className="flex items-center justify-between mb-4 pb-4 border-b border-[var(--console-line)]">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-[var(--teal)] animate-pulse" />
                <span className="font-mono text-xs uppercase tracking-wider text-[var(--console-text-soft)]">
                  Painel · tempo real
                </span>
              </div>
              <span className="font-mono text-xs text-[var(--console-text-faint)]">#OP-2481</span>
            </div>

            <div>
              {stockFeed.map((item, i) => (
                <div
                  key={item.sku}
                  className={`flex items-center justify-between py-2.5 ${
                    i !== stockFeed.length - 1 ? "border-b border-[var(--console-line)]/60" : ""
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="font-mono text-xs text-[var(--console-text-faint)]">{item.sku}</span>
                    <span className="text-sm text-white/90 truncate">{item.name}</span>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="font-mono text-xs text-white/60">{item.qty}</span>
                    <span className={`rounded px-2 py-0.5 text-[10px] font-mono uppercase ${statusStyle[item.tone]}`}>
                      {item.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Funcionalidades */}
      <section className="bg-[var(--bg)] py-20 px-6 transition-colors duration-300">
        <div className="max-w-6xl mx-auto">
          <div className="mb-12 max-w-xl">
            <span className="font-mono text-xs tracking-[0.2em] uppercase text-[var(--accent)]">
              Módulos do sistema
            </span>
            <h2 className="font-display text-3xl font-bold text-[var(--ink)] mt-3">
              Tudo que a operação precisa, em um lugar.
            </h2>
          </div>

          <div className="grid gap-px sm:grid-cols-2 lg:grid-cols-3 bg-[var(--line)] border border-[var(--line)] rounded-lg overflow-hidden">
            {features.map((feature) => (
              <div
                key={feature.tag}
                className="group bg-[var(--bg)] hover:bg-[var(--bg-elevated)] p-6 transition-colors duration-200"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="text-[var(--ink)]">{feature.icon}</div>
                  <span className="font-mono text-[10px] tracking-wider text-[var(--ink-soft)] border border-[var(--line)] rounded px-1.5 py-0.5 group-hover:border-[var(--accent)] group-hover:text-[var(--accent)] transition-colors duration-200">
                    {feature.tag}
                  </span>
                </div>
                <h3 className="font-display text-base font-semibold text-[var(--ink)] mb-1.5">
                  {feature.title}
                </h3>
                <p className="text-sm text-[var(--ink-soft)] leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA final */}
      <section className="bg-[var(--bg)] px-6 pb-20 transition-colors duration-300">
        <div className="max-w-6xl mx-auto rounded-lg border border-[var(--console-line)] bg-[var(--console-bg)] px-8 py-10 md:px-12 md:py-12 flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <h3 className="font-display text-2xl font-bold text-white mb-2">
              Pronto para organizar seu estoque?
            </h3>
            <p className="text-[var(--console-text-soft)] text-sm max-w-md">
              Entre com sua conta ou crie um novo acesso para começar a gerenciar produtos,
              fornecedores e movimentações agora.
            </p>
          </div>
          <Link
            to="/auth"
            className="shrink-0 rounded-md bg-[var(--accent)] px-6 py-3 text-sm font-semibold text-[#1a1206] hover:opacity-90 transition-opacity"
          >
            Entrar / Criar conta
          </Link>
        </div>
      </section>

      <FooterHome />
    </>
  );
};

export default Home;