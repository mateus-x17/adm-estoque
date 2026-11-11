import React from "react";
import { Link } from "react-router-dom";

// arquivo responsável pela exibição da tela de fallback HTTP 404 para rotas inexistentes na aplicação React.

// função responsável por renderizar a página amigável de erro 404 com atalho de retorno.
//
// 1 - recebe nenhum parâmetro de entrada.
// 2 - apresenta o código 404 estilizado em cartão centralizado dimensionado à altura da viewport.
// 3 - retorna o JSX com link de retorno para a página inicial.
function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[100dvh] bg-background relative overflow-hidden px-4">
      {/* Decorative gradients */}
      <div className="absolute top-1/4 left-1/4 w-[40%] h-[40%] bg-accent-purple/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[40%] h-[40%] bg-accent-pink/20 rounded-full blur-[120px] pointer-events-none" />

      <div className="glass-card border border-[var(--color-border)] p-8 sm:p-10 text-center rounded-3xl z-10 max-w-md w-full shadow-[0_20px_40px_-15px_rgba(0,0,0,0.5)]">
        <h1 className="font-display text-7xl sm:text-8xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-accent-purple to-accent-pink mb-3">
          404
        </h1>
        <h2 className="text-xl md:text-2xl font-semibold text-text-primary mb-2">
          Página não encontrada
        </h2>
        <p className="text-sm text-text-secondary mb-6">
          O caminho que você tentou acessar não existe ou foi movido.
        </p>
        <Link to="/" className="btn-primary w-full inline-block py-2.5 text-sm font-semibold">
          Voltar para Home
        </Link>
      </div>
    </div>
  );
}

export default NotFound;
