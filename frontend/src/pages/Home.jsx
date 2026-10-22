import { useState, useEffect } from "react";
import HeaderHome from "../components/common/HeaderHome.jsx";
import FooterHome from "../components/common/FooterHome.jsx";
import PlaceholderMedia from "../components/home/PlaceholderMedia.jsx";
import { FiBox, FiBarChart2, FiShield, FiUsers } from "react-icons/fi";
import { Link } from "react-router-dom";

const Home = () => {
  const [activeHeroImg, setActiveHeroImg] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveHeroImg((prev) => (prev + 1) % 3);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  const heroImages = [
    { text: "Dashboard Principal", aspect: "", src: "/dashboard-estoqueOS.png" },
    { text: "Gestão de Usuários", aspect: "", src: "/usuarios-estoqueOS.png" },
    { text: "Analytics", aspect: "", src: "/analytics-estoqueOS.png" }
  ];

  const marqueeMetrics = [
    { value: "Alertas", label: "Baixo Estoque" },
    { value: "99.9%", label: "Uptime Garantido" },
    { value: "Auditoria", label: "Registros Oficiais" },
    { value: "100%", label: "Controle de Saldo" },
    { value: "Cloud", label: "Mídia Segura" },
    { value: "Sync", label: "Multi-dispositivos" },
    { value: "RBAC", label: "Controle de Acesso" },
    { value: "Seguro", label: "Criptografia JWT" },
  ];

  return (
    <div className="min-h-screen flex flex-col relative bg-background transition-colors duration-300">
      <HeaderHome />

      <main className="flex-grow pt-36 md:pt-44 pb-12 overflow-hidden">
        {/* ================= HERO SECTION ================= */}
        <section className="px-6 md:px-12 max-w-7xl mx-auto mb-20 relative">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Left Content */}
            <div className="animate-fade-up">
              <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-text-primary leading-[1.1] mb-6">
                O controle total <br /> do seu <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent-purple to-accent-pink">estoque.</span>
              </h1>
              <p className="text-base text-text-secondary max-w-lg mb-8 leading-relaxed font-secondary">
                Sistema de gerenciamento completo para controle de mercadorias, fornecedores e movimentações com precisão. Projetado para decisões estratégicas.
              </p>
              <div className="flex flex-wrap gap-3 items-center mb-10">
                <Link to="/auth" className="btn-primary px-6 py-3 font-semibold text-sm">
                  Começar Agora
                </Link>
                <a href="#modulos" className="btn-secondary px-6 py-3 font-semibold text-sm">
                  Conhecer Módulos
                </a>
              </div>
            </div>

            {/* Right Content - 16:9 Carousel (Responsive) */}
            <div className="relative w-full aspect-video rounded-3xl overflow-hidden shadow-2xl border border-[var(--color-border-light)] animate-scale-in" style={{ animationDelay: '0.1s' }}>
              {heroImages.map((img, i) => (
                <div key={i} className={`absolute inset-0 transition-opacity duration-1000 ${i === activeHeroImg ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}>
                  <PlaceholderMedia text={img.text} className="w-full h-full border-none" aspectRatio="aspect-video" iconSize={32} src={img.src} />
                </div>
              ))}
              {/* Carousel Dots */}
              <div className="absolute bottom-4 left-0 right-0 z-20 flex justify-center gap-2">
                {heroImages.map((_, i) => (
                  <div key={i} className={`h-1.5 rounded-full transition-all duration-500 cursor-pointer ${i === activeHeroImg ? 'w-6 bg-accent-purple' : 'w-2 bg-white/50 hover:bg-white/80'}`} onClick={() => setActiveHeroImg(i)} />
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ================= METRICS SECTION (MARQUEE DIVIDER) ================= */}
        <section className="border-y border-[var(--color-border-light)] bg-[var(--color-surface)] mb-20 overflow-hidden relative">
          <div className="marquee-fade-edges w-full flex">
            <div className="flex w-max animate-marquee py-3 md:py-4">
              {/* First Set */}
              {marqueeMetrics.map((metric, i) => (
                <div key={i} className="flex flex-row items-center justify-center gap-2 min-w-[200px] px-6 border-r border-[var(--color-border-light)] last:border-r-0">
                  <span className="font-display text-base font-bold text-text-primary">{metric.value}</span>
                  <span className="text-[10px] font-medium text-text-secondary font-secondary uppercase tracking-widest">{metric.label}</span>
                </div>
              ))}
              {/* Duplicated Set for infinite loop */}
              {marqueeMetrics.map((metric, i) => (
                <div key={`dup-${i}`} className="flex flex-row items-center justify-center gap-2 min-w-[200px] px-6 border-r border-[var(--color-border-light)] last:border-r-0">
                  <span className="font-display text-base font-bold text-text-primary">{metric.value}</span>
                  <span className="text-[10px] font-medium text-text-secondary font-secondary uppercase tracking-widest">{metric.label}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ================= WHY CHOOSE US ================= */}
        <section id="funcionalidades" className="px-6 md:px-12 max-w-7xl mx-auto mb-28 pt-12">
          <div className="mb-12">
            <span className="text-[10px] font-mono font-bold tracking-[0.2em] uppercase text-accent-purple mb-4 block">
              Diferenciais
            </span>
            <h2 className="font-display text-3xl md:text-4xl font-bold text-text-primary max-w-2xl leading-tight">
              Por que a operação confia no Estoque.OS
            </h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            {/* Left: Text Features */}
            <div className="flex flex-col gap-5">
              <div className="glass-card p-6 md:p-8 rounded-3xl flex-1 hover-card">
                <FiShield className="w-8 h-8 text-accent-purple mb-5" />
                <h3 className="font-display text-lg font-bold text-text-primary mb-2">Controle de Acesso (RBAC)</h3>
                <p className="text-sm text-text-secondary leading-relaxed">
                  Permissões granulares para Administradores, Gerentes e Operadores. Acesso restrito e seguro para toda a equipe.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="glass-card p-6 rounded-3xl hover-card flex flex-col justify-center">
                  <h3 className="font-display text-base font-bold text-text-primary mb-2">Auditoria</h3>
                  <p className="text-xs text-text-secondary leading-relaxed">
                    Todo registro de reposição e venda é assinado pelo operador responsável.
                  </p>
                </div>
                <div className="glass-card p-6 rounded-3xl hover-card flex flex-col justify-center">
                  <FiBox className="w-6 h-6 text-accent-pink mb-3" />
                  <h3 className="font-display text-base font-bold text-text-primary mb-2">Gestão Ágil</h3>
                  <p className="text-xs text-text-secondary leading-relaxed">
                    Organização por categorias e bloqueio de saldos negativos.
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
              <div className="absolute bottom-0 left-0 p-6 md:p-8 w-full z-10">
                <h3 className="font-display text-xl font-bold text-white mb-2">Veja na prática</h3>
                {/* <p className="text-sm text-gray-300">
                   Integração com Cloudinary para armazenar mídia em nuvem com alta velocidade.
                 </p> */}
              </div>
            </div>
          </div>
        </section>

        {/* ================= MODULES (DESTINATIONS) ================= */}
        <section id="modulos" className="px-6 md:px-12 max-w-7xl mx-auto mb-28 pt-12">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 gap-6">
            <div>
              <h2 className="font-display text-3xl md:text-4xl font-bold text-text-primary max-w-xl leading-tight">
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-10">
            {[
              { title: "Dashboard", desc: "KPIs financeiros e avisos de estoque.", tag: "KPIs", src: "/dashboard-estoqueOS.png" },
              { title: "Produtos", desc: "Catálogo e upload de mídia.", tag: "Catálogo", src: "/catalogoProdutos-estoqueOS.png" },
              { title: "Movimentações", desc: "Histórico de fluxos detalhado.", tag: "Controle", src: "/analytics-estoqueOS.png" },
              { title: "Usuários", desc: "Gestão de acessos e papéis.", tag: "Segurança", src: "/usuarios-estoqueOS.png" },
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
        <section className="px-6 md:px-12 max-w-4xl mx-auto mb-16">
          <div className="glass-container p-10 md:p-16 text-center relative overflow-hidden flex flex-col items-center">
            <div className="absolute -top-24 -right-24 w-64 h-64 bg-accent-purple/20 rounded-full blur-[80px]" />
            <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-accent-pink/20 rounded-full blur-[80px]" />

            <FiUsers className="w-10 h-10 text-accent-purple mb-5 relative z-10" />
            <h2 className="font-display text-3xl font-bold text-text-primary mb-4 relative z-10">
              Pronto para evoluir a sua operação?
            </h2>
            <p className="text-text-secondary max-w-lg mx-auto mb-8 text-sm relative z-10">
              Faça login no painel administrativo e experimente o controle, performance e segurança que o seu estoque exige.
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