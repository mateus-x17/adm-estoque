# 📑 RELATÓRIO 06 — CATÁLOGO DE REGRAS DE NEGÓCIO

**Projeto:** Estoque.OS  
**Data da atualização:** 2026-11-17 *(regras `RN-001` a `RN-033` verificadas no código atual da branch `main`)*  
**Documentos relacionados:** [Guia de Leitura e Glossário](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/relatorios/00_GUIA_DE_LEITURA_E_GLOSSARIO.md) · [Relatório 11 — Catálogo Completo de Problemas](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/relatorios/11_matriz_consolidada_de_falhas.md)

---

## Resumo para quem não é técnico

As **regras de negócio** são as "leis obrigatórias" que o sistema precisa obedecer sempre — não importa quem esteja clicando ou qual tela esteja aberta. Por exemplo: *"um operador nunca pode ver quanto outro colega vendeu"*, *"não se pode apagar a última loja ativa"* ou *"um pedido cancelado nunca entra na soma do faturamento"*.

Este catálogo reúne todas as **33 regras verificadas** (`RN-001` a `RN-033`) diretamente no código do servidor, do banco de dados e das telas, indicando quais delas já são conferidas automaticamente pelos **7 cenários de teste** da suíte [multitenant_audit.test.mjs](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/tests/multitenant_audit.test.mjs).

---

## 1. Regras de autenticação, portais e separação entre empresas

- **[RN-001] Senha protegida e crachá de login (`JWT`) estrito:** senhas exigem no mínimo `6` caracteres e são guardadas com criptografia irreversível (`bcryptjs`, custo 10); o crachá de sessão (`JWT`) dura `8 horas`, é assinado e conferido exclusivamente no algoritmo `HS256` e carrega `{ id, matricula, role, organizacaoId, organizacaoSlug, organizacaoNome, lojaId, lojaSlug, lojaNome }`. *Cobertura de teste: Cenário 1.*
- **[RN-002] Cadastro público cria organização completa (`POST /auth/register`):** cria tudo junto numa única transação — a `Organizacao`, a 1ª `Loja` e o fundador `ADMIN` (`lojaId: null`). *Cobertura de teste: Cenário 1.*
- **[RN-003] Limites de acesso contra abusos (*Rate Limiting*):** servidor reconhece IP real atrás do proxy (`trust proxy = 1`) em [index.js](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/index.js) com limite global `apiLimiter` (**400 requisições / 15 min por IP**), login limitado a **25 tentativas / 15 min** (`loginLimiter`) e cadastro a **15 tentativas / 1 hora** (`registerLimiter`) em [authRoutes.js](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/routes/authRoutes.js).
- **[RN-022] Isolamento total entre empresas (`404`):** toda consulta obriga o `organizacaoId` vindo do token autenticado; tentar acessar dados de outra empresa devolve `404` (como se não existisse). Fotos no Cloudinary ficam isoladas em `estoque-os/organizacoes/<org>/lojas/<loja>/<subpasta>`. *Cobertura de teste: Cenário 2.*
- **[RN-023] E-mail único por empresa e seletor multi-empresa:** o banco garante `@@unique([organizacaoId, email])`; se a mesma pessoa tiver conta com o mesmo e-mail e senha em 2 ou mais empresas ativas, o login devolve `{ requiresOrgSelection: true, organizations }` para ela escolher onde entrar. *Cobertura de teste: Cenário 1.*
- **[RN-027] Portais separados (`portal: 'admin' | 'loja'`):** o Portal Admin (`/admin/login`) rejeita gerentes e operadores (`403`), e o Portal da Loja (`/login`) bloqueia administradores orientando a entrar pelo `/admin/login` (`403`). *Cobertura de teste: Cenário 1.*
- **[RN-033] Higienização de uploads, links, erros `500`, planilhas e PDFs:** uploads exigem extensão exata + tipo real (`MIME`) autorizados; exclusão de arquivos locais fica restrita à pasta `uploads/` (`removeLocalUploadIfSafe`); links passam por `sanitizeSafeUrl` e `formatImageUrl` bloqueando `javascript:` e `data:`; células de planilhas exportadas passam por `sanitizeSpreadsheetCell` neutralizando fórmulas (`=`, `+`, `-`, `@`); erros internos `>= 500` não vazam detalhes do banco (`errorHandler.js`); e os 4 relatórios PDF A4 aplicam `escapeHtml` contra injeção de código (**XSS**).

---

## 2. Regras de lojas, equipe e demissão preservando histórico

