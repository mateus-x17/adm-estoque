// arquivo responsável por exibir toast informativo durante conexões e cold-start da API no Render

let toastContainer = null;
let removeTimeout = null;

export const showServerToast = (
  message = "Aguardando resposta da API (serviços em repouso no Render podem levar alguns segundos para inicializar)..."
) => {
  if (typeof document === "undefined") return;

  clearTimeout(removeTimeout);

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

    // Força reflow para aplicar animação de entrada
    void toastContainer.offsetWidth;
  }

  const textEl = toastContainer.querySelector("#server-toast-text");
  if (textEl) {
    textEl.textContent = message;
  }

  toastContainer.classList.remove("opacity-0", "-translate-y-3", "scale-95");
  toastContainer.classList.add("opacity-100", "translate-y-0", "scale-100");
};

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
