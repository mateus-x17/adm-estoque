const FooterHome = () => {
  return (
    <footer className="border-t border-[var(--color-border)] bg-background transition-colors duration-300 relative z-10">
      <div className="max-w-6xl mx-auto px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 font-mono text-xs text-accent-green">
          <span className="h-1.5 w-1.5 rounded-full bg-accent-green animate-pulse" />
          SISTEMA OPERACIONAL ATIVO
        </div>
        <p className="text-xs text-text-secondary font-mono">
          © 2024 Estoque.OS · Mateus Inácio
        </p>
      </div>
    </footer>
  );
};

export default FooterHome;