- **[RN-004] Apenas `ADMIN` gerencia equipe e filiais:** criar, editar ou remover usuários (`/users`) e lojas (`/stores`) retorna `403` para gerentes e operadores. *Cobertura de teste: Cenários 1 e 2.*
- **[RN-005] Proibição de autoexclusão:** ninguém pode excluir a própria conta (`400`).
- **[RN-006] e [RN-009] Proteção do último administrador da rede:** excluir ou rebaixar o cargo do único `ADMIN` restante da organização é bloqueado (`400`).
- **[RN-008] Bloqueio de auto-promoção no próprio perfil (`/users/me`):** qualquer usuário não-administrador que tentar enviar o campo `role` ao editar o próprio perfil recebe `403`.
- **[RN-024] Bloqueio imediato de empresa ou loja inativa:** se a organização ou a loja de um funcionário for desativada (`ativo = false`), login e requisições são bloqueados com `403` e o cache `userCache` é limpo na hora.
- **[RN-026] Limites claros entre `GERENTE` e `ADMIN`:** o `GERENTE` administra tudo dentro da própria `lojaId` (incluindo cancelar pedidos, importar planilhas e ver desempenho dos seus vendedores), mas recebe `403` em `/users*`, escrita em `/stores*`, tela `/dashboard/lojas` e exclusões definitivas de produtos, categorias ou fornecedores.
- **[RN-028] Transferência imediata de funcionário entre lojas (`PATCH /users/:id/store`):** apenas o `ADMIN` transfere gerentes ou operadores para outra loja ativa da mesma organização; o cache é limpo na hora e as próximas operações já refletem a nova filial. *Cobertura de teste: Cenário 5.*
- **[RN-029] Demissão real com matrícula cancelada, data de demissão e histórico intacto (`vendedorRefId`):** ao demitir em `DELETE /users/:id` (aceitando `{ dataDemissao, motivo }` opcionais), o usuário e sua foto são apagados fisicamente da tabela ativa, `usuarioId` nos registros antigos vira `NULL` (`ON DELETE SET NULL`), a ficha é arquivada em `RegistroDesligamento` e nos retratos congelados (*snapshots*), a matrícula aparece como `MAT-XXXXX (CANCELADA)` nos filtros de desligados e o servidor devolve o relatório mensal `relatorioDesligamento` (reemitível em `GET /users/:refId/dismissal-report`). *Cobertura de teste: Cenário 4.*
- **[RN-030] Proteção da última loja ativa (`/stores`):** o `ADMIN` não pode desativar nem excluir a última filial ativa da empresa (`400`). Lojas com histórico submetidas a `DELETE` são desativadas logicamente (*soft delete*).
- **[RN-032] Matrícula única e bloqueio imediato de suspensos/férias (`PATCH /users/:id/situation`):** todo usuário recebe matrícula automática (`MAT-00001`), pesquisável em equipe, pedidos, movimentações e desempenho. Mudar alguém para `SUSPENSO` ou `FERIAS` bloqueia login e acessos na hora (`403`), mantendo trava contra autossuspensão e contra suspender o último `ADMIN ATIVO`. *Cobertura de teste: Cenário 4.*

---

## 3. Regras de pedidos, catálogo, estoque e auditoria de desempenho

- **[RN-007], [RN-012], [RN-016], [RN-017] e [RN-020] Desativação lógica (*Soft Delete*) no catálogo e lojas:** `Produto`, `Categoria`, `Fornecedor` e `Loja` usam a marcação `ativo: Boolean` e passam automaticamente para inativos quando alguém tenta excluir um item que possui histórico. Produtos inativos não podem ser vendidos nem ajustados (`400`). *Cobertura de teste: Cenário 6.*
- **[RN-010], [RN-011] e [RN-015] Catálogo e categorias por filial:** nomes de categoria são únicos dentro de cada loja (`@@unique([lojaId, nome])`); somente `ADMIN` e `GERENTE` alteram o catálogo.
- **[RN-013] e [RN-014] Proteção contra vendas simultâneas e clique duplo (`FOR UPDATE` + `Idempotency-Key`):** a trava ordenada `ORDER BY id ASC FOR UPDATE` evita furos de estoque e travamentos cruzados (*deadlocks*); a chave `Idempotency-Key` (validade de 10 minutos) bloqueia duplicações; preços e totais são congelados no ato em `Decimal(10, 2)`. *Cobertura de teste: Cenário 3.*
- **[RN-018], [RN-019] e [RN-021] Sigilo de `OPERADOR` e transparência gerencial:** operadores veem **apenas** suas próprias linhas em `/orders` e `/movements` (mesmo tentando trocar `usuarioId` ou `vendedorRefId` na URL), recebem `403` em `/users/names`, `/movements/user-stats` e `/movements/performance*`, e só podem gerar seu relatório individual (`scope: 'user'`). *Cobertura de teste: Cenário 4.*
- **[RN-025] Planilhas `.xlsx` e `.csv` por filial:** pré-validação em tela (`preview`) e gravação tudo-ou-nada (`commit`, até `2 MB` e `5.000` linhas) na loja escolhida (`resolveWriteStore`), com exportação respeitando o escopo (`resolveReadScope`). *Cobertura de teste: Cenário 7.*
- **[RN-031] Estorno de pedido excluído do faturamento:** `POST /orders/:id/cancel` (apenas `ADMIN` e `GERENTE`) devolve o estoque, marca o pedido como `CANCELADO` e cria movimentos inversos com `estorno = true`. Todos os relatórios financeiros e rankings ignoram `estorno = true` e `Pedido.status = 'CANCELADO'`. *Cobertura de teste: Cenários 3 e 4.*
