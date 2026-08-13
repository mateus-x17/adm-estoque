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
  teal: "text-accent-green bg-accent-green/10 border border-accent-green/20",
  amber: "text-accent-yellow bg-accent-yellow/10 border border-accent-yellow/20",
  red: "text-accent-red bg-accent-red/10 border border-accent-red/20",
};

const Home = () => {
  return (
    <>
      <HeaderHome />

      {/* Hero */}
      <section className="relative border-b border-[var(--color-border)] bg-background transition-colors duration-300 overflow-hidden">
        {/* Gradients */}
        <div className="absolute top-[-20%] left-[20%] w-[50%] h-[50%] bg-accent-purple/20 rounded-full blur-[150px] pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[10%] w-[40%] h-[40%] bg-accent-pink/10 rounded-full blur-[150px] pointer-events-none" />

        <div className="relative max-w-6xl mx-auto px-6 py-20 lg:py-28 grid lg:grid-cols-2 gap-14 items-center z-10">
          <div className="animate-fade-up">
            <span className="inline-block font-mono text-xs tracking-[0.2em] uppercase text-accent-pink bg-accent-pink/10 px-3 py-1 rounded-full mb-6 border border-accent-pink/20">
              Plataforma de gestão de estoque
            </span>
            <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-text-primary leading-[1.1] mb-6">
              Seu estoque,<br />sob <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent-purple to-accent-pink">controle total.</span>
            </h1>
            <p className="text-base md:text-lg text-text-secondary max-w-md mb-8 leading-relaxed">
              Produtos, categorias, fornecedores e movimentações — organizados em um só painel
              com estética premium e usabilidade incomparável.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link
                to="/auth"
                className="btn-primary px-8 py-3.5 text-sm"
              >
                Entrar na plataforma
              </Link>
              <Link
                to="/auth"
                className="btn-secondary px-8 py-3.5 text-sm"
              >
                Criar conta
              </Link>
            </div>
          </div>

          {/* Painel de operação — elemento assinatura */}
          <div className="glass-card border border-[var(--color-border)] p-6 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.5)] rounded-3xl relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />
            
            <div className="relative flex items-center justify-between mb-6 pb-5 border-b border-[var(--color-border)]">
              <div className="flex items-center gap-3">
                <span className="h-2.5 w-2.5 rounded-full bg-accent-green shadow-[0_0_10px_var(--color-accent-green)] animate-pulse" />
                <span className="font-mono text-xs uppercase tracking-wider text-text-secondary">
                  Painel · tempo real
                </span>
              </div>
              <span className="font-mono text-xs text-text-secondary bg-[var(--color-surface)] px-2 py-1 rounded-md border border-[var(--color-border-light)]">#OP-2481</span>
            </div>

            <div className="relative space-y-1">
              {stockFeed.map((item, i) => (
                <div
                  key={item.sku}
                  className={`flex items-center justify-between p-3 rounded-xl hover:bg-white/5 transition-colors ${
                    i !== stockFeed.length - 1 ? "border-b border-[var(--color-border-light)]" : ""
                  }`}
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <span className="font-mono text-xs text-text-secondary w-20">{item.sku}</span>
                    <span className="text-sm font-medium text-text-primary truncate">{item.name}</span>
                  </div>
                  <div className="flex items-center gap-4 shrink-0">
                    <span className="font-mono text-xs text-text-secondary text-right w-12">{item.qty}</span>
                    <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-mono uppercase tracking-wide w-28 text-center ${statusStyle[item.tone]}`}>
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
      <section className="relative bg-background py-24 px-6 transition-colors duration-300">
        <div className="max-w-6xl mx-auto relative z-10">
          <div className="mb-16 max-w-xl text-center md:text-left mx-auto md:mx-0">
            <span className="font-mono text-xs tracking-[0.2em] uppercase text-accent-purple bg-accent-purple/10 px-3 py-1 rounded-full border border-accent-purple/20">
              Módulos do sistema
            </span>
            <h2 className="font-display text-3xl md:text-4xl font-bold text-text-primary mt-6 tracking-tight">
              Tudo que a operação precisa,<br className="hidden md:block"/>em um lugar.
            </h2>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <div
                key={feature.tag}
                className="group glass-card hover-card p-8 rounded-3xl transition-all duration-300 border border-[var(--color-border-light)]"
              >
                <div className="flex items-center justify-between mb-6">
                  <div className="text-text-primary p-3 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border-light)] group-hover:scale-110 group-hover:text-accent-purple transition-all duration-300 shadow-sm">
                    {feature.icon}
                  </div>
                  <span className="font-mono text-[10px] tracking-wider text-text-secondary border border-[var(--color-border-light)] bg-[var(--color-surface)] rounded-full px-3 py-1 group-hover:border-accent-purple/30 group-hover:bg-accent-purple/10 group-hover:text-accent-purple transition-all duration-300">
                    {feature.tag}
                  </span>
                </div>
                <h3 className="font-display text-lg font-semibold text-text-primary mb-2 group-hover:text-accent-purple transition-colors duration-300">
                  {feature.title}
                </h3>
                <p className="text-sm text-text-secondary leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA final */}
      <section className="bg-background px-6 pb-24 transition-colors duration-300 relative">
        <div className="max-w-6xl mx-auto glass-card rounded-3xl border border-[var(--color-border)] px-8 py-12 md:px-16 md:py-16 flex flex-col md:flex-row items-center justify-between gap-8 relative overflow-hidden shadow-[0_20px_40px_-15px_rgba(0,0,0,0.3)]">
          <div className="absolute inset-0 bg-gradient-to-r from-accent-purple/10 to-accent-pink/10 pointer-events-none" />
          
          <div className="relative z-10 text-center md:text-left">
            <h3 className="font-display text-3xl font-bold text-text-primary mb-4 tracking-tight">
              Pronto para evoluir seu estoque?
            </h3>
            <p className="text-text-secondary text-base max-w-lg leading-relaxed">
              Entre com sua conta ou crie um novo acesso para começar a gerenciar produtos,
              fornecedores e movimentações com a melhor experiência.
            </p>
          </div>
          <Link
            to="/auth"
            className="shrink-0 btn-primary px-8 py-4 text-sm relative z-10 shadow-lg shadow-accent-purple/20 hover:shadow-accent-purple/40"
          >
            Começar agora
          </Link>
        </div>
      </section>

      <FooterHome />
    </>
  );
};

export default Home;