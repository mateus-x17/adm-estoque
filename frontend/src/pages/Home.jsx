import HeaderHome from "../components/common/HeaderHome.jsx";
import FooterHome from "../components/common/FooterHome.jsx";
import PlaceholderMedia from "../components/home/PlaceholderMedia.jsx";
import { FiBox, FiBarChart2, FiShield, FiUsers } from "react-icons/fi";
import { Link } from "react-router-dom";

const Home = () => {
  return (
    <div className="min-h-screen flex flex-col relative bg-background transition-colors duration-300">
      <HeaderHome />

      <main className="flex-grow pt-32 pb-16">
        {/* ================= HERO SECTION ================= */}
        <section className="px-6 md:px-12 max-w-7xl mx-auto mb-24 relative">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            {/* Left Content */}
            <div className="animate-fade-up">
              <h1 className="font-display text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight text-text-primary leading-[1.1] mb-8">
                O controle total <br /> do seu <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent-purple to-accent-pink">estoque.</span>
              </h1>
              <p className="text-lg text-text-secondary max-w-lg mb-10 leading-relaxed font-secondary">
                Sistema de gerenciamento completo para controle de mercadorias, fornecedores e movimentações com precisão. Projetado para decisões estratégicas.
              </p>
              <div className="flex flex-wrap gap-4 items-center mb-10">
                <Link to="/auth" className="btn-primary px-8 py-4 font-semibold text-sm">
                  Começar Agora
                </Link>
                <a href="#modulos" className="btn-secondary px-8 py-4 font-semibold text-sm">
                  Conhecer Módulos
                </a>
              </div>
            </div>

            {/* Right Content - Media Collage */}
            <div className="relative h-[500px] w-full flex gap-4 animate-scale-in" style={{ animationDelay: '0.1s' }}>
               {/* Main large image */}
               <PlaceholderMedia 
                  text="Dashboard Principal"
                  className="w-2/3 h-full rounded-3xl"
                  aspectRatio=""
               />
               
               {/* Right column with 2 smaller images */}
               <div className="w-1/3 flex flex-col gap-4">
                  <PlaceholderMedia 
                    text="App Mobile"
                    className="h-3/5 rounded-3xl"
                    aspectRatio=""
                  />
                  <PlaceholderMedia 
                    text="Analytics"
                    className="h-2/5 rounded-3xl bg-accent-purple/10"
                    aspectRatio=""
                    iconSize={20}
                  />
               </div>
            </div>
          </div>
        </section>

        {/* ================= METRICS SECTION ================= */}
        <section className="border-y border-[var(--color-border-light)] bg-[var(--color-surface)] mb-24">
          <div className="max-w-7xl mx-auto px-6 py-12 flex flex-wrap justify-between gap-8 md:gap-12">
            {[
              { value: "10k+", label: "Movimentações Mês" },
              { value: "99.9%", label: "Uptime Garantido" },
              { value: "Nuvem", label: "Mídia Segura" },
              { value: "100%", label: "Controle de Saldo" },
            ].map((metric, i) => (
              <div key={i} className="text-center md:text-left flex-1 min-w-[150px]">
                <h3 className="font-display text-4xl font-bold text-text-primary mb-2">{metric.value}</h3>
                <p className="text-sm font-medium text-text-secondary font-secondary">{metric.label}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ================= WHY CHOOSE US ================= */}
        <section id="funcionalidades" className="px-6 md:px-12 max-w-7xl mx-auto mb-32 pt-20">
          <div className="mb-16">
            <span className="text-xs font-mono font-bold tracking-widest uppercase text-accent-purple mb-4 block">
              Diferenciais
            </span>
            <h2 className="font-display text-4xl md:text-5xl font-bold text-text-primary max-w-2xl leading-tight">
              Por que a operação confia no Estoque.OS
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
             {/* Map/Globe Placeholder block */}
             <div className="md:col-span-1 glass-card p-8 rounded-3xl flex flex-col">
               <PlaceholderMedia 
                  text="Distribuição"
                  className="w-full h-48 mb-8 rounded-2xl bg-transparent border-none opacity-50"
               />
               <h3 className="font-display text-xl font-bold text-text-primary mb-3">Auditoria Completa</h3>
               <p className="text-sm text-text-secondary leading-relaxed">
                 Todo registro de entrada e saída é assinado pelo operador responsável, garantindo total transparência e rastreabilidade na operação.
               </p>
             </div>

             {/* Features List */}
             <div className="md:col-span-1 flex flex-col gap-6">
                <div className="glass-card p-8 rounded-3xl flex-1 hover-card">
                  <FiShield className="w-8 h-8 text-accent-purple mb-6" />
                  <h3 className="font-display text-lg font-bold text-text-primary mb-2">Controle de Acesso (RBAC)</h3>
                  <p className="text-sm text-text-secondary leading-relaxed">
                    Permissões granulares para Administradores, Gerentes e Operadores. Acesso restrito e seguro.
                  </p>
                </div>
                <div className="glass-card p-8 rounded-3xl flex-1 hover-card">
                  <FiBox className="w-8 h-8 text-accent-pink mb-6" />
                  <h3 className="font-display text-lg font-bold text-text-primary mb-2">Gestão Estruturada</h3>
                  <p className="text-sm text-text-secondary leading-relaxed">
                    Organização por categorias, vínculo com fornecedores e bloqueio de saldos negativos automáticos.
                  </p>
                </div>
             </div>

             {/* Visual Feature Card */}
             <div className="md:col-span-1 relative rounded-3xl overflow-hidden group">
               <PlaceholderMedia 
                  type="video"
                  text="Demonstração do Painel"
                  className="w-full h-full min-h-[400px] border-none rounded-3xl group-hover:scale-105 transition-transform duration-700"
               />
               <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none" />
               <div className="absolute bottom-0 left-0 p-8 w-full z-10">
                 <h3 className="font-display text-xl font-bold text-white mb-2">Veja na prática</h3>
                 <p className="text-sm text-gray-300">
                   Integração perfeita com Cloudinary para imagens de produtos em alta velocidade.
                 </p>
               </div>
             </div>
          </div>
        </section>

        {/* ================= MODULES (DESTINATIONS) ================= */}
        <section id="modulos" className="px-6 md:px-12 max-w-7xl mx-auto mb-32 pt-20">
           <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
              <div>
                <h2 className="font-display text-4xl md:text-5xl font-bold text-text-primary max-w-xl leading-tight">
                  Módulos Essenciais
                </h2>
                <p className="text-text-secondary mt-4 max-w-md">
                  Explore as interfaces desenvolvidas para acelerar o dia a dia da sua gestão de suprimentos.
                </p>
              </div>
              <Link to="/auth" className="btn-secondary px-6 py-3 text-sm font-semibold whitespace-nowrap">
                Acessar Sistema Completo
              </Link>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { title: "Dashboard Estatístico", desc: "Métricas financeiras e avisos de estoque baixo.", tag: "KPIs" },
                { title: "Gestão de Produtos", desc: "Cadastro completo com upload de mídia.", tag: "Catálogo" },
                { title: "Movimentações", desc: "Histórico de entradas e saídas detalhado.", tag: "Controle" },
                { title: "Usuários e Acessos", desc: "Configuração de contas e papéis.", tag: "Segurança" },
              ].map((mod, i) => (
                <div key={i} className="flex flex-col gap-4 group cursor-pointer">
                  <div className="relative rounded-3xl overflow-hidden aspect-[3/4]">
                    <PlaceholderMedia 
                       text={`Screenshot ${mod.title}`}
                       className="w-full h-full transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute top-4 left-4">
                      <span className="bg-white/90 dark:bg-black/80 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider text-text-primary shadow-sm border border-[var(--color-border-light)]">
                        {mod.tag}
                      </span>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-display font-bold text-lg text-text-primary group-hover:text-accent-purple transition-colors">
                      {mod.title}
                    </h4>
                    <p className="text-sm text-text-secondary mt-1">{mod.desc}</p>
                  </div>
                </div>
              ))}
           </div>
        </section>

        {/* ================= CTA ================= */}
        <section className="px-6 md:px-12 max-w-5xl mx-auto mb-20">
          <div className="glass-container p-12 md:p-20 text-center relative overflow-hidden flex flex-col items-center">
            {/* Background Glows */}
            <div className="absolute -top-24 -right-24 w-64 h-64 bg-accent-purple/20 rounded-full blur-[80px]" />
            <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-accent-pink/20 rounded-full blur-[80px]" />
            
            <FiUsers className="w-12 h-12 text-accent-purple mb-6 relative z-10" />
            <h2 className="font-display text-4xl font-bold text-text-primary mb-6 relative z-10">
              Transforme a gestão do seu estoque hoje.
            </h2>
            <p className="text-text-secondary max-w-xl mx-auto mb-10 text-lg relative z-10">
              Faça login no painel administrativo e experimente o nível de controle, performance e segurança que sua operação exige.
            </p>
            <Link to="/auth" className="btn-primary px-10 py-5 font-semibold relative z-10 text-lg shadow-xl shadow-accent-purple/20">
              Fazer Login no Painel
            </Link>
          </div>
        </section>
      </main>

      <FooterHome />
    </div>
  );
};

export default Home;