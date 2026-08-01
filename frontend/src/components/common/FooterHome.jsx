const FooterHome = () => {
  return (
    <footer className="border-t border-[var(--line)] bg-[var(--bg)] transition-colors duration-300">
      <div className="max-w-6xl mx-auto px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2 font-mono text-xs text-[var(--teal)]">
          <span className="h-1.5 w-1.5 rounded-full bg-[var(--teal)] animate-pulse" />
          SISTEMA OPERACIONAL
        </div>
        <p className="text-xs text-[var(--ink-soft)]">
          © 2024 Estoque.OS · Mateus Inácio
        </p>
      </div>
    </footer>
  );
};

export default FooterHome;