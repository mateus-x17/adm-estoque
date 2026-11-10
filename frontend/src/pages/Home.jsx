import { useState, useEffect } from "react";
import HeaderHome from "../components/common/HeaderHome.jsx";
import FooterHome from "../components/common/FooterHome.jsx";
import PlaceholderMedia from "../components/home/PlaceholderMedia.jsx";
import {
  FiBox,
  FiShield,
  FiUsers,
  FiLayers,
  FiUploadCloud,
  FiFolder,
  FiCheckSquare,
} from "react-icons/fi";
import { Link } from "react-router-dom";

// arquivo responsável pela landing page pública do Estoque.OS explicando arquitetura multi-tenant, RBAC e recursos operacionais

const Home = () => {
  const [activeHeroImg, setActiveHeroImg] = useState(0);

  // efeito para alternar automaticamente as prévias de tela no carrossel da dobra principal
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveHeroImg((prev) => (prev + 1) % 3);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  const heroImages = [
    { text: "Dashboard Principal", aspect: "", src: "/dashboard-estoqueOS.png" },
    { text: "Gestão de Usuários", aspect: "", src: "/usuarios-estoqueOS.png" },
    { text: "Analytics", aspect: "", src: "/analytics-estoqueOS.png" },
  ];

  const marqueeMetrics = [
    { value: "Multi-Tenant", label: "Lojas Isoladas" },
    { value: "Planilhas", label: "Importação .XLSX/.CSV" },
    { value: "Auditoria", label: "Registros Oficiais" },
    { value: "Soft Delete", label: "Histórico Preservado" },
    { value: "Cloudinary", label: "Pastas por Loja" },
    { value: "PDF A4", label: "Relatórios Vetoriais" },
    { value: "RBAC", label: "Admin · Gerente · Op" },
    { value: "Seguro", label: "JWT & Isolamento" },
  ];

  const multiTenantPillars = [
    {
      icon: FiLayers,
      title: "Ambiente Isolado por Loja",
      tag: "Multi-Tenant",
      desc: "Cada estabelecimento cadastra sua própria conta, produtos, categorias, fornecedores e equipe com separação estrita por empresaId e seletor de loja no login.",
    },
    {
      icon: FiFolder,
      title: "Mídia Organizada no Cloudinary",
      tag: "Storage Dedicado",
      desc: "Fotos de produtos e avatares dos colaboradores são armazenados em pastas exclusivas da sua empresa (estoque-os/lojas/<slug>/produtos e .../usuarios).",
    },
    {
      icon: FiUploadCloud,
      title: "Importação & Exportação (.xlsx / .csv)",
      tag: "Onboarding Rápido",
      desc: "Baixe a planilha modelo, valide centenas de linhas no modo pré-visualização e importe todo o catálogo com criação automática de categorias e fornecedores.",
    },
    {
      icon: FiCheckSquare,
      title: "Soft Delete & RBAC em 3 Níveis",
      tag: "Governança",
      desc: "Inative produtos, fornecedores e colaboradores sem perder auditoria de vendas. Operadores veem apenas suas vendas; Gerentes acompanham relatórios; Admins controlam tudo.",
    },
  ];

  return (
    <div className="min-h-screen flex flex-col relative bg-background transition-colors duration-300">
      <HeaderHome />

      <main className="flex-grow pt-28 sm:pt-36 md:pt-44 pb-12 overflow-hidden">
        {/* ================= HERO SECTION ================= */}
        <section className="px-4 sm:px-6 md:px-12 max-w-7xl mx-auto mb-16 sm:mb-20 relative">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
            {/* Left Content */}
            <div className="animate-fade-up">
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent-purple/10 border border-accent-purple/25 text-accent-purple font-mono text-[10px] uppercase tracking-widest mb-4">
                Plataforma SaaS Multi-Estabelecimento
              </span>
              <h1 className="font-display text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-text-primary leading-[1.1] mb-5 sm:mb-6">
                O controle total <br /> do seu{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent-purple to-accent-pink">
                  estoque.
                </span>
              </h1>
              <p className="text-sm sm:text-base text-text-secondary max-w-lg mb-7 sm:mb-8 leading-relaxed font-secondary">
                Crie a conta do seu estabelecimento, importe seu catálogo via planilha, organize fotos na nuvem por loja e acompanhe entradas, vendas e metas com precisão.
              </p>
              <div className="flex flex-wrap gap-3 items-center mb-6 sm:mb-10">
                <Link to="/auth" className="btn-primary px-6 py-3 font-semibold text-sm">
                  Criar Conta da Loja
                </Link>
                <a href="#multitenant" className="btn-secondary px-6 py-3 font-semibold text-sm">
                  Como Funciona
                </a>
              </div>
            </div>

            {/* Right Content - 16:9 Carousel (Responsive) */}
            <div
              className="relative w-full aspect-video rounded-3xl overflow-hidden shadow-2xl border border-[var(--color-border-light)] animate-scale-in"
              style={{ animationDelay: "0.1s" }}
            >
              {heroImages.map((img, i) => (
                <div
                  key={i}
                  className={`absolute inset-0 transition-opacity duration-1000 ${
                    i === activeHeroImg ? "opacity-100 z-10" : "opacity-0 z-0"
                  }`}
                >
                  <PlaceholderMedia
                    text={img.text}
                    className="w-full h-full border-none"
                    aspectRatio="aspect-video"
                    iconSize={32}
                    src={img.src}
                  />
                </div>
              ))}
              {/* Carousel Dots */}
              <div className="absolute bottom-4 left-0 right-0 z-20 flex justify-center gap-2">
                {heroImages.map((_, i) => (
                  <div
                    key={i}
                    className={`h-1.5 rounded-full transition-all duration-500 cursor-pointer ${
                      i === activeHeroImg ? "w-6 bg-accent-purple" : "w-2 bg-white/50 hover:bg-white/80"
                    }`}
                    onClick={() => setActiveHeroImg(i)}
                  />
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ================= METRICS SECTION (MARQUEE DIVIDER) ================= */}
        <section className="border-y border-[var(--color-border-light)] bg-[var(--color-surface)] mb-16 sm:mb-20 overflow-hidden relative">
          <div className="marquee-fade-edges w-full flex">
            <div className="flex w-max animate-marquee py-3 md:py-4">
              {marqueeMetrics.map((metric, i) => (
                <div
                  key={i}
                  className="flex flex-row items-center justify-center gap-2 min-w-[200px] px-6 border-r border-[var(--color-border-light)] last:border-r-0"
                >
                  <span className="font-display text-base font-bold text-text-primary">{metric.value}</span>
                  <span className="text-[10px] font-medium text-text-secondary font-secondary uppercase tracking-widest">
                    {metric.label}
                  </span>
                </div>
              ))}
              {marqueeMetrics.map((metric, i) => (
                <div
                  key={`dup-${i}`}
                  className="flex flex-row items-center justify-center gap-2 min-w-[200px] px-6 border-r border-[var(--color-border-light)] last:border-r-0"
                >
                  <span className="font-display text-base font-bold text-text-primary">{metric.value}</span>
                  <span className="text-[10px] font-medium text-text-secondary font-secondary uppercase tracking-widest">
                    {metric.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ================= WHY CHOOSE US ================= */}
        <section id="funcionalidades" className="px-4 sm:px-6 md:px-12 max-w-7xl mx-auto mb-20 sm:mb-28 pt-6 sm:pt-12">
          <div className="mb-10 sm:mb-12">
            <span className="text-[10px] font-mono font-bold tracking-[0.2em] uppercase text-accent-purple mb-3 block">
              Diferenciais
            </span>
            <h2 className="font-display text-2xl sm:text-3xl md:text-4xl font-bold text-text-primary max-w-2xl leading-tight">
              Por que a operação confia no Estoque.OS
            </h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 items-center">
            {/* Left: Text Features */}
            <div className="flex flex-col gap-5">
              <div className="glass-card p-6 md:p-8 rounded-3xl flex-1 hover-card">
                <FiShield className="w-8 h-8 text-accent-purple mb-4" />
                <h3 className="font-display text-lg font-bold text-text-primary mb-2">
                  Controle de Acesso (RBAC)
                </h3>
                <p className="text-sm text-text-secondary leading-relaxed">
                  Permissões granulares para Administradores, Gerentes e Operadores. Cada perfil enxerga exatamente o que precisa para operar sem risco de vazamento interno.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="glass-card p-6 rounded-3xl hover-card flex flex-col justify-center">
                  <h3 className="font-display text-base font-bold text-text-primary mb-2">Auditoria</h3>
                  <p className="text-xs text-text-secondary leading-relaxed">
                    Todo registro de reposição e venda é assinado pelo operador responsável na sua loja.
                  </p>
                </div>
                <div className="glass-card p-6 rounded-3xl hover-card flex flex-col justify-center">
                  <FiBox className="w-6 h-6 text-accent-pink mb-3" />
                  <h3 className="font-display text-base font-bold text-text-primary mb-2">Gestão Ágil</h3>
                  <p className="text-xs text-text-secondary leading-relaxed">
                    Organização por categorias, bloqueio de saldos negativos e histórico imutável com Soft Delete.
                  </p>
                </div>
              </div>
            </div>

            {/* Right: 16:9 Video */}
            <div className="relative rounded-3xl overflow-hidden group shadow-xl aspect-video border border-[var(--color-border-light)]">
              <PlaceholderMedia
                type="video"
                text="Demonstração do Painel"
                className="w-full h-full border-none"
                src="/newEstoque.OS.mp4"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />
              <div className="absolute bottom-0 left-0 p-5 sm:p-6 md:p-8 w-full z-10">
                <h3 className="font-display text-lg sm:text-xl font-bold text-white mb-1">Veja na prática</h3>
              </div>
            </div>
          </div>
        </section>

        {/* ================= MULTI-TENANT & ONBOARDING ARCHITECTURE ================= */}
        <section id="multitenant" className="px-4 sm:px-6 md:px-12 max-w-7xl mx-auto mb-20 sm:mb-28 pt-6 sm:pt-10">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 gap-5">
            <div>
              <span className="text-[10px] font-mono font-bold tracking-[0.2em] uppercase text-accent-pink mb-3 block">
                Arquitetura SaaS
              </span>
              <h2 className="font-display text-2xl sm:text-3xl md:text-4xl font-bold text-text-primary max-w-2xl leading-tight">
                Uma plataforma, múltiplos estabelecimentos independentes
              </h2>
              <p className="text-sm text-text-secondary mt-3 max-w-2xl leading-relaxed">
                Cada loja cria sua conta em segundos com painel exclusivo, equipe própria, subpastas dedicadas no Cloudinary e importação em massa de mercadorias.
              </p>
            </div>
            <Link to="/auth" className="btn-primary px-5 py-2.5 text-sm font-semibold whitespace-nowrap">
              Cadastrar Minha Loja
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
            {multiTenantPillars.map((item, idx) => {
              const IconComp = item.icon;
              return (
                <div key={idx} className="glass-card hover-card p-6 sm:p-7 rounded-3xl flex flex-col gap-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-accent-purple/10 border border-accent-purple/20 flex items-center justify-center text-accent-purple shrink-0">
                      <IconComp size={20} />
                    </div>
                    <span className="font-mono text-[10px] uppercase tracking-wider px-3 py-1 rounded-full border border-[var(--color-border-light)] bg-[var(--color-surface)] text-text-secondary">
                      {item.tag}
                    </span>
                  </div>
                  <h3 className="font-display text-lg font-bold text-text-primary mt-1">
                    {item.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-text-secondary leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </section>

        {/* ================= MODULES (DESTINATIONS) ================= */}
        <section id="modulos" className="px-4 sm:px-6 md:px-12 max-w-7xl mx-auto mb-20 sm:mb-28 pt-6 sm:pt-12">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 gap-6">
            <div>
              <h2 className="font-display text-2xl sm:text-3xl md:text-4xl font-bold text-text-primary max-w-xl leading-tight">
                Módulos Essenciais
              </h2>
              <p className="text-sm text-text-secondary mt-3 max-w-md">
                Explore as interfaces desenvolvidas para acelerar o dia a dia da sua gestão de suprimentos.
              </p>
            </div>
            <Link to="/auth" className="btn-secondary px-5 py-2.5 text-sm font-semibold whitespace-nowrap">
              Acessar Sistema
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 lg:gap-10">
            {[
              { title: "Dashboard", desc: "KPIs financeiros, exportação PDF e avisos de estoque.", tag: "KPIs", src: "/dashboard-estoqueOS.png" },
              { title: "Produtos & Planilhas", desc: "Catálogo, importação .xlsx/.csv e mídia em nuvem.", tag: "Catálogo", src: "/catalogoProdutos-estoqueOS.png" },
              { title: "Movimentações", desc: "Histórico detalhado de vendas e reposições por loja.", tag: "Controle", src: "/analytics-estoqueOS.png" },
              { title: "Usuários & RBAC", desc: "Gestão de acessos, cargos e inativação segura.", tag: "Segurança", src: "/usuarios-estoqueOS.png" },
            ].map((mod, i) => (
              <div key={i} className="flex flex-col gap-4 group cursor-pointer">
                <div className="relative rounded-2xl overflow-hidden aspect-video shadow-md border border-[var(--color-border-light)]">
                  <PlaceholderMedia
                    text={`View ${mod.title}`}
                    className="w-full h-full transition-transform duration-500 group-hover:scale-105"
                    src={mod.src}
                    aspectRatio="aspect-video"
                  />
                  <div className="absolute top-3 left-3">
                    <span className="bg-white/90 dark:bg-black/80 backdrop-blur-md px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider text-text-primary border border-[var(--color-border-light)]">
                      {mod.tag}
                    </span>
                  </div>
                </div>
                <div className="px-1">
                  <h4 className="font-display font-bold text-base text-text-primary group-hover:text-accent-purple transition-colors">
                    {mod.title}
                  </h4>
                  <p className="text-xs text-text-secondary mt-1">{mod.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ================= CTA ================= */}
        <section className="px-4 sm:px-6 md:px-12 max-w-4xl mx-auto mb-12 sm:mb-16">
          <div className="glass-container p-8 sm:p-10 md:p-16 text-center relative overflow-hidden flex flex-col items-center">
            <div
              className="absolute -top-24 -right-24 w-64 h-64 rounded-full pointer-events-none"
              style={{ background: "radial-gradient(circle, rgba(79, 70, 229, 0.22) 0%, transparent 70%)" }}
            />
            <div
              className="absolute -bottom-24 -left-24 w-64 h-64 rounded-full pointer-events-none"
              style={{ background: "radial-gradient(circle, rgba(236, 72, 153, 0.20) 0%, transparent 70%)" }}
            />

            <FiUsers className="w-10 h-10 text-accent-purple mb-5 relative z-10" />
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-text-primary mb-4 relative z-10">
              Pronto para evoluir a sua operação?
            </h2>
            <p className="text-text-secondary max-w-lg mx-auto mb-8 text-xs sm:text-sm relative z-10">
              Cadastre sua loja agora mesmo ou faça login no painel administrativo para experimentar controle multi-tenant, performance e segurança.
            </p>
            <Link to="/auth" className="btn-primary px-8 py-3.5 font-semibold relative z-10 text-sm shadow-xl shadow-accent-purple/20">
              Acessar Painel
            </Link>
          </div>
        </section>
      </main>

      <FooterHome />
    </div>
  );
};

export default Home;
