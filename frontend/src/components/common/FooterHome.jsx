import { NavLink } from "react-router-dom";

// arquivo responsável pelo rodapé institucional da landing page pública do Estoque.OS em React e Tailwind CSS.

// função responsável por renderizar o rodapé institucional com links rápidos e selo operacional.
//
// 1 - recebe nenhum parâmetro de entrada.
// 2 - monta as colunas da marca, indicador de status operacional e links de navegação pública.
// 3 - retorna o JSX do rodapé com espaçamento compacto.
const FooterHome = () => {
  return (
    <footer className="border-t border-[var(--color-border)] bg-background transition-colors duration-300 relative z-10 pt-10 pb-6">
      <div className="max-w-6xl mx-auto px-5 sm:px-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-8">
        {/* Brand */}
        <div className="col-span-1 lg:col-span-2">
          <NavLink to="/" className="flex items-baseline gap-1 font-display mb-3">
            <span className="text-xl font-bold tracking-tight text-text-primary">ESTOQUE</span>
            <span className="text-xl font-bold tracking-tight text-accent-purple font-mono">.OS</span>
          </NavLink>
          <p className="text-sm text-text-secondary mb-4 max-w-sm">
            Gestão inteligente de inventário, projetada para performance e transparência.
          </p>
          <div className="flex items-center gap-2 font-mono text-xs text-accent-green bg-[var(--color-surface)] border border-[var(--color-border-light)] w-max px-3 py-1.5 rounded-full">
            <span className="h-1.5 w-1.5 rounded-full bg-accent-green animate-pulse" />
            Sistemas Operacionais
          </div>
        </div>

        {/* Links */}
        <div>
          <h4 className="font-semibold text-text-primary mb-3 font-display">Navegação</h4>
          <ul className="space-y-2 text-sm text-text-secondary">
            <li><a href="#funcionalidades" className="hover:text-accent-purple transition-colors">Funcionalidades</a></li>
            <li><a href="#modulos" className="hover:text-accent-purple transition-colors">Módulos</a></li>
            <li><NavLink to="/dashboard" className="hover:text-accent-purple transition-colors">Painel</NavLink></li>
            <li><NavLink to="/auth" className="hover:text-accent-purple transition-colors">Acessar Sistema</NavLink></li>
          </ul>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-5 sm:px-6 pt-5 border-t border-[var(--color-border-light)] flex flex-col md:flex-row items-center justify-between gap-3">
        <p className="text-xs text-text-secondary font-mono">
          © {new Date().getFullYear()} Estoque.OS · Desenvolvido por Mateus Inácio
        </p>
        <div className="flex gap-4">
          <div className="w-8 h-8 rounded-full bg-[var(--color-surface)] border border-[var(--color-border-light)] hover:bg-[var(--color-border-light)] transition-colors cursor-pointer" />
          <div className="w-8 h-8 rounded-full bg-[var(--color-surface)] border border-[var(--color-border-light)] hover:bg-[var(--color-border-light)] transition-colors cursor-pointer" />
        </div>
      </div>
    </footer>
  );
};

export default FooterHome;