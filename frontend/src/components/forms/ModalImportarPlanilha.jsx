import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  FiUploadCloud,
  FiDownload,
  FiCheckCircle,
  FiAlertTriangle,
  FiX,
  FiFileText,
} from "react-icons/fi";
import { productsApi } from "../../services/api/index.js";
import { useUserStore } from "../../store/userStore.js";
import { useTenantStore } from "../../store/useTenantStore.js";

// arquivo responsável por renderizar o modal de importação em lote de produtos via planilhas (.xlsx e .csv)
// 1 - Permite baixar a planilha modelo oficial (.xlsx ou .csv) pronta para preenchimento
// 2 - Executa pré-validação ('preview') exibindo novas categorias/fornecedores e eventuais erros por linha
// 3 - Permite ao ADMIN selecionar a loja alvo quando estiver em visão consolidada e confirma via transação atômica ('commit')

// função responsável por renderizar o modal de importação em lote de produtos via planilhas .xlsx e .csv.
//
// 1 - recebe isOpen (boolean), onClose (function) e onImported (function).
// 2 - gerencia download do modelo, seleção da loja alvo para ADMIN, pré-validação e efetivação transacional.
// 3 - retorna o modal via createPortal com rolagem controlada e max-h-[92dvh] ou null quando fechado.
const ModalImportarPlanilha = ({ isOpen, onClose, onImported }) => {
  const user = useUserStore((state) => state.user);
  const { stores, selectedLojaId } = useTenantStore();
  const isAdmin = user?.role === "ADMIN";

  const [targetLojaId, setTargetLojaId] = useState("");
  const [file, setFile] = useState(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [loadingCommit, setLoadingCommit] = useState(false);
  const [downloadingTpl, setDownloadingTpl] = useState(false);
  const [previewData, setPreviewData] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [commitErrors, setCommitErrors] = useState([]);
  const [successMsg, setSuccessMsg] = useState("");

  useEffect(() => {
    if (!isOpen) return;
    if (isAdmin) {
      if (selectedLojaId && selectedLojaId !== "all") {
        setTargetLojaId(String(selectedLojaId));
      } else if (stores.length > 0) {
        setTargetLojaId(String(stores[0].id));
      }
    } else if (user?.lojaId) {
      setTargetLojaId(String(user.lojaId));
    }
  }, [isOpen, isAdmin, selectedLojaId, stores, user]);

  if (!isOpen) return null;

  // função auxiliar para acionar o download de um Blob retornado pela API no navegador
  // 1 - Cria URL temporária em memória via URL.createObjectURL
  // 2 - Dispara clique em elemento <a> invisível com o nome sugerido pelo servidor
  // 3 - Revoga a URL imediatamente após o download para evitar vazamento de memória
  const triggerBlobDownload = (blob, filename) => {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  };

  // função para baixar a planilha modelo oficial nos formatos .xlsx ou .csv
  // 1 - Requisita o arquivo modelo autenticado ao endpoint /products/import/template
  // 2 - Inicia o download local mantendo a formatação padrão aceita na importação
  const handleDownloadTemplate = async (format) => {
    setDownloadingTpl(true);
    setErrorMsg("");
    try {
      const { blob, filename } = await productsApi.downloadImportTemplate(format);
      triggerBlobDownload(blob, filename || `modelo-importacao-produtos.${format}`);
    } catch (err) {
      setErrorMsg(err.message || "Erro ao baixar planilha modelo.");
    } finally {
      setDownloadingTpl(false);
    }
  };

  // função para validar o arquivo selecionado localmente antes de enviar ao backend
  // 1 - Verifica extensão permitida (.xlsx ou .csv) e limite máximo de 2MB
  // 2 - Limpa pré-visualizações e mensagens anteriores para evitar estado obsoleto
  const handleFileChange = (e) => {
    const selected = e.target.files?.[0] || null;
    setPreviewData(null);
    setErrorMsg("");
    setCommitErrors([]);
    setSuccessMsg("");

    if (!selected) {
      setFile(null);
      return;
    }

    const lower = selected.name.toLowerCase();
    if (!lower.endsWith(".xlsx") && !lower.endsWith(".csv")) {
      setErrorMsg("Formato inválido. Selecione um arquivo .xlsx ou .csv.");
      setFile(null);
      return;
    }

    if (selected.size > 2 * 1024 * 1024) {
      setErrorMsg("Arquivo excede o limite de 2 MB por importação.");
      setFile(null);
      return;
    }

    setFile(selected);
  };

  // função para enviar a planilha em modo 'preview' e validar todas as linhas sem gravar no banco
  // 1 - Chama POST /products/import?mode=preview via FormData
  // 2 - Armazena o resumo de linhas válidas, erros e novas entidades detectadas
  const handlePreview = async () => {
    if (!file) {
      setErrorMsg("Selecione uma planilha .xlsx ou .csv antes de pré-validar.");
      return;
    }

    setLoadingPreview(true);
    setErrorMsg("");
    setCommitErrors([]);
    setSuccessMsg("");

    try {
      const data = await productsApi.importProducts(file, "preview", isAdmin ? targetLojaId : null);
      setPreviewData(data);
    } catch (err) {
      setErrorMsg(err.message || "Não foi possível ler a planilha enviada.");
      if (err.data?.errors) {
        setCommitErrors(err.data.errors);
      }
    } finally {
      setLoadingPreview(false);
    }
  };

  // função para efetivar a importação em lote dentro de transação atômica no backend
  // 1 - Impede o envio caso existam linhas inválidas no preview atual
  // 2 - Chama POST /products/import?mode=commit e notifica a página pai para recarregar o catálogo
  const handleCommit = async () => {
    if (!file) return;

    setLoadingCommit(true);
    setErrorMsg("");
    setCommitErrors([]);

    try {
      const result = await productsApi.importProducts(file, "commit", isAdmin ? targetLojaId : null);
      setSuccessMsg(
        result.message ||
          `${result.createdCount || 0} produto(s) importado(s) com sucesso.`
      );
      if (onImported) {
        onImported(result);
      }
    } catch (err) {
      setErrorMsg(err.message || "Falha ao importar produtos da planilha.");
      if (err.data?.errors) {
        setCommitErrors(err.data.errors);
      }
    } finally {
      setLoadingCommit(false);
    }
  };

  const errorsToShow =
    commitErrors.length > 0 ? commitErrors : previewData?.errors || [];
  const canCommit =
    Boolean(file) &&
    Boolean(previewData) &&
    !previewData.hasErrors &&
    previewData.validCount > 0 &&
    !successMsg;

  return createPortal(
    <div
      className="fixed inset-0 z-[105] flex items-center justify-center bg-black/60 backdrop-blur-sm p-3 sm:p-4 transition-opacity duration-300"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-3xl max-h-[92dvh] bg-[var(--color-bg)] border border-[var(--color-border)] rounded-2xl shadow-[0_12px_40px_rgba(0,0,0,0.45)] flex flex-col overflow-hidden animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabeçalho */}
        <header className="flex items-center justify-between px-4 sm:px-5 py-3 border-b border-[var(--color-border)] bg-[var(--color-surface)]">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-accent-purple/15 text-accent-purple flex items-center justify-center shrink-0">
              <FiUploadCloud size={17} />
            </div>
            <div className="min-w-0">
              <h2 className="font-display text-base font-semibold text-text-primary truncate">
                Importar Produtos por Planilha
              </h2>
              <p className="text-xs text-text-secondary truncate">
                Suba arquivos .xlsx ou .csv com pré-validação linha a linha
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-text-secondary hover:text-text-primary hover:bg-white/5 transition-colors shrink-0"
            aria-label="Fechar modal"
          >
            <FiX size={18} />
          </button>
        </header>

        {/* Conteúdo rolável */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3.5 custom-scrollbar">
          {isAdmin && stores.length > 0 && (
            <div className="p-3.5 rounded-2xl border border-accent-purple/30 bg-accent-purple/5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              <div>
                <p className="text-xs font-semibold text-text-primary">Filial de destino da importação</p>
                <p className="text-[11px] text-text-secondary">
                  Os produtos e categorias novas serão criados nesta loja
                </p>
              </div>
              <select
                value={targetLojaId}
                onChange={(e) => {
                  setTargetLojaId(e.target.value);
                  setPreviewData(null);
                  setSuccessMsg("");
                }}
                className="px-3 py-2 rounded-xl border border-[var(--color-border-light)] bg-[var(--color-surface)] text-xs font-medium text-text-primary outline-none focus:border-accent-purple"
              >
                {stores.map((st) => (
                  <option key={st.id} value={String(st.id)}>
                    {st.nome}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Bloco 1: Download de Planilha Modelo */}
          <div className="glass-card p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold text-text-primary flex items-center gap-1.5">
                <FiFileText size={14} className="text-accent-pink" />
                Planilha Modelo Oficial
              </p>
              <p className="text-[11px] text-text-secondary mt-0.5">
                Colunas aceitas: <span className="font-mono">nome, descricao, preco, quantidade, categoria, fornecedor, ativo</span>
              </p>
            </div>
            <div className="flex flex-wrap gap-2 shrink-0">
              <button
                type="button"
                disabled={downloadingTpl}
                onClick={() => handleDownloadTemplate("xlsx")}
                className="btn-secondary px-3 py-1.5 text-xs font-semibold flex items-center gap-1.5"
              >
                <FiDownload size={13} /> Modelo .XLSX
              </button>
              <button
                type="button"
                disabled={downloadingTpl}
                onClick={() => handleDownloadTemplate("csv")}
                className="btn-secondary px-3 py-1.5 text-xs font-semibold flex items-center gap-1.5"
              >
                <FiDownload size={13} /> Modelo .CSV
              </button>
            </div>
          </div>

          {/* Bloco 2: Seleção do Arquivo */}
          <div className="p-4 rounded-2xl border border-dashed border-[var(--color-border-light)] bg-[var(--color-surface)] space-y-3">
            <label className="block text-xs font-semibold text-text-primary">
              Selecione a planilha preenchida (.xlsx ou .csv, até 2 MB)
            </label>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <input
                type="file"
                accept=".xlsx,.csv"
                onChange={handleFileChange}
                className="flex-1 text-xs text-text-secondary file:mr-3 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-accent-purple/15 file:text-accent-purple hover:file:bg-accent-purple/25 transition-colors"
              />
              <button
                type="button"
                onClick={handlePreview}
                disabled={!file || loadingPreview || loadingCommit}
                className="btn-secondary px-4 py-2 text-xs font-semibold disabled:opacity-50 whitespace-nowrap"
              >
                {loadingPreview ? "Validando..." : "Pré-validar Planilha"}
              </button>
            </div>
            {file && (
              <p className="font-mono text-[11px] text-text-secondary">
                Arquivo selecionado: <span className="text-text-primary">{file.name}</span> ({(file.size / 1024).toFixed(1)} KB)
              </p>
            )}
          </div>

          {/* Mensagens de erro ou sucesso */}
          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-accent-red/10 border border-accent-red/25 text-accent-red text-xs flex items-start gap-2.5">
              <FiAlertTriangle size={16} className="shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-4 rounded-xl bg-accent-green/10 border border-accent-green/25 text-accent-green text-xs flex items-start gap-2.5">
              <FiCheckCircle size={16} className="shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">{successMsg}</p>
                <p className="text-[11px] opacity-90 mt-1">
                  Todos os produtos foram vinculados isoladamente à sua loja.
                </p>
              </div>
            </div>
          )}

          {/* Bloco 3: Resumo da Pré-validação */}
          {previewData && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border-light)]">
                  <span className="font-mono text-[10px] uppercase text-text-secondary">Total de Linhas</span>
                  <p className="font-display text-lg font-bold text-text-primary mt-0.5">
                    {previewData.totalRows || 0}
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border-light)]">
                  <span className="font-mono text-[10px] uppercase text-text-secondary">Válidas</span>
                  <p className="font-display text-lg font-bold text-accent-green mt-0.5">
                    {previewData.validCount || 0}
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border-light)]">
                  <span className="font-mono text-[10px] uppercase text-text-secondary">Com Erro</span>
                  <p
                    className={`font-display text-lg font-bold mt-0.5 ${
                      previewData.invalidCount > 0 ? "text-accent-red" : "text-text-primary"
                    }`}
                  >
                    {previewData.invalidCount || 0}
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border-light)]">
                  <span className="font-mono text-[10px] uppercase text-text-secondary">Novas Refs.</span>
                  <p className="font-display text-lg font-bold text-accent-purple mt-0.5">
                    {(previewData.newCategories?.length || 0) + (previewData.newSuppliers?.length || 0)}
                  </p>
                </div>
              </div>

              {(previewData.newCategories?.length > 0 || previewData.newSuppliers?.length > 0) && (
                <div className="p-3.5 rounded-xl bg-accent-purple/5 border border-accent-purple/20 space-y-2 text-xs">
                  {previewData.newCategories?.length > 0 && (
                    <p className="text-text-secondary">
                      <strong className="text-text-primary">Categorias que serão criadas:</strong>{" "}
                      {previewData.newCategories.join(", ")}
                    </p>
                  )}
                  {previewData.newSuppliers?.length > 0 && (
                    <p className="text-text-secondary">
                      <strong className="text-text-primary">Fornecedores que serão criados:</strong>{" "}
                      {previewData.newSuppliers.join(", ")}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Tabela de erros por linha */}
          {errorsToShow.length > 0 && (
            <div className="rounded-2xl border border-accent-red/25 bg-accent-red/5 p-3.5 space-y-2">
              <p className="text-xs font-semibold text-accent-red">
                Linhas que precisam de correção antes da importação:
              </p>
              <div className="max-h-40 overflow-y-auto overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-accent-red/20 text-accent-red">
                      <th className="py-1.5 pr-3 font-mono">Linha</th>
                      <th className="py-1.5 pr-3">Produto</th>
                      <th className="py-1.5">Erro encontrado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-accent-red/10">
                    {errorsToShow.map((err, idx) => (
                      <tr key={idx} className="text-text-primary">
                        <td className="py-1.5 pr-3 font-mono">#{err.line}</td>
                        <td className="py-1.5 pr-3">{err.nome || "—"}</td>
                        <td className="py-1.5 text-accent-red">{err.message}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Pré-visualização dos itens válidos */}
          {previewData?.previewRows?.length > 0 && (
            <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-3.5 space-y-2">
              <p className="text-xs font-semibold text-text-primary">
                Pré-visualização ({previewData.previewRows.length} de {previewData.validCount} itens válidos)
              </p>
              <div className="max-h-48 overflow-auto">
                <table className="w-full text-left text-xs min-w-[540px]">
                  <thead>
                    <tr className="border-b border-[var(--color-border)] text-text-secondary">
                      <th className="py-1.5 pr-2 font-mono">Lin.</th>
                      <th className="py-1.5 pr-2">Nome</th>
                      <th className="py-1.5 pr-2">Preço</th>
                      <th className="py-1.5 pr-2">Qtd.</th>
                      <th className="py-1.5 pr-2">Categoria</th>
                      <th className="py-1.5 pr-2">Fornecedor</th>
                      <th className="py-1.5">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--color-border-light)]">
                    {previewData.previewRows.map((row, idx) => (
                      <tr key={idx} className="text-text-primary">
                        <td className="py-1.5 pr-2 font-mono text-text-secondary">{row.line}</td>
                        <td className="py-1.5 pr-2 font-medium truncate max-w-[160px]">{row.nome}</td>
                        <td className="py-1.5 pr-2 font-mono">
                          R$ {Number(row.preco || 0).toFixed(2)}
                        </td>
                        <td className="py-1.5 pr-2 font-mono">{row.quantidade}</td>
                        <td className="py-1.5 pr-2 text-text-secondary">{row.categoriaNome || "—"}</td>
                        <td className="py-1.5 pr-2 text-text-secondary">{row.fornecedorNome || "—"}</td>
                        <td className="py-1.5">
                          <span
                            className={`px-2 py-0.5 rounded-full font-mono text-[10px] ${
                              row.ativo
                                ? "bg-accent-green/10 text-accent-green"
                                : "bg-white/10 text-text-secondary"
                            }`}
                          >
                            {row.ativo ? "Ativo" : "Inativo"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Rodapé */}
        <footer className="px-4 sm:px-5 py-3 border-t border-[var(--color-border)] bg-[var(--color-surface)] flex flex-col-reverse sm:flex-row justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="btn-secondary px-5 py-2 text-xs font-semibold w-full sm:w-auto"
          >
            {successMsg ? "Fechar" : "Cancelar"}
          </button>
          <button
            type="button"
            disabled={!canCommit || loadingCommit}
            onClick={handleCommit}
            className="btn-primary px-5 py-2 text-xs font-semibold w-full sm:w-auto disabled:opacity-50"
          >
            {loadingCommit
              ? "Importando..."
              : `Confirmar Importação (${previewData?.validCount || 0})`}
          </button>
        </footer>
      </div>
    </div>,
    document.body
  );
};

export default ModalImportarPlanilha;

