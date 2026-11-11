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
  FiShoppingCart,
  FiTrendingUp,
} from "react-icons/fi";
import { Link } from "react-router-dom";

// arquivo responsável pela landing page pública explicando Organização->Lojas, Multipedidos, Desempenho e Portais Admin/Loja

// função responsável por renderizar a landing page institucional do Estoque.OS em proporção confortável para zoom 100%.
//
// 1 - recebe nenhum parâmetro direto (controla internamente o carrossel hero via estado activeHeroImg).
// 2 - alterna automaticamente as telas de destaque a cada 2500ms em useEffect com limpeza do intervalo.
// 3 - retorna o JSX completo da página inicial com espaçamento enxuto e seções de funcionalidades, multi-loja e CTA.
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
    { text: "Gestão de Equipe", aspect: "", src: "/usuarios-estoqueOS.png" },
    { text: "Analytics", aspect: "", src: "/analytics-estoqueOS.png" },
  ];

  const marqueeMetrics = [
    { value: "Redes", label: "Organização -> Lojas" },
    { value: "Multipedidos", label: "Carrinho + Estorno" },
    { value: "Planilhas", label: "Importação .XLSX/.CSV" },
    { value: "Desempenho", label: "Ranking & Ex-ID" },
    { value: "Cloudinary", label: "Pastas por Filial" },
    { value: "PDF A4", label: "1m · 6m · 1 Ano" },
    { value: "RBAC", label: "Admin · Gerente · Op" },
    { value: "Auditoria", label: "Histórico Preservado" },
  ];

  const multiTenantPillars = [
    {
      icon: FiLayers,
      title: "Organizações & Múltiplas Filiais",
      tag: "Multi-Rede SaaS",
      desc: "O Administrador cria a sua Organização no Portal Admin, abre múltiplas lojas, transfere gerentes ou operadores entre filiais e compara resultados por loja ou consolidado.",
    },
    {
      icon: FiShoppingCart,
      title: "Multipedidos com Preço Congelado",
      tag: "Venda & Estorno",
      desc: "Registre pedidos com vários produtos em uma única operação transacional atômica, congelando o preço do dia da venda e permitindo cancelamento/estorno por gestores.",
    },
    {
      icon: FiTrendingUp,
      title: "Desempenho & Auditoria por ID",
      tag: "1m · 6m · 1a",
      desc: "Acompanhe o ranking de vendedores do melhor ao pior e filtre vendas por colaborador (mesmo de ex-funcionários já excluídos do sistema preservando o antigo ID).",
    },
    {
      icon: FiUploadCloud,
      title: "Planilhas .xlsx/.csv & Mídia Isolada",
      tag: "Onboarding",
      desc: "Importe centenas de produtos por filial com pré-validação, organize fotos no Cloudinary em pastas dedicadas e exporte relatórios executivos em PDF A4.",
    },
  ];

  return (
    <div className="min-h-screen flex flex-col relative bg-background transition-colors duration-300">
      <HeaderHome />

      <main className="flex-grow pt-20 sm:pt-24 md:pt-28 pb-8 overflow-hidden">
        {/* HERO SECTION */}
        <section className="px-4 sm:px-6 md:px-10 max-w-7xl mx-auto mb-10 sm:mb-14 relative">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            <div className="animate-fade-up">
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent-purple/10 border border-accent-purple/25 text-accent-purple font-mono text-[10px] uppercase tracking-widest mb-3">
                Plataforma Multi-Organização &amp; Multi-Loja
              </span>
              <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-text-primary leading-[1.1] mb-4">
                Controle total <br /> da sua rede de{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent-purple to-accent-pink">
                  lojas.
                </span>
              </h1>
              <p className="text-sm sm:text-base text-text-secondary max-w-lg mb-5 sm:mb-6 leading-relaxed font-secondary">
                Crie sua Organização no Portal Admin, gerencie múltiplas filiais, feche pedidos multi-item e acompanhe o desempenho de cada vendedor com precisão em 1 mês, 6 meses e 1 ano.
              </p>
              <div className="flex flex-wrap gap-3 items-center mb-4 sm:mb-6">
                <Link
                  to="/admin/login?mode=register"
                  className="btn-primary px-5 py-2.5 font-semibold text-sm"
                >
                  Criar Organização (Admin)
                </Link>
                <Link to="/login" className="btn-secondary px-5 py-2.5 font-semibold text-sm">
                  Portal da Loja (Equipe)
                </Link>
              </div>
            </div>

            <div
              className="relative w-full aspect-video rounded-3xl overflow-hidden shadow-2xl border border-[var(--color-border-light)] animate-scale-in"
              style={{ animationDelay: "0.1s" }}
            >
              {heroImages.map((img, i) => (
                <div
                  key={i}
                  className={`absolute inset-0 transition-opacity duration-1000 ${i === activeHeroImg ? "opacity-100 z-10" : "opacity-0 z-0"
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
              <div className="absolute bottom-4 left-0 right-0 z-20 flex justify-center gap-2">
                {heroImages.map((_, i) => (
                  <div
                    key={i}
                    className={`h-1.5 rounded-full transition-all duration-500 cursor-pointer ${i === activeHeroImg
                      ? "w-6 bg-accent-purple"
                      : "w-2 bg-white/50 hover:bg-white/80"
                      }`}
                    onClick={() => setActiveHeroImg(i)}
                  />
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* MARQUEE */}
        <section className="border-y border-[var(--color-border-light)] bg-[var(--color-surface)] mb-12 sm:mb-16 overflow-hidden relative">
          <div className="marquee-fade-edges w-full flex">
            <div className="flex w-max animate-marquee py-3 md:py-4">
              {marqueeMetrics.map((metric, i) => (
                <div
                  key={i}
                  className="flex flex-row items-center justify-center gap-2 min-w-[210px] px-6 border-r border-[var(--color-border-light)] last:border-r-0"
                >
                  <span className="font-display text-base font-bold text-text-primary">
                    {metric.value}
                  </span>
                  <span className="text-[10px] font-medium text-text-secondary font-secondary uppercase tracking-widest">
                    {metric.label}
                  </span>
                </div>
              ))}
              {marqueeMetrics.map((metric, i) => (
                <div
                  key={`dup-${i}`}
                  className="flex flex-row items-center justify-center gap-2 min-w-[210px] px-6 border-r border-[var(--color-border-light)] last:border-r-0"
                >
                  <span className="font-display text-base font-bold text-text-primary">
                    {metric.value}
                  </span>
                  <span className="text-[10px] font-medium text-text-secondary font-secondary uppercase tracking-widest">
                    {metric.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* WHY CHOOSE US */}
        <section
          id="funcionalidades"
          className="px-4 sm:px-6 md:px-10 max-w-7xl mx-auto mb-14 sm:mb-20 pt-4 sm:pt-8"
        >
          <div className="mb-8 sm:mb-10">
            <span className="text-[10px] font-mono font-bold tracking-[0.2em] uppercase text-accent-purple mb-2 block">
              Diferenciais
            </span>
            <h2 className="font-display text-2xl sm:text-3xl md:text-4xl font-bold text-text-primary max-w-2xl leading-tight">
              Governança real para redes de varejo e equipes operacionais
            </h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-6 items-center">
            <div className="flex flex-col gap-4">
              <div className="glass-card p-5 md:p-6 rounded-3xl flex-1 hover-card">
                <FiShield className="w-7 h-7 text-accent-purple mb-3" />
                <h3 className="font-display text-lg font-bold text-text-primary mb-2">
                  Portais Separados e Hierarquia Clara
                </h3>
                <p className="text-sm text-text-secondary leading-relaxed">
                  O Administrador entra pelo Portal Admin para criar lojas, transferir gerentes entre unidades e auditar todas as filiais. Gerentes operam sua loja e Operadores veem apenas suas próprias vendas.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="glass-card p-5 rounded-3xl hover-card flex flex-col justify-center">
                  <h3 className="font-display text-base font-bold text-text-primary mb-1.5">
                    Exclusão com Lastro
                  </h3>
                  <p className="text-xs text-text-secondary leading-relaxed">
                    Exclua colaboradores desligados definitivamente mantendo seu antigo ID e vendas intactas nos relatórios.
                  </p>
                </div>
                <div className="glass-card p-5 rounded-3xl hover-card flex flex-col justify-center">
                  <FiBox className="w-6 h-6 text-accent-pink mb-2.5" />
                  <h3 className="font-display text-base font-bold text-text-primary mb-1.5">
                    Soft Delete no Catálogo
                  </h3>
                  <p className="text-xs text-text-secondary leading-relaxed">
                    Inative produtos e fornecedores descontinuados sem quebrar pedidos antigos ou gráficos de faturamento.
                  </p>
                </div>
              </div>
            </div>

            <div className="relative rounded-3xl overflow-hidden group shadow-xl aspect-video border border-[var(--color-border-light)]">
              <PlaceholderMedia
                type="video"
                text="Demonstração do Painel"
                className="w-full h-full border-none"
                src="/newEstoque.OS.mp4"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />
              <div className="absolute bottom-0 left-0 p-5 sm:p-6 md:p-8 w-full z-10">
                <h3 className="font-display text-lg sm:text-xl font-bold text-white mb-1">
                  Veja na prática
                </h3>
              </div>
            </div>
          </div>
        </section>

        {/* MULTI-TENANT SECTION */}
        <section
          id="multitenant"
          className="px-4 sm:px-6 md:px-10 max-w-7xl mx-auto mb-14 sm:mb-20 pt-4 sm:pt-8"
        >
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-7 gap-4">
            <div>
              <span className="text-[10px] font-mono font-bold tracking-[0.2em] uppercase text-accent-pink mb-2 block">
                Arquitetura SaaS
              </span>
              <h2 className="font-display text-2xl sm:text-3xl md:text-4xl font-bold text-text-primary max-w-2xl leading-tight">
                Uma Organização, várias Lojas sob controle total
              </h2>
              <p className="text-sm text-text-secondary mt-2 max-w-2xl leading-relaxed">
                Cada rede empresarial opera em um ambiente 100% isolado, permitindo gerenciar matriz e filiais sem jamais cruzar dados com outras empresas cadastradas.
              </p>
            </div>
            <Link
              to="/admin/login?mode=register"
              className="btn-primary px-5 py-2.5 text-sm font-semibold whitespace-nowrap"
            >
              Cadastrar Minha Rede
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
            {multiTenantPillars.map((item, idx) => {
              const IconComp = item.icon;
              return (
                <div
                  key={idx}
                  className="glass-card hover-card p-5 sm:p-6 rounded-3xl flex flex-col gap-2.5"
                >
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

        {/* MODULES */}
        <section
          id="modulos"
          className="px-4 sm:px-6 md:px-10 max-w-7xl mx-auto mb-14 sm:mb-20 pt-4 sm:pt-8"
        >
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-7 gap-4">
            <div>
              <h2 className="font-display text-2xl sm:text-3xl md:text-4xl font-bold text-text-primary max-w-xl leading-tight">
                Módulos Essenciais
              </h2>
              <p className="text-sm text-text-secondary mt-3 max-w-md">
                Explore as interfaces desenvolvidas para acelerar o dia a dia da gestão de suprimentos e vendas.
              </p>
            </div>
            <Link to="/admin/login" className="btn-secondary px-5 py-2.5 text-sm font-semibold whitespace-nowrap">
              Portal do Administrador
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 lg:gap-10">
            {[
              {
                title: "Dashboard & PDF",
                desc: "KPIs consolidados da rede ou filial, gráficos e PDFs A4.",
                tag: "KPIs",
                src: "/dashboard-estoqueOS.png",
              },
              {
                title: "Produtos & Planilhas",
                desc: "Catálogo por filial, importação .xlsx/.csv e Soft Delete.",
                tag: "Catálogo",
                src: "/catalogoProdutos-estoqueOS.png",
              },
              {
                title: "Desempenho & Multipedidos",
                desc: "Pedidos multi-item com estorno e ranking do melhor ao pior vendedor.",
                tag: "Analytics",
                src: "/analytics-estoqueOS.png",
              },
              {
                title: "Lojas & Equipe",
                desc: "Gestão de filiais, transferência de gerentes e exclusão segura.",
                tag: "Governança",
                src: "/usuarios-estoqueOS.png",
              },
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

        {/* CTA */}
        <section className="px-4 sm:px-6 md:px-10 max-w-4xl mx-auto mb-8 sm:mb-12">
          <div className="glass-container p-6 sm:p-8 md:p-12 text-center relative overflow-hidden flex flex-col items-center">
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
              Pronto para gerenciar toda a sua rede?
            </h2>
            <p className="text-text-secondary max-w-lg mx-auto mb-8 text-xs sm:text-sm relative z-10">
              Acesse pelo Portal do Administrador para criar filiais e analisar relatórios, ou entre pelo Portal da Loja com sua conta de Gerente ou Operador.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3 relative z-10">
              <Link
                to="/admin/login"
                className="btn-primary px-7 py-3 font-semibold text-sm shadow-xl shadow-accent-purple/20"
              >
                Portal Administrador
              </Link>
              <Link to="/login" className="btn-secondary px-7 py-3 font-semibold text-sm">
                Portal da Loja
              </Link>
            </div>
          </div>
        </section>
      </main>

      <FooterHome />
    </div>
  );
};

export default Home;
