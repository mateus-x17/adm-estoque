// arquivo responsável por gerenciar a exibição e ocultação de toast informativo no DOM durante conexões e cold-start da API no Render.

let toastContainer = null;
let removeTimeout = null;

// função responsável por exibir ou atualizar o toast de conexão com o servidor no topo da tela.
//
// 1 - recebe message (string opcional) descrevendo o status atual da requisição.
// 2 - cancela eventual temporizador de remoção pendente em removeTimeout.
// 3 - cria dinamicamente o container DOM #server-connection-toast se ainda não existir e o anexa em document.body.
// 4 - preenche o texto com segurança via textContent em #server-toast-text e aplica classes de transição de entrada.
// 5 - não retorna valor.
export const showServerToast = (
  message = "Aguardando resposta da API (serviços em repouso no Render podem levar alguns segundos para inicializar)..."
) => {
  if (typeof document === "undefined") return;

  clearTimeout(removeTimeout);

  // 3 - instancia o elemento do toast caso não esteja montado no documento
  if (!toastContainer) {
    toastContainer = document.createElement("div");
    toastContainer.id = "server-connection-toast";
    toastContainer.setAttribute("role", "status");
    toastContainer.setAttribute("aria-live", "polite");
    toastContainer.className =
      "fixed top-5 left-1/2 -translate-x-1/2 z-[99999] pointer-events-auto transition-all duration-300 ease-out opacity-0 -translate-y-3 scale-95";

    toastContainer.innerHTML = `
      <div class="flex items-center gap-3.5 bg-[var(--color-bg)] border border-[var(--color-border)] rounded-2xl p-4 shadow-2xl min-w-[310px] max-w-md">
        <div class="flex-shrink-0 flex items-center justify-center w-9 h-9 rounded-full border border-accent-lilac/40 bg-accent-lilac/10 text-accent-lilac">
          <svg class="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
          </svg>
        </div>
        <div class="flex-1 min-w-0 pr-1">
          <h2 class="font-display text-xs font-semibold text-text-primary tracking-wide uppercase">
            Conectando ao servidor
          </h2>
          <p id="server-toast-text" class="text-xs text-text-secondary leading-snug break-words mt-0.5"></p>
        </div>
      </div>
    `;

    document.body.appendChild(toastContainer);

    // força reflow para disparar transição CSS de entrada na primeira montagem
    void toastContainer.offsetWidth;
  }

  // 4 - atualiza o texto de forma segura e exibe o toast
  const textEl = toastContainer.querySelector("#server-toast-text");
  if (textEl) {
    textEl.textContent = message;
  }

  toastContainer.classList.remove("opacity-0", "-translate-y-3", "scale-95");
  toastContainer.classList.add("opacity-100", "translate-y-0", "scale-100");
};

// função responsável por ocultar gradualmente e remover do DOM o toast de conexão com o servidor.
//
// 1 - verifica se document e toastContainer existem para evitar erro fora de navegador.
// 2 - alterna classes CSS para animar o fade-out e deslocamento vertical.
// 3 - agenda remoção definitiva de toastContainer do DOM após 350ms e limpa a referência.
// 4 - não retorna valor.
export const hideServerToast = () => {
  if (typeof document === "undefined" || !toastContainer) return;

  toastContainer.classList.remove("opacity-100", "translate-y-0", "scale-100");
  toastContainer.classList.add("opacity-0", "-translate-y-3", "scale-95");

  clearTimeout(removeTimeout);
  removeTimeout = setTimeout(() => {
    if (toastContainer && toastContainer.parentNode) {
      toastContainer.parentNode.removeChild(toastContainer);
      toastContainer = null;
    }
  }, 350);
};
