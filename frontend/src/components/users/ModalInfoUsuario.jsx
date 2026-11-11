import React from "react";
import { createPortal } from "react-dom";
import {
  FiX,
  FiUserCheck,
  FiPauseCircle,
  FiSun,
  FiUserX,
  FiEdit2,
  FiPhone,
  FiMail,
  FiCalendar,
  FiMapPin,
  FiBriefcase,
  FiFileText,
} from "react-icons/fi";
import { formatImageUrl } from "../../utils/imageHelper.js";

// arquivo responsável pelo popup de ficha completa do colaborador (ativos, suspensos, férias e desligados c/ data de demissão)

const SITUACAO_LABELS = {
  ATIVO: {
    label: "Contratado (Atuando)",
    badge: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  },
  SUSPENSO: {
    label: "Suspenso",
    badge: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  },
  FERIAS: {
    label: "Em Férias",
    badge: "bg-sky-500/15 text-sky-400 border-sky-500/30",
  },
  DESLIGADO: {
    label: "Desligado (Matrícula Cancelada)",
    badge: "bg-accent-red/15 text-accent-red border-accent-red/30",
  },
};

const getInitials = (name = "") =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase();

// função responsável por exibir a ficha detalhada do colaborador e ações de situação trabalhista.
//
// 1 - recebe user (object), isSelf (boolean), actionLoading (boolean) e callbacks onClose, onEdit, onChangeSituation, onDismiss e onOpenReport.
// 2 - exibe matrícula, situação, admissão, data de demissão (quando desligado) e botões de controle condicional.
// 3 - retorna o modal via createPortal dimensionado em max-h-[92dvh] ou null quando user for nulo.
const ModalInfoUsuario = ({
  user,
  isSelf = false,
  actionLoading = false,
  onClose,
  onEdit,
  onChangeSituation,
  onDismiss,
  onOpenReport,
}) => {
  if (!user) return null;

  const situacaoKey = user.situacao || "ATIVO";
  const sitInfo = SITUACAO_LABELS[situacaoKey] || SITUACAO_LABELS.ATIVO;
  const isDismissed = situacaoKey === "DESLIGADO" || Boolean(user.excluido);
  const matriculaDisplay =
    user.matriculaDisplay ||
    (isDismissed
      ? `${user.matricula || `MAT-${String(user.id).padStart(5, "0")}`} (CANCELADA)`
      : user.matricula || `MAT-${String(user.id).padStart(5, "0")}`);
  const isSuspendedOrLeave = situacaoKey === "SUSPENSO" || situacaoKey === "FERIAS";
  const dataAdmissaoFormatted = user.dataAdmissao
    ? new Date(user.dataAdmissao).toLocaleDateString("pt-BR")
    : new Date(user.createdAt).toLocaleDateString("pt-BR");
  const dataDemissaoRaw = user.dataDemissao || user.dataTermino;
  const dataDemissaoFormatted = dataDemissaoRaw
    ? new Date(dataDemissaoRaw).toLocaleDateString("pt-BR")
    : null;

  return createPortal(
    <div
      className="fixed inset-0 z-[115] flex items-center justify-center bg-black/65 backdrop-blur-sm p-4 animate-fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-3xl bg-[var(--color-bg)] border border-[var(--color-border-light)] shadow-2xl overflow-hidden flex flex-col max-h-[92dvh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabeçalho */}
        <div className="p-4 sm:p-5 border-b border-[var(--color-border-light)] flex items-start justify-between gap-3 bg-[var(--color-surface)]/40">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-12 h-12 rounded-full overflow-hidden border border-[var(--color-border-light)] bg-[var(--color-surface)] flex items-center justify-center font-semibold text-sm text-text-primary shrink-0">
              {user.imagem ? (
                <img
                  src={formatImageUrl(user.imagem)}
                  alt={user.nome}
                  className="w-full h-full object-cover"
                />
              ) : (
                getInitials(user.nome)
              )}
            </div>
            <div className="min-w-0">
              <h2 className="font-display text-lg font-bold text-text-primary truncate">
                {user.nome}
              </h2>
              <p className="text-xs text-text-secondary truncate flex items-center gap-1.5 mt-0.5">
                <FiMail size={12} className="shrink-0" />
                {user.email}
              </p>
              <div className="flex flex-wrap items-center gap-1.5 mt-2">
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[11px] font-mono border ${
                    isDismissed
                      ? "bg-accent-red/15 text-accent-red border-accent-red/30"
                      : "bg-accent-purple/15 text-accent-purple border-accent-purple/30"
                  }`}
                >
                  {matriculaDisplay}
                </span>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${sitInfo.badge}`}
                >
                  {sitInfo.label}
                </span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full text-text-secondary hover:text-text-primary hover:bg-white/5 transition-colors"
            title="Fechar"
          >
            <FiX size={18} />
          </button>
        </div>

        {/* Dados Cadastrais */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-3 custom-scrollbar">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
            <div className="p-3 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border-light)]">
              <span className="text-[10px] font-mono uppercase tracking-wider text-text-secondary flex items-center gap-1.5">
                <FiPhone size={11} /> Telefone
              </span>
              <p className="text-sm font-medium text-text-primary mt-1">
                {user.telefone || "Não informado"}
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border-light)]">
              <span className="text-[10px] font-mono uppercase tracking-wider text-text-secondary flex items-center gap-1.5">
                <FiBriefcase size={11} /> Cargo &amp; Permissão
              </span>
              <p className="text-sm font-medium text-text-primary mt-1">{user.role}</p>
            </div>

            <div className="p-3.5 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border-light)]">
              <span className="text-[10px] font-mono uppercase tracking-wider text-text-secondary flex items-center gap-1.5">
                <FiMapPin size={11} /> {isDismissed ? "Última Loja / Unidade" : "Loja / Unidade"}
              </span>
              <p className="text-sm font-medium text-text-primary mt-1">
                {user.role === "ADMIN" ? "Todas as Lojas (Rede)" : user.loja?.nome || "Sem filial"}
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border-light)]">
              <span className="text-[10px] font-mono uppercase tracking-wider text-text-secondary flex items-center gap-1.5">
                <FiCalendar size={11} /> Data de Admissão
              </span>
              <p className="text-sm font-medium text-text-primary mt-1">
                {dataAdmissaoFormatted}
              </p>
            </div>

            {isDismissed && (
              <div className="sm:col-span-2 p-3.5 rounded-2xl bg-accent-red/10 border border-accent-red/30">
                <span className="text-[10px] font-mono uppercase tracking-wider text-accent-red flex items-center gap-1.5">
                  <FiCalendar size={11} /> Data de Demissão (Desligamento)
                </span>
                <p className="text-sm font-bold text-text-primary mt-1">
                  {dataDemissaoFormatted || "Não informada"}
                </p>
                {user.motivo && (
                  <p className="text-xs text-text-secondary mt-1">
                    Motivo: {user.motivo}
                  </p>
                )}
              </div>
            )}
          </div>

          {isSuspendedOrLeave && (
            <div className="p-3.5 rounded-2xl border border-amber-500/30 bg-amber-500/10 text-xs text-amber-200 leading-relaxed">
              <strong>Acesso temporariamente bloqueado:</strong> Este colaborador está marcado como{" "}
              <span className="font-semibold underline">{sitInfo.label}</span>. Você pode{" "}
              <strong>Reativar</strong> o acesso imediato ou <strong>Demitir (Cancelar Matrícula)</strong>{" "}
              registrando a Data de Demissão e gerando o relatório final de vendas pelos meses trabalhados.
            </div>
          )}

          {isDismissed && (
            <div className="p-3.5 rounded-2xl border border-accent-red/30 bg-accent-red/10 text-xs text-text-secondary leading-relaxed">
              <strong>Conta desligada e acesso encerrado:</strong> A matrícula{" "}
              <span className="font-mono text-accent-red font-semibold">{matriculaDisplay}</span> permanece
              preservada para consulta histórica de vendas, admissão e demissão.
            </div>
          )}
        </div>

        {/* Rodapé com ações trabalhistas */}
        <div className="px-4 sm:px-5 py-3 border-t border-[var(--color-border-light)] bg-[var(--color-surface)]/30 flex flex-wrap items-center justify-between gap-2">
          {isDismissed ? (
            <>
              <button
                type="button"
                onClick={onClose}
                className="btn-secondary py-2 px-4 text-xs font-semibold"
              >
                Fechar
              </button>
              <button
                type="button"
                disabled={actionLoading}
                onClick={() => onOpenReport?.(user)}
                className="btn-primary py-2 px-4 text-xs font-semibold flex items-center gap-1.5 disabled:opacity-50"
              >
                <FiFileText size={13} />
                Ver Relatório Final de Vendas
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                disabled={actionLoading}
                onClick={() => onEdit(user)}
                className="btn-secondary py-2 px-3.5 text-xs font-semibold flex items-center gap-1.5"
              >
                <FiEdit2 size={13} />
                Editar Cadastro
              </button>

              {!isSelf && (
                <div className="flex flex-wrap items-center gap-2">
                  {isSuspendedOrLeave ? (
                    <button
                      type="button"
                      disabled={actionLoading}
                      onClick={() => onChangeSituation(user, "ATIVO")}
                      className="py-2 px-3.5 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/25 transition-all flex items-center gap-1.5 disabled:opacity-50"
                    >
                      <FiUserCheck size={13} />
                      Reativar Colaborador
                    </button>
                  ) : (
                    <>
                      <button
                        type="button"
                        disabled={actionLoading}
                        onClick={() => onChangeSituation(user, "SUSPENSO")}
                        className="py-2 px-3 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/30 hover:bg-amber-500/25 transition-all flex items-center gap-1.5 disabled:opacity-50"
                      >
                        <FiPauseCircle size={13} />
                        Suspender
                      </button>
                      <button
                        type="button"
                        disabled={actionLoading}
                        onClick={() => onChangeSituation(user, "FERIAS")}
                        className="py-2 px-3 rounded-full text-xs font-semibold bg-sky-500/15 text-sky-400 border border-sky-500/30 hover:bg-sky-500/25 transition-all flex items-center gap-1.5 disabled:opacity-50"
                      >
                        <FiSun size={13} />
                        Férias
                      </button>
                    </>
                  )}

                  <button
                    type="button"
                    disabled={actionLoading}
                    onClick={() => onDismiss(user)}
                    className="py-2 px-3.5 rounded-full text-xs font-semibold bg-accent-red/15 text-accent-red border border-accent-red/30 hover:bg-accent-red/25 transition-all flex items-center gap-1.5 disabled:opacity-50"
                  >
                    <FiUserX size={13} />
                    Demitir / Cancelar Matrícula
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};

export default ModalInfoUsuario;

