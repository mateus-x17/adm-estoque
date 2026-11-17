# 📑 RELATÓRIO 11 — CATÁLOGO COMPLETO DE PROBLEMAS E CORREÇÕES

**Projeto:** Estoque.OS  
**Data da atualização:** 2026-11-17 *(base técnica verificada em 2026-11-11 e conferida no código atual da branch `main`)*  
**Documento de apoio:** Para entender siglas, ordem de leitura e linha do tempo das etapas, consulte o [Guia de Leitura e Glossário](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/relatorios/00_GUIA_DE_LEITURA_E_GLOSSARIO.md).

---

## Resumo para quem não é técnico

Durante a evolução do **Estoque.OS**, fizemos uma revisão completa procurando tudo o que poderia dar errado no dia a dia: falhas de segurança, erros de conta no estoque, telas lentas, botões que duplicavam vendas e dificuldades para manter o sistema no ar.

Ao todo, encontramos **30 problemas** divididos em 7 assuntos: **acesso e permissões**, **validação de dados**, **exatidão do estoque e do dinheiro**, **velocidade**, **funcionamento do servidor**, **telas do site** e **testes automáticos**.

Hoje, **19 desses 30 problemas estão totalmente resolvidos**, **10 estão resolvidos em grande parte** (com pequenas pendências claramente anotadas) e **apenas 1 continua aberto** (o envio de fotos ainda faz o usuário esperar alguns segundos até a imagem subir para a nuvem). Cada ficha abaixo explica, em linguagem simples, qual era o problema, por que ele era perigoso, como foi resolvido e o que ainda falta.

---

## Mapa do relatório e índice rápido

- **19** ✅ Resolvidos · **10** 🟡 Resolvidos em parte · **1** 🔴 Ainda em aberto · **0** ⚪ Risco aceito

| ID | Problema | Situação atual | Ir para a ficha |
|---|---|---|---|
| `ACESSO-01` | Qualquer pessoa podia tentar virar administrador no cadastro ou editando o próprio perfil | ✅ Resolvido | [Ver ficha](#acesso-01) |
| `ACESSO-02` | Um usuário podia ver ou alterar dados de outra empresa, de outra loja ou de áreas restritas | ✅ Resolvido | [Ver ficha](#acesso-02) |
| `ACESSO-03` | Um administrador podia excluir a si mesmo ou deixar o sistema sem nenhum administrador (ou sem loja ativa) | ✅ Resolvido | [Ver ficha](#acesso-03) |
| `ACESSO-04` | Brechas de segurança na autenticação, nos relatórios impressos (PDF) e em bibliotecas desatualizadas | 🟡 Resolvido em parte | [Ver ficha](#acesso-04) |
| `ENTRADA-01` | Formulários, uploads de arquivos, links e planilhas aceitavam dados inválidos ou maliciosos | 🟡 Resolvido em parte | [Ver ficha](#entrada-01) |
| `DADOS-01` | Excluir um registro com histórico (produto, loja ou funcionário) travava o sistema com erro genérico | ✅ Resolvido | [Ver ficha](#dados-01) |
| `DADOS-02` | Duas vendas ao mesmo tempo podiam deixar o estoque com número errado ou negativo | ✅ Resolvido | [Ver ficha](#dados-02) |
| `DADOS-03` | Operações com várias etapas podiam parar pela metade e deixar o banco incompleto | ✅ Resolvido | [Ver ficha](#dados-03) |
| `DADOS-04` | Preços e totais em dinheiro podiam ter erro de arredondamento nos centavos | ✅ Resolvido | [Ver ficha](#dados-04) |
| `DADOS-05` | Duas ações simultâneas podiam passar juntas pela mesma verificação de saldo ou cadastro | ✅ Resolvido | [Ver ficha](#dados-05) |
| `DADOS-06` | Clicar duas vezes em "Finalizar pedido" ou "Ajustar estoque" podia registrar a operação em dobro | ✅ Resolvido | [Ver ficha](#dados-06) |
| `DESEMPENHO-01` | Algumas telas puxavam todos os registros do banco de uma só vez, sem divisão por páginas | 🟡 Resolvido em parte | [Ver ficha](#desempenho-01) |
| `DESEMPENHO-02` | Relatórios de vendedores e fornecedores faziam dezenas de consultas repetidas ao banco em vez de uma só | ✅ Resolvido | [Ver ficha](#desempenho-02) |
| `DESEMPENHO-03` | O servidor puxava listas inteiras para a memória só para somar totais que o banco podia calcular direto | 🟡 Resolvido em parte | [Ver ficha](#desempenho-03) |
| `DESEMPENHO-04` | Algumas consultas traziam dados extras que a tela não precisava (e faltavam datas de criação/edição em duas tabelas) | 🟡 Resolvido em parte | [Ver ficha](#desempenho-04) |
| `DESEMPENHO-05` | O banco precisava ler tabelas inteiras por falta de índices nas buscas por empresa e loja | ✅ Resolvido | [Ver ficha](#desempenho-05) |
| `DESEMPENHO-06` | O sistema consultava o banco repetidamente para buscar os mesmos dados de usuário e listas de nomes | ✅ Resolvido | [Ver ficha](#desempenho-06) |
| `DESEMPENHO-07` | O envio de fotos para a nuvem deixava o usuário esperando a imagem subir antes de receber resposta | 🔴 Ainda em aberto | [Ver ficha](#desempenho-07) |
| `DESEMPENHO-08` | O arquivo principal do site ficou pesado para carregar de uma vez (e não há configuração Docker) | 🟡 Resolvido em parte | [Ver ficha](#desempenho-08) |
| `OPERACAO-01` | Senhas, chaves secretas ou detalhes do banco podiam aparecer em logs ou mensagens de erro | 🟡 Resolvido em parte | [Ver ficha](#operacao-01) |
| `OPERACAO-02` | Erros do sistema podiam vazar detalhes técnicos internos e retornar formatos diferentes em cada rota | ✅ Resolvido | [Ver ficha](#operacao-02) |
| `OPERACAO-03` | Faltava limite de tentativas contra ataques de força bruta ou excesso de acessos simultâneos | ✅ Resolvido | [Ver ficha](#operacao-03) |
| `OPERACAO-04` | Se o serviço de imagens (Cloudinary) travasse, a requisição podia ficar presa sem fim e deixar lixo em disco | ✅ Resolvido | [Ver ficha](#operacao-04) |
| `OPERACAO-05` | Muitas conexões simultâneas podiam esgotar o banco de dados na nuvem sem um gerenciador de conexões | ✅ Resolvido | [Ver ficha](#operacao-05) |
| `OPERACAO-06` | Cache, proteção de clique duplo e limite de acessos ficam na memória de um único servidor (impedindo escalar para 2+ servidores) | 🟡 Resolvido em parte | [Ver ficha](#operacao-06) |
| `OPERACAO-07` | Faltava rastreamento estruturado para acompanhar o caminho completo de um erro em produção | ✅ Resolvido | [Ver ficha](#operacao-07) |
| `OPERACAO-08` | Faltavam checagens de saúde do servidor e um desligamento seguro sem derrubar ações em andamento | ✅ Resolvido | [Ver ficha](#operacao-08) |
| `TELA-01` | Recarregar a página ou ficar sem login podia causar tela branca ou abrir páginas sem permissão | ✅ Resolvido | [Ver ficha](#tela-01) |
| `TELA-02` | Algumas telas chamavam o servidor fora do canal padrão, perdendo avisos e controles automáticos | 🟡 Resolvido em parte | [Ver ficha](#tela-02) |
| `QUALIDADE-01` | Falta de testes automatizados e de verificação automática antes de publicar novas versões | 🟡 Resolvido em parte | [Ver ficha](#qualidade-01) |

---

## 1. Tema: Acesso, login e permissões (`ACESSO`)

<a id="acesso-01"></a>
### 🔒 ACESSO-01 — Qualquer pessoa podia tentar virar administrador no cadastro ou editando o próprio perfil

**Situação atual:** ✅ Resolvido  
**Gravidade original:** Crítica — *o que isso significa:* um funcionário comum ou visitante mal-intencionado poderia ganhar controle total sobre a empresa, ver dados sigilosos e apagar registros.  
**Código no catálogo original:** B2

#### 1. Em uma frase
Antes, o servidor podia aceitar o cargo enviado pelo próprio usuário em pedidos de cadastro ou edição de perfil; agora o servidor decide e bloqueia qualquer tentativa de auto-promoção.

#### 2. Qual era o problema
Em sistemas web, um usuário curioso pode interceptar o formulário que o navegador envia ao servidor e acrescentar um campo extra, como `"role": "ADMIN"` (cargo de administrador).
> **Exemplo ilustrativo:** um operador de caixa entra na tela "Meu Perfil" para trocar seu telefone, mas modifica o pedido enviado ao servidor incluindo o campo `"role": "ADMIN"`. Sem bloqueio no servidor, ele passaria a ser dono da conta.

#### 3. Por que isso era um risco
Qualquer funcionário de balcão conseguiria se promover a administrador, demitir colegas, alterar preços, cancelar pedidos ou acessar dados financeiros de toda a rede de lojas.

#### 4. Por que acontecia (a causa)
Na primeira versão do sistema, era comum pegar os dados enviados pelo formulário quase sem filtro — um erro conhecido como **atribuição em massa** (*mass assignment*, quando o servidor aceita campos extras que o formulário visual nem mostrava).

#### 5. Como foi resolvido
1. **Cadastro público cria apenas uma nova organização própria:** na rota de cadastro (`POST /auth/register`), quem se cadastra passa a ser administrador apenas da **sua própria empresa recém-criada**, nunca de uma empresa que já existe.
2. **Bloqueio de cargo no próprio perfil:** na rota de editar o próprio perfil (`PUT /users/me`), qualquer tentativa de enviar ou alterar o campo `role` (cargo) é rejeitada imediatamente com erro `403` (Acesso negado).
3. **Validação estrita de cargo na gestão de equipe:** somente usuários autorizados podem criar ou editar cargos em `createUser` e `updateUser`, aceitando apenas cargos válidos (`ADMIN`, `GERENTE`, `OPERADOR`).

#### 6. Como era × como ficou
| Situação | Antes | Depois |
|---|---|---|
| Operador envia `"role": "ADMIN"` ao editar seu perfil | Podia tentar alterar o próprio cargo | Bloqueado na hora pelo servidor com erro `403` |
| Visitante se cadastra pela tela pública | Risco de cair com cargo indevido em banco único | Cria uma Organização nova e isolada só para ele |

#### 7. Como sabemos que funciona
Validado por revisão direta no código e na suíte de testes de ponta a ponta ([`multitenant_audit.test.mjs`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/tests/multitenant_audit.test.mjs)), com **7 de 7 cenários aprovados** contra o banco real na nuvem (Neon) em 11/11/2026.

#### 8. O que ainda falta
Nada pendente identificado.

#### 9. Detalhe técnico (para desenvolvedores)
- **Arquivos:** [authService.js](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/services/authService.js) · [userService.js](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/services/userService.js) · [userController.js](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/controllers/userController.js)
- **Endpoints afetados:** `POST /auth/register`, `PUT /users/me`, `POST /users`, `PUT /users/:id`
- **Etapas / Commits:** Etapa 1 — Blindagem de segurança e proteção do estoque e Etapa 8 — Uma empresa com várias lojas (`fa9b4b4`, `1e049a9`).

---

<a id="acesso-02"></a>
### 🔒 ACESSO-02 — Um usuário podia ver ou alterar dados de outra empresa, de outra loja ou de áreas restritas

**Situação atual:** ✅ Resolvido  
**Gravidade original:** Crítica — *o que isso significa:* um cliente poderia espionar produtos, vendas ou funcionários de outra empresa concorrente, ou um operador poderia acessar relatórios sigilosos apenas digitando o endereço da página.  
**Código no catálogo original:** B3

#### 1. Em uma frase
Antes, esconder botões na tela não impedia um usuário de chamar endereços restritos ou trocar códigos numéricos para ver dados de outra empresa; agora o servidor confere empresa, loja, cargo e situação do funcionário em toda requisição.

#### 2. Qual era o problema
O sistema apresentava três brechas ligadas à autorização:
1. Um usuário podia tentar trocar o número de um produto ou pedido no endereço (por exemplo, de `/orders/10` para `/orders/11`) para tentar acessar dados de outra empresa ou filial — falha chamada de **IDOR** (quando o servidor busca um registro pelo número sem conferir quem é o dono).
2. Esconder um menu na tela não bloqueava o servidor: um operador que descobrisse o endereço de relatórios de faturamento ou lista de funcionários podia tentar acessá-lo direto.
3. Algumas telas quebravam com erro `403` (proibido) porque chamavam uma rota exclusiva de administrador apenas para preencher um filtro simples de nomes.

> **Exemplo ilustrativo:** a funcionária Ana, da Loja Centro da Empresa X, envia um pedido ao servidor pedindo os dados do pedido nº 52, que pertence à Empresa Y, ou tenta cancelar uma venda mesmo sendo apenas operadora de caixa.

#### 3. Por que isso era um risco
Vazamento de segredos comerciais entre empresas clientes, alteração indevida de vendas de outras filiais, acesso de funcionários suspensos ou de férias e exposição de dados pessoais da equipe.

#### 4. Por que acontecia (a causa)
Na fase inicial o sistema era de empresa única e algumas restrições ficavam apenas no lado visual (frontend). Ao evoluir para múltiplas empresas e múltiplas lojas, tornou-se obrigatório validar a "dona" de cada registro diretamente no servidor.

#### 5. Como foi resolvido
1. **Isolamento obrigatório em dois níveis (`organizacaoId` + `lojaId`):** toda leitura e escrita no servidor passa pelo módulo de escopo (`tenantScope.js`). Qualquer tentativa de acessar um registro de outra organização devolve `404` (não encontrado), sem sequer confirmar que o registro existe.
2. **Trava de filial para Gerentes e Operadores:** gerentes e operadores ficam sempre presos à sua própria loja (`req.user.lojaId`). Apenas o administrador da rede pode alternar entre lojas.
3. **Bloqueio por cargo no servidor:** operadores recebem erro `403` (acesso negado) ao tentar acessar desempenho de vendedores (`/movements/performance*`), gestão de usuários (`/users*`) ou estorno de pedidos (`/orders/:id/cancel`).
4. **Rota segura para filtros de nomes:** foi criada uma rota enxuta (`GET /users/names`) que devolve apenas código e nome para filtros da tela, sem vazar e-mail ou dados pessoais.
5. **Bloqueio imediato de funcionários suspensos ou de férias:** o verificador de login (`authMiddleware.js`) bloqueia na hora (`403`) qualquer usuário cuja situação seja `SUSPENSO` ou `FERIAS`, mesmo que o crachá de login ainda esteja válido.
6. **Proteção de arquivos locais contra travessia de pastas:** a função `removeLocalUploadIfSafe` impede que caminhos manipulados (`../../`) apaguem arquivos fora da pasta de uploads.

#### 6. Como era × como ficou
| Situação | Antes | Depois |
|---|---|---|
| Usuário tenta ver pedido de outra empresa | Risco de exposição se só o ID fosse checado | Servidor responde `404` (isolamento total por empresa) |
| Operador tenta cancelar pedido ou ver ranking | Dependia do botão escondido na tela | Servidor bloqueia com `403` (Acesso negado) |
| Funcionário suspenso ou de férias tenta usar o sistema | Continuava logado até o token expirar | Bloqueado imediatamente com `403` no servidor |

#### 7. Como sabemos que funciona
Comprovado pela suíte automatizada de ponta a ponta ([`multitenant_audit.test.mjs`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/tests/multitenant_audit.test.mjs)), que testa isolamento entre organizações, trava de loja, bloqueio de `OPERADOR` e bloqueio de usuários suspensos (**7/7 cenários aprovados** no banco Neon em 11/11/2026).

#### 8. O que ainda falta
Nada pendente identificado.

#### 9. Detalhe técnico (para desenvolvedores)
- **Arquivos:** [tenantScope.js](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/utils/tenantScope.js) · [authMiddleware.js](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/middlewares/authMiddleware.js) · [roleMiddleware.js](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/middlewares/roleMiddleware.js) · [sanitizers.js](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/utils/sanitizers.js)
- **Funções:** `resolveReadScope`, `resolveWriteStore`, `authMiddleware`, `permit`, `removeLocalUploadIfSafe`
- **Etapas / Commits:** Etapa 7, Etapa 8 e Etapa 9 (`3c95ebc`, `fa9b4b4`, `a9dfe3e`, `1e049a9`).

---

<a id="acesso-03"></a>
### 🔒 ACESSO-03 — Um administrador podia excluir a si mesmo ou deixar o sistema sem nenhum administrador (ou sem loja ativa)

**Situação atual:** ✅ Resolvido  
**Gravidade original:** Alta — *o que isso significa:* uma empresa inteira poderia ficar trancada para fora da própria administração ou sem nenhuma loja ativa para operar.  
**Código no catálogo original:** B7

#### 1. Em uma frase
Antes, não havia trava impedindo que o único administrador fosse apagado, rebaixado ou suspenso — nem que a última loja ativa fosse desativada; agora o servidor proíbe essas ações automaticamente.

#### 2. Qual era o problema
Se o dono da empresa clicasse por engano em "Excluir" ou "Suspender" no próprio cadastro, ou rebaixasse o último administrador ativo para gerente, ninguém mais conseguiria administrar a organização. O mesmo acontecia se a última loja ativa da rede fosse desativada.
> **Exemplo ilustrativo:** Carlos é o único administrador da "TechStock". Ele muda o próprio cargo para `GERENTE` por descuido e salva. No segundo seguinte, ninguém na empresa consegue mais criar lojas ou gerenciar administradores.

#### 3. Por que isso era um risco
Paralisação administrativa total da empresa cliente, exigindo intervenção manual de um programador diretamente no banco de dados para recuperar o acesso.

#### 4. Por que acontecia (a causa)
As rotinas de atualização e exclusão de usuários e lojas executavam o comando direto sem contar antes quantos administradores ativos ou quantas lojas ativas restariam na organização.

#### 5. Como foi resolvido
1. **Bloqueio de autoexclusão e autossuspensão:** o servidor compara quem está fazendo o pedido com o usuário alvo e impede que o administrador exclua ou suspenda a própria conta.
2. **Proteção do último administrador ativo:** antes de excluir, rebaixar cargo ou alterar a situação para `SUSPENSO`/`FERIAS`, o sistema confere se restará pelo menos um outro `ADMIN` com situação `ATIVO` na organização.
3. **Proteção da última loja ativa:** ao tentar desativar uma filial, o sistema verifica se a organização continuará tendo pelo menos uma loja ativa.

#### 6. Como era × como ficou
| Situação | Antes | Depois |
|---|---|---|
| Admin tenta excluir ou suspender a própria conta | Permitido (risco de travar a conta) | Bloqueado com mensagem clara de conflito |
| Tentativa de remover/rebaixar/suspender o único Admin ativo | Sistema ficava sem administrador | Bloqueado pelo servidor |
| Tentativa de desativar a única loja ativa da empresa | Empresa ficava sem nenhuma loja | Bloqueado pelo servidor |

#### 7. Como sabemos que funciona
Verificado diretamente no código (`userService.js` e `storeService.js`) e testado nos cenários automatizados de ponta a ponta (`multitenant_audit.test.mjs`, **7/7 aprovados** em 11/11/2026).

#### 8. O que ainda falta
Nada pendente identificado para operação normal. *(Em um cenário futuro de alto volume administrativo, pode-se documentar um procedimento formal de suporte/emergência caso um dono perca sua senha).*

#### 9. Detalhe técnico (para desenvolvedores)
- **Arquivos:** [userService.js](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/services/userService.js) · [storeService.js](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/services/storeService.js)
- **Funções:** `deleteUser`, `updateUser`, `updateUserSituation`, `deleteStore`
- **Etapas / Commits:** Etapa 1 e Etapa 8 (`fa9b4b4`, `a9dfe3e`).

---

<a id="acesso-04"></a>
### 🔒 ACESSO-04 — Brechas de segurança na autenticação, nos relatórios impressos (PDF) e em bibliotecas desatualizadas

**Situação atual:** 🟡 Resolvido em parte  
**Gravidade original:** Alta — *o que isso significa:* falhas na verificação do crachá de login, falta de proteção nos PDFs gerados no navegador ou bibliotecas antigas com falhas públicas poderiam facilitar invasões.  
**Código no catálogo original:** B11

#### 1. Em uma frase
A autenticação, os cabeçalhos de proteção, os relatórios impressos (PDF) e as bibliotecas foram reforçados; apenas o local onde o navegador guarda o crachá de login (`localStorage`) foi mantido conscientemente por compatibilidade entre domínios.

#### 2. Qual era o problema
Este item reúne a "higiene geral" de segurança da aplicação:
1. A verificação do crachá de login (**JWT**) precisava exigir explicitamente um único método de assinatura seguro (`HS256`) e formato válido de cabeçalho `Bearer`.
2. Nos 4 geradores de relatórios PDF A4 (que montam páginas HTML no navegador para impressão), se alguém cadastrasse um nome de produto ou vendedor contendo código malicioso (`<script>...`), esse código poderia ser executado na tela de impressão — ataque conhecido como **XSS** (*Cross-Site Scripting*, injeção de código no navegador).
3. Bibliotecas externas do projeto acumulavam vulnerabilidades conhecidas no `npm audit` (incluindo uma crítica em `proxy-addr` e falhas altas no `multer`).
4. Faltava exigir tamanho mínimo seguro para a chave secreta do servidor (`JWT_SECRET`) ao subir em produção e configurar corretamente a lista de endereços permitidos (**CORS**).

#### 3. Por que isso era um risco
Um invasor poderia tentar falsificar sessões, executar códigos maliciosos dentro do navegador do administrador ao gerar um PDF (roubando a sessão ativa) ou explorar falhas públicas conhecidas em bibliotecas antigas.

#### 4. Por que acontecia (a causa)
Ao construir rapidamente funcionalidades novas (PDFs, uploads, login entre Vercel e Render), proteções extras como `escapeHtml`, trava de algoritmo JWT, atualização de pacotes e `rel="noopener noreferrer"` em links externos não tinham sido aplicadas de ponta a ponta.

#### 5. Como foi resolvido
1. **Chave secreta obrigatória em produção:** o servidor se recusa a iniciar em produção se `JWT_SECRET` estiver vazio ou tiver menos de 16 caracteres.
2. **Verificação rigorosa do crachá de login (`JWT`):** o `authMiddleware.js` agora exige formato exato `^Bearer\s+(\S+)$`, algoritmo exclusivo `HS256`, `userId > 0` e separa erros de token de erros temporários do banco (evitando deslogar usuários à toa se o banco piscar).
3. **Proteção anti-XSS nos 4 geradores de PDF A4:** todo texto dinâmico inserido no HTML dos relatórios passa por `escapeHtml` (transformando símbolos perigosos em texto comum inofensivo), e links/imagens passam por validação de URL segura (`formatImageUrl`) e `rel="noopener noreferrer"`.
4. **Cabeçalhos de segurança e CORS normalizado:** ativados `Helmet`, lista multi-origem no `CORS`, limite de `1 MB` para corpos JSON/formulário e bloqueio de arquivos ocultos (`dotfiles: "ignore"`) em `/uploads`.
5. **Atualização de bibliotecas (`npm audit fix`):** o frontend zerou completamente vulnerabilidades (`0` alertas, atualizando `react-router-dom ^7.18.5` e `vite ^7.3.8`) e o backend caiu de **14** vulnerabilidades (incluindo 1 crítica e 10 altas) para **5** avisos indiretos ligados apenas a ferramentas de linha de comando/dependências internas (`deepmerge-ts` via `@prisma/config` e `uuid` via `exceljs`), atualizando `express ^5.2.1` e `multer ^2.5.0`.

#### 6. Como era × como ficou
| Item | Antes | Depois |
|---|---|---|
| Texto malicioso (`<script>`) num nome ao gerar PDF | Podia ser interpretado como código na impressão | Neutralizado com `escapeHtml` em todos os 4 PDFs |
| Vulnerabilidades `npm audit` | 14 no backend (1 crítica) + alertas no frontend | **0 no frontend** e 5 indiretas não-críticas no backend |
| Assinatura do token JWT | Sem trava explícita de algoritmo e formato estrito | Travado em `HS256` + validação estrita de `Bearer` |

#### 7. Como sabemos que funciona
Validado em 11/11/2026 com `npm audit`, script de verificação de segurança (`verify_security.mjs`), `eslint .` (`0` erros), `vite build` (`2.420` módulos) e testes E2E `7/7` aprovados no Neon e produção no Render.

#### 8. O que ainda falta
- **Local de armazenamento do token (risco aceito atualmente):** o crachá de login (`JWT`) continua guardado no `localStorage` do navegador (via Zustand) para funcionar facilmente entre o site na Vercel e o servidor no Render (domínios diferentes). Para segurança máxima no futuro, o ideal é migrar para cookies `HttpOnly; Secure; SameSite` com `Refresh Token` sob o mesmo domínio principal.
- **5 avisos indiretos de pacotes no backend:** dependem de atualizações futuras dos mantenedores de `@prisma/config` e `exceljs`.

#### 9. Detalhe técnico (para desenvolvedores)
- **Arquivos:** [index.js](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/index.js) · [authMiddleware.js](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/middlewares/authMiddleware.js) · [validators.js](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/frontend/src/utils/validators.js) · [imageHelper.js](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/frontend/src/utils/imageHelper.js)
- **Funções:** `authMiddleware`, `escapeHtml`, `formatImageUrl`
- **Etapa / Commit:** Etapa 9 — Reforço final de segurança contra invasões e publicação em nuvem (`1e049a9`).

---

## 2. Tema: Validação de entradas, arquivos e planilhas (`ENTRADA`)

<a id="entrada-01"></a>
### 🛡️ ENTRADA-01 — Formulários, uploads de arquivos, links e planilhas aceitavam dados inválidos ou maliciosos

**Situação atual:** 🟡 Resolvido em parte  
**Gravidade original:** Alta — *o que isso significa:* arquivos disfarçados de imagem, links perigosos ou textos que viram fórmulas no Excel poderiam comprometer o servidor ou o computador de quem baixasse uma planilha.  
**Código no catálogo original:** B4

#### 1. Em uma frase
Antes, faltava filtrar rigorosamente extensões de arquivos, links de comprovantes, senhas curtas demais e células de planilhas exportadas; agora tudo isso é validado e higienizado no servidor e no navegador.

#### 2. Qual era o problema
Dados vindos do usuário entravam por várias portas (formulários, fotos, links de comprovantes de pagamento e importação/exportação de Excel/CSV):
1. Alguém podia tentar enviar um arquivo perigoso renomeado com nome estranho (como `foto.jpg.exe`) ou com tipo real diferente da extensão.
2. Um campo de link de comprovante (`comprovanteUrl`) podia receber links falsos com código executável (`javascript:alert(...)` ou `data:...`).
3. Um nome de produto começando com `=`, `+`, `-` ou `@` podia ser exportado para Excel/CSV e executado automaticamente como fórmula no computador do gestor (**Formula Injection**).
4. Senhas muito fracas (menos de 6 caracteres) podiam passar sem bloqueio.

> **Exemplo ilustrativo:** um usuário cadastra um produto chamado `=HIPERLINK("http://site-falso.com","Clique")` e, quando o financeiro exporta o estoque para Excel e abre o arquivo, o Excel interpreta o nome como uma fórmula ativa.

#### 3. Por que isso era um risco
Upload de arquivos maliciosos no servidor, abertura de links perigosos por gerentes ao conferir comprovantes, execução de fórmulas maliciosas em planilhas do financeiro e contas vulneráveis por senhas curtas.

#### 4. Por que acontecia (a causa)
As validações iniciais conferiam apenas se os campos obrigatórios existiam, sem aplicar listas rígidas de formatos permitidos (**whitelist**) nem neutralizar caracteres especiais de planilhas e links.

#### 5. Como foi resolvido
1. **Uploads travados por lista de permitidos e nome aleatório:** em `multerConfig.js` e `productRoutes.js`, imagens e planilhas `.xlsx`/`.csv` só passam se **tanto** a extensão ancorada (`^\.(...)$`) **quanto** o tipo real do arquivo (**MIME type**) estiverem autorizados, e o arquivo salvo recebe um nome aleatório gerado com `crypto.randomBytes`.
2. **Proteção de links (`sanitizeSafeUrl` e `formatImageUrl`):** links de comprovantes e imagens aceitam apenas endereços seguros (`http://`, `https://` ou caminhos relativos válidos), bloqueando `javascript:` e `data:`.
3. **Neutralização de fórmulas em planilhas (`sanitizeSpreadsheetCell`):** qualquer célula exportada que comece com `=`, `+`, `-` ou `@` recebe um prefixo de texto seguro antes de virar `.xlsx` ou `.csv`.
4. **Senha mínima obrigatória:** `authService.js` e `userService.js` exigem senha com pelo menos **6 caracteres**.
5. **Limite de tamanho de requisição:** o servidor bloqueia corpos JSON ou formulários maiores que `1 MB`.
6. **Validação de caminhos locais:** `removeLocalUploadIfSafe` e `cleanupStoredMedia` garantem que limpezas de arquivos temporários nunca saiam da pasta de uploads.

#### 6. Como era × como ficou
| Tipo de entrada | Antes | Depois |
|---|---|---|
| Upload com extensão ou tipo falsificado | Podia passar por filtro frouxo | Bloqueado pela checagem dupla extensão + tipo real (MIME) |
| Link de comprovante `javascript:...` | Aceito como texto comum | Rejeitado por `sanitizeSafeUrl` |
| Nome de produto começando com `=` no Excel | Exportado como fórmula ativa | Neutralizado como texto seguro por `sanitizeSpreadsheetCell` |
| Senha de 3 caracteres | Podia ser aceita | Bloqueada (mínimo 6 caracteres) |

#### 7. Como sabemos que funciona
Validado em 11/11/2026 com testes unitários das funções de sanitização (`verify_security.mjs`), revisão de código e execução completa da suíte E2E (`7/7` aprovados).

#### 8. O que ainda falta
- No arquivo do banco de dados (`schema.prisma`), as colunas de texto continuam como texto ilimitado (`String` / `text`) em vez de terem um limite rígido por coluna (como `@db.VarChar(255)`).
- A política de senha exige no mínimo 6 caracteres, mas ainda não obriga combinação mista de letras, números e símbolos (melhoria opcional futura).

#### 9. Detalhe técnico (para desenvolvedores)
- **Arquivos:** [sanitizers.js](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/utils/sanitizers.js) · [multerConfig.js](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/config/multerConfig.js) · [productRoutes.js](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/routes/productRoutes.js) · [productSpreadsheetService.js](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/services/productSpreadsheetService.js) · [authService.js](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/services/authService.js) · [userService.js](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/services/userService.js)
- **Funções:** `sanitizeSafeUrl`, `sanitizeSpreadsheetCell`, `removeLocalUploadIfSafe`, `cleanupStoredMedia`
- **Etapa / Commit:** Etapa 9 — Reforço final de segurança contra invasões e publicação em nuvem (`1e049a9`).

---

## 3. Tema: Consistência de estoque, dinheiro, pedidos e exclusões (`DADOS`)

<a id="dados-01"></a>
### 📦 DADOS-01 — Excluir um registro com histórico (produto, loja ou funcionário) travava o sistema com erro genérico

**Situação atual:** ✅ Resolvido  
**Gravidade original:** Alta — *o que isso significa:* tentar apagar um produto que já foi vendido, uma loja antiga ou um funcionário demitido causava erro interno (`500`) e impedia a limpeza dos cadastros.  
**Código no catálogo original:** B6

#### 1. Em uma frase
Antes, tentar excluir algo que tinha vendas ligadas a ele quebrava a operação com erro do banco; agora produtos, lojas, categorias e fornecedores são desativados preservando o histórico, e funcionários demitidos são removidos com um registro permanente de desligamento.

#### 2. Qual era o problema
No banco de dados, cada venda aponta para o produto vendido, a loja e o vendedor (uma trava chamada **chave estrangeira**). Quando o gerente tentava apagar um produto descontinuado ou um funcionário que saiu da empresa, o banco recusava a exclusão para não deixar vendas "órfãs", e o servidor devolvia um erro técnico `500` (Erro interno).
> **Exemplo ilustrativo:** o vendedor João pediu demissão depois de 8 meses trabalhando. O administrador clica em "Excluir" no cadastro do João e recebe "Erro interno no servidor", ficando obrigado a deixar o ex-funcionário ativo na lista para sempre.

#### 3. Por que isso era um risco
Cadastros ficavam poluídos com itens e ex-funcionários impossíveis de remover, ou pior: se alguém forçasse a exclusão em cascata, destruiria o histórico financeiro e o faturamento dos meses anteriores.

#### 4. Por que acontecia (a causa)
As rotas de exclusão chamavam `delete` diretamente no banco sem distinguir o que deveria ser **desativado logicamente** (*soft delete*) e o que deveria ser **excluído com preservação histórica**.

#### 5. Como foi resolvido
1. **Exclusão lógica (*soft delete*) para o catálogo e filiais:** `Loja`, `Produto`, `Categoria` e `Fornecedor` passam a ser marcados como inativos (`ativo = false`) quando possuem histórico, saindo das listas operacionais sem apagar o passado.
2. **Demissão real de funcionário com preservação total do histórico:** `Usuario` é excluído fisicamente da tabela ativa (liberando e-mail e limpando acesso), enquanto suas vendas antigas mantêm o vínculo desconectado de forma segura (`ON DELETE SET NULL`) com retratos congelados (**snapshots** de nome, e-mail, matrícula e datas).
3. **Tabela permanente de desligamento (`RegistroDesligamento`):** mesmo que o funcionário tenha **0 vendas**, a demissão fica gravada com `dataAdmissao`, `dataDemissao`, `motivo` opcional, matrícula marcada como `MAT-XXXXX (CANCELADA)` e geração de relatório mensal (`relatorioDesligamento`), podendo ser consultada depois no filtro de desligados.
4. **Tradução de erros do banco:** caso ainda ocorra algum conflito de duplicidade (`P2002`), vínculo (`P2003`) ou registro inexistente (`P2025`), o `errorHandler.js` converte em mensagem amigável (`409` ou `404`), nunca `500`.

#### 6. Como era × como ficou
| Ação | Antes | Depois |
|---|---|---|
| Excluir produto ou loja com vendas | Erro interno `500` do banco | Desativado com segurança; histórico de vendas intacto |
| Demitir funcionário com vendas (ou 0 vendas) | Bloqueado por erro de vínculo | Conta removida + ficha gravada em `RegistroDesligamento` + relatório mensal |
| Cadastrar e-mail ou código duplicado | Erro técnico genérico | Resposta clara de conflito (`409`) |

#### 7. Como sabemos que funciona
Testado em cenários reais na suíte E2E ([`multitenant_audit.test.mjs`](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/tests/multitenant_audit.test.mjs)), incluindo demissão de vendedor com consulta posterior no ranking e no relatório de desligamento (**7/7 aprovados** em 11/11/2026).

#### 8. O que ainda falta
Nada pendente identificado.

#### 9. Detalhe técnico (para desenvolvedores)
- **Arquivos:** [userService.js](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/services/userService.js) · [storeService.js](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/services/storeService.js) · [productService.js](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/services/productService.js) · [errorHandler.js](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/utils/errorHandler.js) · [schema.prisma](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/prisma/schema.prisma)
- **Etapas / Commits:** Etapa 7, Etapa 8 e Etapa 9 (`3c95ebc`, `fa9b4b4`, `ca2cf6f`, `1e049a9`).

---

<a id="dados-02"></a>
### 📦 DADOS-02 — Duas vendas ao mesmo tempo podiam deixar o estoque com número errado ou negativo

**Situação atual:** ✅ Resolvido  
**Gravidade original:** Crítica — *o que isso significa:* duas pessoas vendendo o mesmo item no mesmo segundo podiam vender produto que não existia mais ou fazer uma venda "apagar" a baixa da outra.  
**Código no catálogo original:** I1

#### 1. Em uma frase
Antes, duas vendas simultâneas do mesmo produto liam o mesmo saldo antigo e uma sobrescrevia a outra; agora o banco coloca uma fila temporária por produto (`FOR UPDATE`) e só baixa o estoque um de cada vez.

#### 2. Qual era o problema
Imagine que restam **5 unidades** de um teclado no estoque. No mesmo instante, dois caixas clicam em "Vender 3 unidades". Sem proteção, os dois pedidos leem "5 unidades", os dois calculam `5 - 3 = 2` e os dois gravam `2` no banco. Foram vendidos **6 teclados**, só existiam **5**, e o sistema diz que ainda sobraram **2**! Na programação isso se chama **condição de corrida** (*lost update*).

#### 3. Por que isso era um risco
Furo de estoque real, venda de mercadoria inexistente, prejuízo financeiro e perda total de confiança nos números do sistema em horários de pico.

#### 4. Por que acontecia (a causa)
O código antigo seguia o padrão "ler a quantidade → subtrair na memória do servidor → gravar o número pronto no banco". Entre a leitura e a gravação, outro pedido podia mexer no mesmo produto sem que o primeiro soubesse.

#### 5. Como foi resolvido
1. **Trava ordenada no banco em pedidos com vários itens (`ORDER BY id ASC FOR UPDATE`):** em `orderService.js` (tanto na criação quanto no estorno de pedidos), o banco trava os produtos envolvidos em ordem crescente de código. Isso faz os pedidos simultâneos aguardarem na fila por milissegundos e evita travamento cruzado (*deadlock*, quando o pedido A espera pelo B e o B espera pelo A).
2. **Trava no ajuste unitário de estoque:** em `productService.js` (`adjustProductQuantity`), a leitura do saldo também usa trava `FOR UPDATE` dentro da transação antes de abater ou repor a quantidade.

#### 6. Como era × como ficou
| Situação (estoque = 5) | Antes | Depois |
|---|---|---|
| Caixa A e Caixa B vendem 3 unidades no mesmo milissegundo | Ambos podiam passar e gravar saldo `2` (errado) | Caixa A baixa para `2`; Caixa B vê saldo `2` e recebe aviso de estoque insuficiente |

#### 7. Como sabemos que funciona
Verificado no código de `orderService.js` e `productService.js` e exercitado nos testes automatizados de pedidos e estorno (`multitenant_audit.test.mjs`, **7/7 aprovados** em 11/11/2026).

#### 8. O que ainda falta
Nada bloqueante para a operação atual. *(Como reforço extra opcional no futuro, pode-se adicionar uma trava física `CHECK (quantidade >= 0)` diretamente na tabela do PostgreSQL e um teste automatizado de carga com 20 vendas paralelas).*

#### 9. Detalhe técnico (para desenvolvedores)
- **Arquivos:** [orderService.js](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/services/orderService.js) · [productService.js](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/services/productService.js)
- **Funções:** `createOrder`, `cancelOrder`, `adjustProductQuantity`
- **Etapas / Commits:** Etapa 1 e Etapa 8 (`fa9b4b4`).

---

<a id="dados-03"></a>
### 📦 DADOS-03 — Operações com várias etapas podiam parar pela metade e deixar o banco incompleto

**Situação atual:** ✅ Resolvido  
**Gravidade original:** Crítica — *o que isso significa:* se ocorresse uma falha no meio de uma venda ou de um cadastro de empresa, metade dos dados ficava salva e a outra metade sumia.  
**Código no catálogo original:** I2

#### 1. Em uma frase
Antes, ações que gravam em várias tabelas podiam falhar no meio do caminho e deixar sujeira no banco; agora todas rodam dentro de uma transação ("ou acontece tudo, ou desfaz tudo").

#### 2. Qual era o problema
Várias ações importantes do Estoque.OS mexem em mais de uma tabela ao mesmo tempo:
- criar uma conta nova precisa criar a Organização, a primeira Loja e o usuário Administrador;
- fechar um pedido com 5 itens precisa criar o Pedido, os 5 Itens do Pedido, os 5 Movimentos e baixar o estoque dos 5 Produtos;
- importar uma planilha cadastra dezenas de produtos de uma vez.

> **Exemplo ilustrativo:** ao fechar uma venda com 3 produtos, o servidor baixa o estoque dos 2 primeiros, mas o banco pisca antes de gravar o pedido. O estoque diminuiu, mas a venda nunca existiu no sistema.

#### 3. Por que isso era um risco
Dados órfãos, estoque sumindo sem registro de venda, estornos que devolviam produto sem cancelar o pedido ou empresas criadas sem nenhum administrador.

#### 4. Por que acontecia (a causa)
Cada gravação era enviada ao banco como um comando separado e independente, sem agrupá-las numa única **transação** (um pacote indivisível gerenciado pelo banco de dados).

#### 5. Como foi resolvido
Todos os fluxos de múltiplos passos foram encapsulados em `prisma.$transaction`:
1. Cadastro inicial (`Organizacao` + `Loja` + `Usuario` administrador).
2. Criação de pedidos com múltiplos itens (`Pedido` + `ItemPedido` + `Movimento` + baixa de estoque).
3. Cancelamento/estorno de pedido (marcação de `CANCELADO` + movimentos de estorno + devolução de estoque).
4. Importação confirmada de planilhas `.xlsx`/`.csv` por filial.
5. Demissão de funcionário (gravação de `RegistroDesligamento` + snapshot nos movimentos + remoção física do usuário).

#### 6. Como era × como ficou
| Fluxo multi-etapa | Antes | Depois |
|---|---|---|
| Falha no 3º item de um pedido | 2 itens podiam ficar baixados sem pedido | Banco desfaz tudo automaticamente; nada fica pela metade |
| Falha no meio do estorno | Pedido podia ficar cancelado sem devolver estoque | Tudo acontece junto ou nada muda |

#### 7. Como sabemos que funciona
Verificado diretamente no código dos serviços e validado na suíte E2E (`multitenant_audit.test.mjs`, **7/7 aprovados** em 11/11/2026).

#### 8. O que ainda falta
Nada pendente identificado.

#### 9. Detalhe técnico (para desenvolvedores)
- **Arquivos:** [authService.js](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/services/authService.js) · [orderService.js](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/services/orderService.js) · [productSpreadsheetService.js](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/services/productSpreadsheetService.js) · [userService.js](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/services/userService.js)
- **Etapas / Commits:** Etapa 1, Etapa 7 e Etapa 8 (`3c95ebc`, `fa9b4b4`, `ca2cf6f`).

---

<a id="dados-04"></a>
### 📦 DADOS-04 — Preços e totais em dinheiro podiam ter erro de arredondamento nos centavos

**Situação atual:** ✅ Resolvido  
**Gravidade original:** Alta — *o que isso significa:* somas de vendas e relatórios financeiros podiam dar diferenças de centavos, além de alterar o passado se o preço de um produto mudasse depois.  
**Código no catálogo original:** I7

#### 1. Em uma frase
Antes, valores em dinheiro eram guardados em formato aproximado (`Float`) e não congelavam o preço na hora da venda; agora todo valor financeiro usa `Decimal(10, 2)` com preço congelado no momento da operação.

#### 2. Qual era o problema
Computadores guardam números comuns com vírgula (**ponto flutuante / Float**) em formato binário aproximado — por isso contas simples como `0,10 + 0,20` podem virar `0,30000000000000004`. Além disso, se um produto custava R\$ 100 em janeiro e passou para R\$ 120 em março, relatórios sem preço congelado poderiam distorcer o faturamento antigo.

#### 3. Por que isso era um risco
Fechamento de caixa não batendo com a maquininha de cartão, relatórios mensais com centavos errados e histórico financeiro alterado retroativamente sempre que um preço fosse reajustado.

#### 4. Por que acontecia (a causa)
Na modelagem inicial do banco, o preço do produto foi criado como `Float`, e os movimentos ainda não guardavam uma cópia congelada do preço praticado no dia da venda.

#### 5. Como foi resolvido
1. **Troca de tipo no banco de dados:** `Produto.preco`, `Pedido.valorTotal`, `ItemPedido.precoUnitario`, `ItemPedido.subtotal`, `Movimento.precoUnitario` e `Movimento.valorTotal` foram definidos como `Decimal(10, 2)` (`numeric(10,2)` no PostgreSQL), que faz conta exata em centavos.
2. **Congelamento histórico do preço:** ao fechar um pedido ou registrar um movimento, o preço unitário e o total do momento são copiados para o registro. Mudar o preço do produto amanhã não altera nenhuma venda de ontem.

#### 6. Como era × como ficou
| Situação | Antes | Depois |
|---|---|---|
| Armazenamento de preços e totais | `Float` (aproximação binária) | `Decimal(10, 2)` (precisão exata de centavos) |
| Produto muda de preço depois de vendido | Risco de alterar cálculos antigos | Preço da venda fica congelado em `ItemPedido` e `Movimento` |

#### 7. Como sabemos que funciona
Confirmado nas migrações aplicadas no banco Neon (`schema.prisma` + `npx prisma migrate status` em dia) e nos testes E2E (`7/7` aprovados em 11/11/2026).

#### 8. O que ainda falta
Nada pendente identificado.

#### 9. Detalhe técnico (para desenvolvedores)
- **Arquivos:** [schema.prisma](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/prisma/schema.prisma) · [orderService.js](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/services/orderService.js) · [productService.js](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/services/productService.js)
- **Etapas / Commits:** Etapa 3 e Etapa 8 (`fa9b4b4`).

---

<a id="dados-05"></a>
### 📦 DADOS-05 — Duas ações simultâneas podiam passar juntas pela mesma verificação de saldo ou cadastro

**Situação atual:** ✅ Resolvido  
**Gravidade original:** Alta — *o que isso significa:* uma verificação feita "antes" de agir podia ficar desatualizada na fração de segundo seguinte, permitindo vender um produto que acabou de ser desativado ou esgotado.  
**Código no catálogo original:** I8

#### 1. Em uma frase
Antes, o sistema conferia uma regra (como "o produto está ativo e tem saldo?") antes de travar o registro no banco; agora a conferência acontece **depois** que o banco trava a linha, impedindo que outra requisição passe na frente.

#### 2. Qual era o problema
Esse tipo de erro é chamado de **TOCTOU** (*Time of Check to Time of Use* — "tempo entre checar e usar").
> **Exemplo ilustrativo:** sobra 1 unidade de um fone. O vendedor A clica em vender; o sistema confere: "tem 1? Tem!". Na mesma fração de segundo, o vendedor B também pergunta: "tem 1? Tem!" ou o gerente desativa o produto. Como a checagem aconteceu antes da trava, ambos acham que está tudo liberado e executam uma ação inválida.

#### 3. Por que isso era um risco
Permitia burlar regras críticas de estoque, produto ativo ou unicidade de cadastro sempre que duas pessoas agissem ao mesmo tempo.

#### 4. Por que acontecia (a causa)
As validações eram executadas em consultas comuns fora de trava exclusiva, deixando uma janela de milissegundos aberta entre validar e gravar.

#### 5. Como foi resolvido
1. **Conferência após a trava no banco:** dentro de `prisma.$transaction`, `orderService.js` e `productService.js` adquirem primeiro a trava (`FOR UPDATE`) e **somente depois** conferem se o produto ainda está ativo e se o saldo disponível cobre a venda.
2. **Garantia física de unicidade no banco:** e-mails, slugs de lojas por organização (`@@unique([organizacaoId, slug])`) e matrículas possuem restrições únicas direto no banco de dados, com erros convertidos em `409` (conflito) pelo `errorHandler.js`.

#### 6. Como era × como ficou
| Momento da checagem | Antes | Depois |
|---|---|---|
| Conferir se produto está ativo e tem saldo | Antes de travar a linha no banco | Dentro da transação, **após** travar com `FOR UPDATE` |
| Dois cadastros simultâneos com mesmo e-mail/slug | Dependia só da checagem em código | Travado pela restrição `UNIQUE` do PostgreSQL |

#### 7. Como sabemos que funciona
Confirmado por inspeção direta das transações em `orderService.js` e `productService.js` e validado na suíte E2E (`multitenant_audit.test.mjs`, **7/7 aprovados** em 11/11/2026).

#### 8. O que ainda falta
Nada pendente identificado.

#### 9. Detalhe técnico (para desenvolvedores)
- **Arquivos:** [orderService.js](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/services/orderService.js) · [productService.js](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/services/productService.js) · [schema.prisma](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/prisma/schema.prisma)
- **Etapas / Commits:** Etapa 1 e Etapa 8 (`fa9b4b4`).

---

<a id="dados-06"></a>
### 📦 DADOS-06 — Clicar duas vezes em "Finalizar pedido" ou "Ajustar estoque" podia registrar a operação em dobro

**Situação atual:** ✅ Resolvido  
**Gravidade original:** Alta — *o que isso significa:* internet instável ou um clique duplo nervoso do operador podia cobrar e baixar o mesmo pedido duas vezes seguidas.  
**Código no catálogo original:** I9

#### 1. Em uma frase
Antes, se o operador clicasse duas vezes rápido no botão de venda (ou a rede reenviasse o pedido), o sistema criava duas vendas iguais; agora cada operação leva uma chave única (`Idempotency-Key`) que impede duplicação.

#### 2. Qual era o problema
No balcão de uma loja, é muito comum o vendedor clicar em "Finalizar pedido", achar que travou por causa da internet lenta e clicar de novo 1 segundo depois. Sem **idempotência** (a capacidade de reconhecer que o segundo pedido é apenas a repetição do primeiro), o servidor tratava o segundo clique como uma venda nova.
> **Exemplo ilustrativo:** um cliente compra 2 camisetas. A internet oscila, o caixa clica duas vezes em confirmar e o sistema registra 2 pedidos idênticos, dando baixa em 4 camisetas e dobrando o faturamento do dia.

#### 3. Por que isso era um risco
Vendas duplicadas no caixa, estoque errado, necessidade constante de estornos manuais e relatórios financeiros inflados artificialmente.

#### 4. Por que acontecia (a causa)
As rotas de criação de pedido e ajuste de estoque não tinham um identificador único de operação para lembrar que aquele mesmo envio já havia sido processado segundos antes.

#### 5. Como foi resolvido
1. **Chave de idempotência isolada por empresa e loja:** o cliente envia o cabeçalho `Idempotency-Key`, e o servidor guarda a chave no formato `${organizacaoId}:${lojaId}:${key}` (tanto em `/orders` quanto em `/products/:id/adjust`).
2. **Reaproveitamento seguro da resposta:** se a mesma chave chegar novamente, o servidor reconhece que já executou aquela ação e devolve o mesmo resultado sem baixar o estoque de novo.
3. **Proteção visual na tela:** os formulários também desabilitam o botão durante o envio.

#### 6. Como era × como ficou
| Situação | Antes | Depois |
|---|---|---|
| Operador clica duas vezes seguidas em finalizar pedido | Podia criar 2 pedidos e baixar estoque em dobro | Reconhecido pela `Idempotency-Key`; apenas 1 pedido é criado |

#### 7. Como sabemos que funciona
Confirmado no código de `orderService.js` e `productService.js` e validado na suíte E2E (`multitenant_audit.test.mjs`, **7/7 aprovados** em 11/11/2026).

#### 8. O que ainda falta
A memória temporária das chaves (`idempotencyStore` e `orderIdempotencyStore`) funciona perfeitamente no servidor atual (instância única), mas precisará ir para o **Redis** caso o sistema passe a rodar em 2 ou mais servidores paralelos (ver `OPERACAO-06`).

#### 9. Detalhe técnico (para desenvolvedores)
- **Arquivos:** [orderService.js](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/services/orderService.js) · [productService.js](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/services/productService.js)
- **Endpoints afetados:** `POST /orders`, `POST /products/:id/adjust`
- **Etapas / Commits:** Etapa 1 e Etapa 8 (`fa9b4b4`).

---

## 4. Tema: Velocidade e volume de dados (`DESEMPENHO`)

<a id="desempenho-01"></a>
### ⚡ DESEMPENHO-01 — Algumas telas puxavam todos os registros do banco de uma só vez, sem divisão por páginas

**Situação atual:** 🟡 Resolvido em parte  
**Gravidade original:** Média — *o que isso significa:* à medida que a loja acumula milhares de produtos e vendas, pedir tudo de uma vez deixa a tela lenta, consome muita internet e pesa no servidor.  
**Código no catálogo original:** B10

#### 1. Em uma frase
As principais listas do sistema já foram divididas em páginas de no máximo 100 itens, mas o gráfico de fluxo do painel ainda pede todos os movimentos de uma vez (`limit=all`) e categorias/fornecedores ainda vêm inteiros.

#### 2. Qual era o problema
Sem **paginação** (dividir uma lista gigante em páginas menores), abrir o histórico de movimentações de uma loja com 50.000 vendas faz o servidor tentar empacotar e enviar as 50.000 linhas de uma só vez para o navegador. Na medição inicial de 08/11/2026, a rota `GET /movements?limit=all` levou mediana de `862,4 ms` (quase 1 segundo) e chegou a `1.783,7 ms` sob 10 acessos simultâneos.

#### 3. Por que isso era um risco
Queda progressiva de velocidade conforme o cliente usa o sistema por meses, travamento em celulares com pouca memória e maior custo de tráfego no banco de dados.

#### 4. Por que acontecia (a causa)
No começo do projeto, com poucos dados de teste, trazer a lista inteira era rápido e simples — inclusive para o navegador montar gráficos somando tudo localmente.

#### 5. Como foi resolvido
1. **Paginação com teto máximo de 100 itens nas listagens principais:** `/orders`, `/movements`, `/products` e `/users` agora exigem página e limitam no servidor o máximo de 100 registros por chamada.

#### 6. Como era × como ficou
| Listagem | Antes | Depois |
|---|---|---|
| Pedidos, Movimentos, Produtos e Usuários | Risco de retornar listas enormes sem teto | Paginadas com limite máximo de `100` itens por página |
| Gráfico de fluxo mensal no Dashboard | Pede `GET /movements?limit=all` | **Ainda usa `limit=all`** (pendente) |
| Categorias e Fornecedores | Lista completa | **Ainda retorna lista completa** (volume normalmente menor, mas sem teto) |

#### 7. Como sabemos que funciona
Confirmado por inspeção direta nas rotas/serviços de listagem e pela medição histórica da baseline em 08/11/2026.

#### 8. O que ainda falta
- Criar uma rota dedicada de resumo mensal no banco (`GET /movements/flow-summary`) para alimentar o gráfico do painel (`useDashboardData.js`) e então remover a opção `limit=all`.
- Avaliar paginação opcional para `/categories` e `/suppliers` caso empresas maiores cadastrem centenas de itens.

#### 9. Detalhe técnico (para desenvolvedores)
- **Arquivos:** [movementService.js](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/services/movementService.js) · [orderService.js](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/services/orderService.js) · [productService.js](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/services/productService.js) · [userService.js](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/services/userService.js) · [useDashboardData.js](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/frontend/src/hooks/useDashboardData.js)
- **Endpoints afetados:** `GET /movements?limit=all`, `GET /categories`, `GET /suppliers`

---

<a id="desempenho-02"></a>
### ⚡ DESEMPENHO-02 — Relatórios de vendedores e fornecedores faziam dezenas de consultas repetidas ao banco em vez de uma só

**Situação atual:** ✅ Resolvido  
**Gravidade original:** Alta — *o que isso significa:* quanto mais vendedores ou fornecedores a loja tinha, mais lento o relatório ficava, podendo passar de 3 segundos de espera.  
**Código no catálogo original:** I3

#### 1. Em uma frase
Antes, para montar o relatório de desempenho, o servidor fazia 1 consulta para listar os vendedores e depois dezenas de consultas extras dentro de um laço (problema **N+1**); agora o PostgreSQL calcula tudo em uma única consulta SQL.

#### 2. Qual era o problema
Imagine ir ao supermercado comprar 20 itens, mas fazer 20 viagens separadas trazendo 1 item por viagem. Era isso que acontecia no relatório de vendedores (`/movements/user-stats`): o sistema ia ao banco pegar a lista de usuários e depois fazia várias viagens separadas ao banco na nuvem para somar as vendas e reposições de cada pessoa. Como o banco fica nos Estados Unidos (Neon AWS `us-east-1`), cada viagem custava cerca de `140 ms` só de ida e volta na rede. Na medição de 08/11/2026, essa tela chegou a levar **`3.117,9 ms`** (mais de 3 segundos).

#### 3. Por que isso era um risco
Telas de gestão travando ou demorando vários segundos para abrir, sobrecarga de conexões no banco e sensação de sistema pesado para gerentes e donos de loja.

#### 4. Por que acontecia (a causa)
O código fazia chamadas ao banco (`await`) dentro de um laço (`map`), padrão clássico conhecido como **N+1 consultas**.

#### 5. Como foi resolvido
1. **Substituição por SQL nativo agregado (`$queryRaw`):** `getUserStatsAggregated`, `getSellerPerformanceRanking`, `getSellerPerformanceDetail` e `getSupplierStats` passaram a enviar **uma única instrução SQL** que agrupa, soma e ordena direto dentro do PostgreSQL.
2. **Desconsideração de estornos direto na consulta:** vendas canceladas (`estorno = true`) já são filtradas na própria consulta do banco.

#### 6. Como era × como ficou
| Relatório | Antes | Depois |
|---|---|---|
| Desempenho por vendedor (`/movements/user-stats` e `/performance`) | Várias viagens sequenciais ao banco (`p50: 718 ms`, pico `3.118 ms` em 08/11) | 1 única consulta SQL agregada no PostgreSQL *(novo benchmark HTTP ainda não medido)* |
| Estatísticas de fornecedores (`/suppliers/stats`) | Múltiplas consultas + soma em Node (`p50: 537 ms` em 08/11) | 1 única consulta SQL agregada no PostgreSQL |

#### 7. Como sabemos que funciona
Confirmado por inspeção das consultas `$queryRaw` em `movementService.js` e `supplierService.js` e validado na suíte E2E (`multitenant_audit.test.mjs`, **7/7 aprovados** em 11/11/2026).

#### 8. O que ainda falta
A correção no código está concluída; falta apenas rodar uma nova bateria cronometrada de carga HTTP depois da Etapa 8 para registrar oficialmente o novo tempo em milissegundos (hoje marcado como `NÃO MEDIDO`).

#### 9. Detalhe técnico (para desenvolvedores)
- **Arquivos:** [movementService.js](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/services/movementService.js) · [supplierService.js](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/services/supplierService.js)
- **Funções:** `getUserStatsAggregated`, `getSellerPerformanceRanking`, `getSellerPerformanceDetail`, `getSupplierStats`
- **Etapas / Commits:** Etapa 2 e Etapa 8 (`fa9b4b4`, `0172626`).

---

<a id="desempenho-03"></a>
### ⚡ DESEMPENHO-03 — O servidor puxava listas inteiras para a memória só para somar totais que o banco podia calcular direto

**Situação atual:** 🟡 Resolvido em parte  
**Gravidade original:** Média — *o que isso significa:* trafegar centenas ou milhares de registros pela rede só para obter uma soma gasta memória do servidor e atrasa a abertura dos painéis.  
**Código no catálogo original:** I4

#### 1. Em uma frase
Os indicadores principais de vendedores e fornecedores agora são somados diretamente no banco de dados, mas os gráficos mensais do painel principal ainda baixam os movimentos para somá-los no navegador.

#### 2. Qual era o problema
Em vez de perguntar ao banco "qual foi o total vendido neste mês?", o código antigo pedia "me mande todas as vendas do mês" e somava tudo em JavaScript na memória do servidor (ou do navegador).
> **Exemplo:** na medição inicial de 08/11/2026, `GET /suppliers/stats` levava mediana de `537,2 ms` (e `1.531,2 ms` sob 10 acessos simultâneos) porque trazia produtos para agregar na memória do Node.js.

#### 3. Por que isso era um risco
Consumo desnecessário de memória RAM no servidor e lentidão crescente no painel principal conforme o histórico de movimentações aumenta.

#### 4. Por que acontecia (a causa)
Fazer `.reduce()` em JavaScript sobre listas retornadas pelo banco era mais rápido de escrever na versão inicial do projeto.

#### 5. Como foi resolvido
1. **Agregação movida para o PostgreSQL:** indicadores de vendas, rankings de desempenho e estatísticas de fornecedores agora executam `SUM`, `COUNT` e `GROUP BY` diretamente no banco de dados.

#### 6. Como era × como ficou
| Cálculo | Antes | Depois |
|---|---|---|
| Estatísticas de fornecedores e desempenho de vendedores | Somados na memória do Node.js | Somados direto no PostgreSQL via SQL |
| Gráficos de fluxo mensal no Dashboard | Somados no navegador via `limit=all` | **Ainda somados no navegador** (pendente de endpoint próprio) |

#### 7. Como sabemos que funciona
Confirmado por inspeção em `movementService.js`, `supplierService.js` e `useDashboardData.js`.

#### 8. O que ainda falta
Mover a soma dos gráficos mensais do painel principal para uma consulta SQL no backend (`GET /movements/flow-summary`), eliminando o cálculo no navegador (ligado a `DESEMPENHO-01`).

#### 9. Detalhe técnico (para desenvolvedores)
- **Arquivos:** [movementService.js](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/services/movementService.js) · [supplierService.js](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/services/supplierService.js) · [useDashboardData.js](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/frontend/src/hooks/useDashboardData.js)

---

<a id="desempenho-04"></a>
### ⚡ DESEMPENHO-04 — Algumas consultas traziam dados extras que a tela não precisava (e faltavam datas de criação/edição em duas tabelas)

**Situação atual:** 🟡 Resolvido em parte  
**Gravidade original:** Baixa — *o que isso significa:* trafegar colunas desnecessárias deixa as respostas um pouco maiores que o preciso, e não ter data de criação/edição dificulta auditar quando uma categoria ou fornecedor mudou.  
**Código no catálogo original:** I5

#### 1. Em uma frase
As rotas de usuários já filtram campos sensíveis, mas a listagem de produtos ainda traz objetos completos de categoria e fornecedor, e as tabelas `Categoria` e `Fornecedor` ainda não guardam datas de criação e alteração.

#### 2. Qual era o problema
Ao pedir a lista de produtos (`listProducts`), o banco envia não apenas o nome da categoria e do fornecedor, mas o objeto inteiro de ambos. Além disso, `Categoria` e `Fornecedor` não possuem as colunas `createdAt` (criado em) e `updatedAt` (atualizado em) no banco de dados.

#### 3. Por que isso era um risco
Respostas JSON mais pesadas que o necessário e menor rastreabilidade histórica em alterações de categorias e fornecedores (além do cuidado contínuo de nunca incluir campos novos sensíveis por acidente).

#### 4. Por que acontecia (a causa)
Uso de `include` (trazer toda a tabela relacionada) em vez de `select` (escolher exatamente quais colunas devolver) na listagem de produtos, e ausência dos campos de auditoria de data na criação inicial das duas tabelas.

#### 5. Como foi resolvido
1. **Proteção de campos sensíveis em usuários:** senhas e dados internos nunca são devolvidos nas respostas de usuário (`sanitizeUser` e projeções em `GET /users/names`).
2. *(A projeção enxuta de produtos e as colunas de data em `Categoria`/`Fornecedor` ainda não foram aplicadas).*

#### 6. Como era × como ficou
| Item | Antes | Depois |
|---|---|---|
| Senha/dados internos de usuários nas respostas | Risco de vazamento sem filtro | Sempre removidos antes de responder |
| `listProducts` (`categoria` e `fornecedor`) | Traz objetos completos (`include`) | **Ainda traz objetos completos** |
| Datas `createdAt`/`updatedAt` em `Categoria` e `Fornecedor` | Ausentes | **Ainda ausentes** |

#### 7. Como sabemos que funciona
Verificado diretamente em `productService.js` e `schema.prisma`.

#### 8. O que ainda falta
- Trocar `include` por `select` enxuto em `listProducts` (trazendo só `id` e `nome` de categoria/fornecedor).
- Adicionar `createdAt` e `updatedAt` em `Categoria` e `Fornecedor` numa migração futura.

#### 9. Detalhe técnico (para desenvolvedores)
- **Arquivos:** [productService.js](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/services/productService.js) · [schema.prisma](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/prisma/schema.prisma)

---

<a id="desempenho-05"></a>
### ⚡ DESEMPENHO-05 — O banco precisava ler tabelas inteiras por falta de índices nas buscas por empresa e loja

**Situação atual:** ✅ Resolvido  
**Gravidade original:** Alta — *o que isso significa:* sem índices de busca, cada consulta filtrada por empresa, loja ou vendedor obrigava o banco a ler todas as linhas de todos os clientes até encontrar as certas.  
**Código no catálogo original:** I6

#### 1. Em uma frase
Antes, o banco não tinha índices combinados para buscar rapidamente por empresa, loja, data ou vendedor; agora todos os índices compostos essenciais foram criados via migração oficial.

#### 2. Qual era o problema
Um **índice** no banco de dados funciona como o índice remissivo de um livro. Sem ele, quando a Loja 2 pede suas vendas do mês, o banco precisa folhear linha por linha as vendas de todas as lojas e de todas as empresas do sistema. Na medição inicial de 08/11/2026, `GET /products` demorava mediana de `546,8 ms` (e `1.529,7 ms` com 10 usuários juntos) em parte por índices legados insuficientes.

#### 3. Por que isso era um risco
Lentidão severa conforme mais empresas e lojas entrassem no sistema, aumentando também o uso de processador do banco de dados na nuvem.

#### 4. Por que acontecia (a causa)
Na arquitetura inicial de empresa única, as tabelas não tinham índices combinados começando por `organizacaoId` e `lojaId` (nem por `vendedorRefId` para o histórico de vendedores).

#### 5. Como foi resolvido
1. **Criação de índices compostos multi-empresa e multi-loja:** foram adicionados índices do tipo `[organizacaoId, lojaId, ...]` nas tabelas operacionais (produtos, pedidos, movimentos, usuários, lojas).
2. **Índice para auditoria de vendedores:** criado índice composto `[organizacaoId, vendedorRefId, data]` em `Movimento` para acelerar o ranking e o histórico mesmo de ex-funcionários.

#### 6. Como era × como ficou
| Busca frequente | Antes | Depois |
|---|---|---|
| Listar vendas/produtos de uma loja | Leitura ampla com índices antigos | Busca direta pelo índice composto `[organizacaoId, lojaId, ...]` |
| Relatório de vendas de um vendedor (ativo ou demitido) | Sem índice dedicado por `vendedorRefId` | Índice `[organizacaoId, vendedorRefId, data]` ativo no PostgreSQL |

#### 7. Como sabemos que funciona
Confirmado em `schema.prisma`, na migração `20261110020000_organizacao_multipedidos` e via `npx prisma migrate status` (`up to date`) no NeonDB em 11/11/2026.

#### 8. O que ainda falta
Nada bloqueante. *(Em grandes volumes futuros, vale rodar `EXPLAIN ANALYZE` nas consultas principais para conferir o plano real do PostgreSQL).*

#### 9. Detalhe técnico (para desenvolvedores)
- **Arquivos:** [schema.prisma](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/prisma/schema.prisma) · [20261110020000_organizacao_multipedidos/migration.sql](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/prisma/migrations/20261110020000_organizacao_multipedidos/migration.sql)
- **Etapas / Commits:** Etapa 3 e Etapa 8 (`fa9b4b4`, `22c3448`).

---

<a id="desempenho-06"></a>
### ⚡ DESEMPENHO-06 — O sistema consultava o banco repetidamente para buscar os mesmos dados de usuário e listas de nomes

**Situação atual:** ✅ Resolvido  
**Gravidade original:** Média — *o que isso significa:* cada clique do usuário fazia uma viagem extra até o banco na nuvem (cerca de `140 ms` a mais) só para confirmar os mesmos dados de login e listas simples de nomes.  
**Código no catálogo original:** A1

#### 1. Em uma frase
Antes, toda requisição autenticada ia ao banco conferir quem era o usuário e toda abertura de filtro consultava a lista de nomes; agora esses dados ficam em memória rápida (**cache**) por poucos segundos e são limpos automaticamente quando alguém muda um cadastro.

#### 2. Qual era o problema
Como o banco Neon fica em outro país (`us-east-1`), cada consulta extra adiciona cerca de `140 ms` de latência de rede. Na medição de 08/11/2026:
- `GET /users/names` (usado para preencher menus de filtro) levava mediana de `282,9 ms` porque fazia 2 idas ao banco toda vez;
- toda rota autenticada fazia 1 consulta extra no `authMiddleware` para conferir o usuário.

#### 3. Por que isso era um risco
Sistema menos ágil em cada navegação entre telas e desperdício de consultas repetidas no banco de dados.

#### 4. Por que acontecia (a causa)
Não havia nenhuma camada temporária de **cache** para informações muito lidas e raramente alteradas.

#### 5. Como foi resolvido
1. **Cache de sessão (`userCache`, validade de 60 segundos):** guarda temporariamente os dados validados do usuário autenticado, economizando 1 viagem inteira ao banco (~140 ms) a cada requisição repetida dentro do minuto.
2. **Cache de nomes por escopo (`namesCacheByScope`, validade de 30 segundos):** guarda as listas curtas de nomes usadas em filtros, sempre separadas pela chave de empresa/loja para nunca misturar clientes.
3. **Limpeza automática (invalidação):** sempre que um usuário é criado, editado, suspenso, transferido ou excluído — ou uma loja é desativada — o sistema apaga imediatamente o cache afetado (`invalidateUserCache` e limpeza de `namesCacheByScope`), evitando dados velhos.

#### 6. Como era × como ficou
| Operação repetida | Antes | Depois |
|---|---|---|
| Confirmar dados do usuário logado em cada tela | Ia ao banco em 100% das requisições | Cache em memória por `60s` + limpeza imediata em alterações |
| Preencher lista de nomes em filtros (`GET /users/names`) | 2 viagens ao banco toda vez (`p50: 282,9 ms` em 08/11) | Cache por escopo (`30s`) + limpeza imediata em alterações |

#### 7. Como sabemos que funciona
Verificado no código de `authMiddleware.js` e `userService.js` e validado na suíte E2E (`multitenant_audit.test.mjs`, que confirma inclusive que suspender um usuário invalida o cache e bloqueia o acesso imediatamente — **7/7 aprovados** em 11/11/2026).

#### 8. O que ainda falta
Funciona plenamente no servidor atual (instância única). Se o sistema escalar para 2 ou mais servidores simultâneos no futuro, esses caches precisarão migrar para **Redis** (ver `OPERACAO-06`).

#### 9. Detalhe técnico (para desenvolvedores)
- **Arquivos:** [authMiddleware.js](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/middlewares/authMiddleware.js) · [userService.js](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/services/userService.js) · [storeService.js](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/services/storeService.js)
- **Funções:** `authMiddleware`, `invalidateUserCache`, `listUserNames`
- **Etapas / Commits:** Etapa 4 e Etapa 8 (`fa9b4b4`, `a9dfe3e`).

---

<a id="desempenho-07"></a>
### ⚡ DESEMPENHO-07 — O envio de fotos para a nuvem deixava o usuário esperando a imagem subir antes de receber resposta

**Situação atual:** 🔴 Ainda em aberto  
**Gravidade original:** Média — *o que isso significa:* cadastrar um produto ou usuário com foto demora mais porque o servidor fica segurando a resposta até terminar de enviar a imagem ao Cloudinary.  
**Código no catálogo original:** A2

#### 1. Em uma frase
O upload de fotos para o Cloudinary ainda acontece de forma **síncrona** (esperando terminar) dentro do mesmo pedido que salva o produto ou usuário, embora hoje já tenha um limite máximo de 10 segundos para não travar para sempre.

#### 2. Qual era o problema
Quando alguém cadastra um produto com foto, o navegador envia a imagem para o servidor da API, que salva temporariamente em disco, reenvia a foto para o Cloudinary (serviço externo de imagens), espera a resposta da nuvem e só depois responde "Produto salvo!" para o usuário.
> **Exemplo:** se a internet entre o servidor e o Cloudinary oscilar por 6 segundos, o usuário fica olhando o botão "Salvando..." girando por 6 segundos em vez de ser liberado em menos de 1 segundo.

#### 3. Por que isso era um risco
Sensação de lentidão ao cadastrar itens com foto e ocupação de recursos do servidor enquanto espera um serviço externo terminar de receber o arquivo.

#### 4. Por que acontecia (a causa)
O fluxo foi desenhado de forma síncrona (tudo dentro da mesma requisição HTTP), sem fila de processamento em segundo plano nem upload direto assinado do navegador para o Cloudinary.

#### 5. Como foi resolvido
Ainda **não foi transformado em assíncrono**. A única mitigação já aplicada foi colocar um **limite de tempo de 10 segundos** e limpeza automática do arquivo temporário (detalhado em `OPERACAO-04`), impedindo travamentos infinitos.

#### 6. Como era × como ficou
| Envio de foto em produto/usuário | Antes | Hoje |
|---|---|---|
| Processamento do upload | Síncrono, sem limite de tempo | **Ainda síncrono**, porém com limite de 10s e limpeza garantida |

#### 7. Como sabemos que funciona
Confirmado por inspeção direta em `cloudinaryConfig.js`, `productService.js` e `userService.js`.

#### 8. O que ainda falta
- Adotar **Signed Uploads** (o navegador envia a foto direto para o Cloudinary usando uma permissão temporária emitida pelo servidor) **ou** processar uploads pesados em segundo plano via fila/worker.

#### 9. Detalhe técnico (para desenvolvedores)
- **Arquivos:** [cloudinaryConfig.js](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/config/cloudinaryConfig.js) · [productService.js](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/services/productService.js) · [userService.js](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/services/userService.js)
- **Função:** `uploadToCloudinary`

---

<a id="desempenho-08"></a>
### ⚡ DESEMPENHO-08 — O arquivo principal do site ficou pesado para carregar de uma vez (e não há configuração Docker)

**Situação atual:** 🟡 Resolvido em parte  
**Gravidade original:** Média — *o que isso significa:* na primeira visita, o navegador precisa baixar todo o código do site num único arquivo grande (mais de 1 MB), mesmo que a pessoa só esteja abrindo a tela inicial ou de login.  
**Código no catálogo original:** A8

#### 1. Em uma frase
O servidor já foi ajustado para funcionar corretamente atrás do proxy da hospedagem Render (`trust proxy = 1`), mas o site ainda empacota todas as telas num único arquivo JavaScript de `1.020,48 kB` e ainda não possui `Dockerfile`.

#### 2. Qual era o problema
Este item reúne ajustes de empacotamento e publicação:
1. O **bundle** (pacotão de código JavaScript) gerado pelo Vite cresceu para **`1.020,48 kB`** (`284,61 kB` compactado em gzip, somando `2.420` módulos), disparando o alerta nativo da ferramenta recomendando dividir arquivos acima de `500 kB`.
2. O backend precisava configurar `trust proxy = 1` para funcionar corretamente atrás do proxy reverso do Render.
3. O projeto roda direto nos serviços gerenciados (Vercel e Render) e não tem um `Dockerfile` caso precise migrar para contêineres no futuro.

#### 3. Por que isso era um risco
Abertura inicial mais lenta em celulares com internet 4G/3G fraca (pois o navegador baixa páginas administrativas que o visitante nem vai usar) e maior trabalho manual caso a empresa queira rodar o projeto em infraestrutura própria via contêineres.

#### 4. Por que acontecia (a causa)
Todas as páginas do React são importadas de forma direta no topo do arquivo `routes.jsx`, sem carregamento sob demanda (**code-splitting** via `React.lazy`).

#### 5. Como foi resolvido
1. **Proxy reverso configurado:** adicionado `app.set("trust proxy", 1)` em `index.js` para identificar o IP real dos visitantes no Render (essencial para o limite de acessos funcionar direito).
2. *(A divisão do bundle do site e o `Dockerfile` ainda estão no plano futuro).*

#### 6. Como era × como ficou
| Item | Antes | Depois |
|---|---|---|
| Identificação de IP atrás do proxy do Render | Sem `trust proxy` | Configurado (`trust proxy = 1`) |
| Tamanho do arquivo JS principal do site | Único arquivo grande | **Ainda único (`1.020,48 kB`, medido em 11/11/2026)** |
| Empacotamento em contêiner (`Dockerfile`) | Inexistente | **Ainda inexistente** (desnecessário na hospedagem atual, útil se migrar) |

#### 7. Como sabemos que funciona
Medido oficialmente via `vite build` em 11/11/2026 (`2.420` módulos em `1m 42s`, JS `1.020,48 kB`, CSS `48,39 kB`) e confirmado em `backend/src/index.js` (linha 40).

#### 8. O que ainda falta
- Aplicar `React.lazy(() => import(...))` + `<Suspense>` nas rotas em `frontend/src/config/routes.jsx` para baixar telas pesadas (`DesempenhoVendedores`, `Pedidos`, `Usuarios`, `Lojas`) somente quando o usuário abrir cada uma.
- Criar `Dockerfile` caso o projeto passe a ser hospedado em nuvem própria/contêineres.

#### 9. Detalhe técnico (para desenvolvedores)
- **Arquivos:** [routes.jsx](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/frontend/src/config/routes.jsx) · [index.js](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/index.js)
- **Etapa / Commit:** Etapa 9 (`1e049a9`).

---

## 5. Tema: Operação do servidor, segredos e escala (`OPERACAO`)

<a id="operacao-01"></a>
### ⚙️ OPERACAO-01 — Senhas, chaves secretas ou detalhes do banco podiam aparecer em logs ou mensagens de erro

**Situação atual:** 🟡 Resolvido em parte  
**Gravidade original:** Crítica — *o que isso significa:* se a senha do banco de dados ou a chave de login vazar em um log ou tela de erro, qualquer pessoa que ler aquela mensagem pode invadir o sistema inteiro.  
**Código no catálogo original:** B1

#### 1. Em uma frase
O código já não expõe arquivos `.env`, exige chave secreta forte em produção e esconde detalhes internos em `/test-db` e erros `500`; resta apenas a boa prática contínua de trocar senhas externas (Neon/Cloudinary) caso tenham sido exibidas durante testes locais.

#### 2. Qual era o problema
Em projetos em desenvolvimento, é fácil deixar mensagens de erro técnicas vazarem detalhes do banco de dados na resposta da API (como na rota `/test-db` ou em erros inesperados) ou deixar o servidor subir sem uma chave secreta (`JWT_SECRET`) forte. Além disso, se alguma senha de banco ou Cloudinary foi colada fora de um canal privado durante testes, ela precisa ser trocada.

#### 3. Por que isso era um risco
Exposição da senha do banco de dados ou da chave que assina os crachás de login, permitindo acesso indevido a todos os dados da plataforma.

#### 4. Por que acontecia (a causa)
Respostas de depuração que devolviam `error.message` diretamente para ajudar o programador a achar bugs durante o desenvolvimento, mas que não podem ficar ligadas em produção.

#### 5. Como foi resolvido
1. **Proteção do arquivo de segredos:** `backend/.env` permanece ignorado pelo Git (`.gitignore`).
2. **Trava de inicialização em produção:** em `index.js`, o servidor aborta a subida se `JWT_SECRET` estiver ausente ou tiver menos de 16 caracteres em produção.
3. **Ocultação de detalhes em `/test-db` e erros `>= 500`:** em produção, a rota de checagem `/test-db` e o manipulador `errorHandler.js` escondem mensagens brutas do banco e detalhes internos, gravando-os apenas nos logs do servidor.

#### 6. Como era × como ficou
| Ponto de exposição | Antes | Depois |
|---|---|---|
| Erro na rota `/test-db` ou erro interno `500` | Podia devolver detalhes técnicos do erro | Detalhes ocultados em produção; resposta genérica segura |
| Subir produção sem `JWT_SECRET` forte | Podia subir com chave fraca ou indefinida | Servidor aborta o startup imediatamente (`logger.fatal`) |

#### 7. Como sabemos que funciona
Confirmado em `backend/src/index.js` (linhas 30–35 e 118–125), `backend/src/utils/errorHandler.js` e validado em produção (`https://adm-estoque.onrender.com/test-db` retornando `200 OK` em 11/11/2026).

#### 8. O que ainda falta
- **Ação operacional (fora do código):** rotacionar (trocar) preventivamente as credenciais externas do banco Neon e do Cloudinary caso tenham trafegado em capturas de tela, chats ou ambientes de teste.

#### 9. Detalhe técnico (para desenvolvedores)
- **Arquivos:** [index.js](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/index.js) · [errorHandler.js](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/utils/errorHandler.js)
- **Etapa / Commit:** Etapa 9 (`1e049a9`).

---

<a id="operacao-02"></a>
### ⚙️ OPERACAO-02 — Erros do sistema podiam vazar detalhes técnicos internos e retornar formatos diferentes em cada rota

**Situação atual:** ✅ Resolvido  
**Gravidade original:** Média — *o que isso significa:* o usuário recebia mensagens técnicas confusas ou telas de erro inconsistentes, e um invasor podia aprender detalhes internos do banco pelas mensagens de falha.  
**Código no catálogo original:** B5

#### 1. Em uma frase
Antes, erros inesperados e falhas de banco ou upload podiam responder em formatos diferentes ou vazar rastros técnicos; agora um único manipulador central (`errorHandler.js`) padroniza, registra e limpa todas as respostas de erro.

#### 2. Qual era o problema
Sem um ponto central de tratamento de erros, cada parte do código (uploads, banco Prisma, validações, regras de negócio) pode devolver um formato diferente ou acabar enviando o **stack trace** (a trilha interna de arquivos e linhas do servidor) para o navegador do usuário.

#### 3. Por que isso era um risco
Experiência ruim para quem usa o site (mensagens indecifráveis), dificuldade para o frontend exibir avisos consistentes e exposição de informações técnicas úteis para invasores.

#### 4. Por que acontecia (a causa)
Erros técnicos de bibliotecas externas (como `MulterError` em uploads ou códigos `P2002`/`P2025` do Prisma) precisam ser interceptados e traduzidos num único lugar antes de sair do servidor.

#### 5. Como foi resolvido
1. **Centralização no `errorHandler.js`:** todas as exceções chegam ao handler global, que nunca envia `stack trace` nem mensagens cruas do PostgreSQL/Prisma em erros inesperados (`>= 500`).
2. **Tradução amigável de erros conhecidos:**
   - erros de upload (`MulterError`) viram `400` com mensagem clara;
   - duplicidade no banco (`P2002`) vira `409` (conflito);
   - registro não encontrado (`P2025`) vira `404`;
   - violação de vínculo (`P2003`) é tratada sem virar erro `500`.

#### 6. Como era × como ficou
| Tipo de falha | Antes | Depois |
|---|---|---|
| Erro inesperado do banco (`500`) | Risco de expor mensagem técnica interna | Logado no servidor; cliente recebe mensagem segura genérica |
| Upload inválido ou campo duplicado | Risco de erro genérico `500` | Convertido automaticamente em `400` ou `409` padronizado |

#### 7. Como sabemos que funciona
Validado unitariamente no script de segurança (`verify_security.mjs`) e por inspeção direta em `errorHandler.js` em 11/11/2026.

#### 8. O que ainda falta
Nada pendente identificado.

#### 9. Detalhe técnico (para desenvolvedores)
- **Arquivo:** [errorHandler.js](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/utils/errorHandler.js)
- **Classe / Função:** `AppError`, `errorHandler`
- **Etapa / Commit:** Etapa 9 (`1e049a9`).

---

<a id="operacao-03"></a>
### ⚙️ OPERACAO-03 — Faltava limite de tentativas contra ataques de força bruta ou excesso de acessos simultâneos

**Situação atual:** ✅ Resolvido  
**Gravidade original:** Alta — *o que isso significa:* um robô podia tentar adivinhar senhas milhares de vezes por minuto ou inundar o servidor com cadastros falsos até tirar o site do ar.  
**Código no catálogo original:** I10

#### 1. Em uma frase
Antes, não havia limite geral de requisições nem identificação correta do IP atrás do proxy; agora o servidor aplica limites rígidos no login, no cadastro e na API inteira, reconhecendo o IP real de cada visitante.

#### 2. Qual era o problema
Sem **limite de taxa** (*rate limiting*), um script automatizado pode testar milhares de combinações de senha na tela de login (ataque de força bruta) ou criar centenas de empresas falsas em segundos. Além disso, sem `trust proxy = 1`, o servidor rodando no Render enxergaria o IP do próprio Render para todos os usuários, bloqueando todo mundo ao mesmo tempo.

#### 3. Por que isso era um risco
Invasão de contas por tentativa e erro de senha, banco lotado de contas falsas e lentidão ou queda do servidor para clientes legítimos.

#### 4. Por que acontecia (a causa)
Na primeira versão havia apenas controles parciais, sem limitador global ativo e com código morto não utilizado.

#### 5. Como foi resolvido
1. **Identificação do IP real:** ativado `app.set("trust proxy", 1)` em `index.js`.
2. **Limite global na API (`apiLimiter`):** máximo de **400 requisições a cada 15 minutos por IP** em toda a API.
3. **Limites rígidos nas rotas mais visadas (`authRoutes.js`):**
   - **Login (`loginLimiter`):** máximo de **25 tentativas a cada 15 minutos**;
   - **Cadastro (`registerLimiter`):** máximo de **15 cadastros a cada 1 hora**.

#### 6. Como era × como ficou
| Rota | Antes | Depois |
|---|---|---|
| Login e Cadastro | Risco de força bruta e spam automatizado | `25 req / 15 min` (login) e `15 req / 1 h` (cadastro) |
| Demais rotas da API | Sem teto global | `400 req / 15 min` por IP real (`trust proxy = 1`) |

#### 7. Como sabemos que funciona
Confirmado diretamente em `backend/src/index.js` (linhas 40 e 102–112) e `backend/src/routes/authRoutes.js`.

#### 8. O que ainda falta
Os contadores de limite rodam na memória local (perfeito para 1 servidor); para 2 ou mais servidores simultâneos, precisarão ser movidos para **Redis** (ver `OPERACAO-06`).

#### 9. Detalhe técnico (para desenvolvedores)
- **Arquivos:** [index.js](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/index.js) · [authRoutes.js](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/routes/authRoutes.js)
- **Etapas / Commits:** Etapa 1 e Etapa 9 (`1e049a9`).

---

<a id="operacao-04"></a>
### ⚙️ OPERACAO-04 — Se o serviço de imagens (Cloudinary) travasse, a requisição podia ficar presa sem fim e deixar lixo em disco

**Situação atual:** ✅ Resolvido  
**Gravidade original:** Média — *o que isso significa:* uma instabilidade no serviço externo de fotos podia travar o servidor esperando para sempre e encher o disco com arquivos temporários esquecidos.  
**Código no catálogo original:** A3

#### 1. Em uma frase
Antes, o envio de fotos ao Cloudinary não tinha relógio limite nem garantia de limpeza do arquivo temporário em caso de erro; agora há limite rígido de 10 segundos e exclusão automática garantida no bloco `finally`.

#### 2. Qual era o problema
Serviços externos na internet podem ficar lentos ou fora do ar sem avisar. Sem **timeout** (tempo máximo de espera), a chamada ao Cloudinary podia ficar pendurada indefinidamente, e se falhasse no meio do caminho, a foto temporária gravada pelo Multer ficava esquecida ocupando espaço no disco do servidor.

#### 3. Por que isso era um risco
Requisições travadas consumindo conexões do servidor e acúmulo silencioso de arquivos temporários em disco até causar falhas de espaço.

#### 4. Por que acontecia (a causa)
A função de upload chamava a biblioteca do Cloudinary diretamente sem cronômetro de desistência nem limpeza garantida após exceções.

#### 5. Como foi resolvido
1. **Limite rígido de 10 segundos:** `uploadToCloudinary` usa `Promise.race` competindo contra um cronômetro de 10 segundos; se o Cloudinary não responder a tempo, a operação falha de forma controlada.
2. **Limpeza garantida no `finally`:** aconteça sucesso ou erro, o arquivo temporário local é removido com segurança (`fs.unlink` / `removeLocalUploadIfSafe`).
3. **Organização por pastas isoladas:** as imagens sobem organizadas em `estoque-os/organizacoes/<orgSlug>/lojas/<lojaSlug>/<subpasta>`.

#### 6. Como era × como ficou
| Situação | Antes | Depois |
|---|---|---|
| Cloudinary lento ou fora do ar | Requisição podia ficar presa sem fim | Encerrada em no máximo `10 segundos` com erro limpo |
| Foto temporária no disco após erro | Podia sobrar lixo no servidor | Removida automaticamente no bloco `finally` |

#### 7. Como sabemos que funciona
Verificado diretamente no código de `cloudinaryConfig.js` e `sanitizers.js`.

#### 8. O que ainda falta
Nada pendente para resiliência do timeout. *(A conversão do upload para assíncrono é tratada separadamente em `DESEMPENHO-07`).*

#### 9. Detalhe técnico (para desenvolvedores)
- **Arquivos:** [cloudinaryConfig.js](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/config/cloudinaryConfig.js) · [sanitizers.js](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/utils/sanitizers.js)
- **Funções:** `uploadToCloudinary`, `cleanupStoredMedia`, `removeLocalUploadIfSafe`
- **Etapas / Commits:** Etapa 4, Etapa 8 e Etapa 9 (`fa9b4b4`, `1e049a9`).

---

<a id="operacao-05"></a>
### ⚙️ OPERACAO-05 — Muitas conexões simultâneas podiam esgotar o banco de dados na nuvem sem um gerenciador de conexões

**Situação atual:** ✅ Resolvido  
**Gravidade original:** Média — *o que isso significa:* bancos na nuvem têm um limite de conexões abertas ao mesmo tempo; sem um gerenciador (*pooler*), picos de acesso derrubam o sistema com erro de "conexões esgotadas".  
**Código no catálogo original:** A4

#### 1. Em uma frase
O ambiente de produção já está conectado através do gerenciador de conexões (*pooler*) oficial do NeonDB com limite de tempo de conexão configurado e validado ao vivo.

#### 2. Qual era o problema
Cada servidor Node.js abre um conjunto de conexões com o PostgreSQL. Em bancos serverless como o Neon, conectar direto sem passar pelo **pooler** (um intermediário que reaproveita conexões entre dezenas de pedidos) pode esgotar rapidamente o limite do banco em momentos de maior movimento ou após reinícios.

#### 3. Por que isso era um risco
Erros súbitos de conexão recusada durante picos de uso ou após o banco acordar do modo econômico na nuvem.

#### 4. Por que acontecia (a causa)
É necessário apontar a string de conexão de produção para o endereço `-pooler` do Neon (PgBouncer) com parâmetro de espera de conexão (`connect_timeout`) adequado para partidas frias.

#### 5. Como foi resolvido
1. **Pooler ativo em produção:** o backend no Render conecta-se ao endpoint `-pooler` do NeonDB (`ep-bold-poetry-adxi7rof-pooler`), com `&connect_timeout=15` documentado para tolerar a partida fria do banco.
2. **Estabilidade de sessão em oscilações rápidas:** `authMiddleware.js` isola erros transitórios do Prisma para não desconectar usuários se o banco demorar um instante extra para responder.

#### 6. Como era × como ficou
| Conexão com banco na nuvem | Antes | Depois |
|---|---|---|
| Gerenciamento de conexões | Risco de esgotamento sem pooler | Conectado via Neon `-pooler` + `connect_timeout=15` |

#### 7. Como sabemos que funciona
Validado ao vivo em 11/11/2026 via `GET https://adm-estoque.onrender.com/test-db` (`200 OK`), `npx prisma migrate deploy` (9 migrações) e execução da suíte E2E `7/7` contra o endpoint `-pooler`.

#### 8. O que ainda falta
Nada bloqueante para a operação atual. *(Em planos pagos com alto tráfego futuro, vale ativar o monitoramento contínuo de consultas lentas no painel do Neon).*

#### 9. Detalhe técnico (para desenvolvedores)
- **Arquivos:** [prismaClient.js](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/config/prismaClient.js) · [authMiddleware.js](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/middlewares/authMiddleware.js)
- **Etapa:** Etapa 9 — Reforço final de segurança contra invasões e publicação em nuvem.

---

<a id="operacao-06"></a>
### ⚙️ OPERACAO-06 — Cache, proteção de clique duplo e limite de acessos ficam na memória de um único servidor (impedindo escalar para 2+ servidores)

**Situação atual:** 🟡 Resolvido em parte  
**Gravidade original:** Média — *o que isso significa:* enquanto o sistema roda em 1 servidor no Render, tudo funciona bem; mas se um dia você ligar 2 servidores em paralelo para aguentar mais clientes, um servidor não saberá o que está na memória do outro.  
**Código no catálogo original:** A5

#### 1. Em uma frase
O código morto antigo foi removido e tudo funciona com consistência no servidor único atual, mas cache, controle de clique duplo e limite de requisições ainda vivem na memória RAM local — exigindo **Redis** antes de escalar para 2 ou mais servidores.

#### 2. Qual era o problema
Hoje, cinco estruturas de controle vivem dentro da memória RAM do processo Node.js:
- `userCache` (cache de login),
- `namesCacheByScope` (cache de nomes),
- `idempotencyStore` e `orderIdempotencyStore` (proteção contra clique duplo),
- contadores do `rate-limit` (limite de acessos).

> **Exemplo ilustrativo:** se houver 2 servidores (A e B) rodando juntos e o administrador suspender um funcionário, o servidor A limpa o seu cache, mas o servidor B continua deixando o funcionário entrar por até 60 segundos porque não compartilham a mesma memória.

Além disso, existia uma declaração morta não utilizada (`loginLimiter`) sobrando em `index.js`.

#### 3. Por que isso era um risco
Inconsistência de permissões, falhas na proteção de clique duplo e limites de acesso frouxos **caso** o projeto ative múltiplos servidores em paralelo (escala horizontal).

#### 4. Por que acontecia (a causa)
Usar `Map` em memória local evita pagar e manter um servidor Redis enquanto o sistema ainda roda em uma única máquina no Render — é uma escolha simples e pragmática para o estágio atual, mas precisa ficar documentada como limite de escala.

#### 5. Como foi resolvido
1. **Remoção de código morto:** removida a declaração `loginLimiter` que não era usada em `index.js`.
2. **Escopo seguro em instância única:** todas as chaves em memória já usam isolamento por empresa/loja/usuário, facilitando a migração futura para Redis.

#### 6. Como era × como ficou
| Cenário | 1 servidor (hoje) | 2 ou mais servidores (futuro) |
|---|---|---|
| Cache, clique duplo e rate limit | Funcionam perfeitamente na memória local | **Exigem migração para Redis** antes de escalar |
| Código morto (`loginLimiter` em `index.js`) | Existia sem uso | Removido |

#### 7. Como sabemos que funciona
Confirmado por inspeção em `index.js`, `authMiddleware.js`, `userService.js`, `orderService.js` e `productService.js`.

#### 8. O que ainda falta
- Externalizar `userCache`, `namesCacheByScope`, `idempotencyStore`, `orderIdempotencyStore` e os contadores do `express-rate-limit` para um servidor **Redis** (ex.: Upstash) antes de ativar auto-escala horizontal (2+ contêineres).

#### 9. Detalhe técnico (para desenvolvedores)
- **Arquivos:** [index.js](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/index.js) · [authMiddleware.js](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/middlewares/authMiddleware.js) · [orderService.js](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/services/orderService.js) · [productService.js](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/services/productService.js) · [userService.js](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/services/userService.js)

---

<a id="operacao-07"></a>
### ⚙️ OPERACAO-07 — Faltava rastreamento estruturado para acompanhar o caminho completo de um erro em produção

**Situação atual:** ✅ Resolvido  
**Gravidade original:** Média — *o que isso significa:* quando um cliente relatava um erro em produção, ficava muito difícil descobrir nos registros do servidor exatamente qual pedido deu problema e quanto tempo levou.  
**Código no catálogo original:** A6

#### 1. Em uma frase
Antes, os registros do servidor eram mensagens soltas difíceis de cruzar; agora o servidor grava logs estruturados em JSON (`Pino`) com um código único de rastreio (`X-Request-Id`) em cada requisição.

#### 2. Qual era o problema
Com vários usuários acessando o sistema ao mesmo tempo, mensagens soltas de `console.log` se misturam e não mostram claramente qual requisição começou, qual rota chamou, quanto tempo demorou e qual erro gerou.

#### 3. Por que isso era um risco
Demora para diagnosticar bugs em produção e dificuldade para medir se alguma rota ficou mais lenta com o tempo.

#### 4. Por que acontecia (a causa)
Ausência de um registrador estruturado e de um identificador único por requisição (**Correlation ID**).

#### 5. Como foi resolvido
1. **Logs estruturados com `Pino`:** `logger.js` grava eventos padronizados em formato JSON, fáceis de filtrar nos painéis de nuvem (como o Render).
2. **Etiqueta única por pedido (`X-Request-Id`):** `requestLogger.js` gera um código UUID único para cada requisição, devolve esse código no cabeçalho HTTP e o inclui nos logs daquela operação.

#### 6. Como era × como ficou
| Investigação de erro | Antes | Depois |
|---|---|---|
| Rastrear uma falha de um cliente | Mensagens soltas misturadas | Logs JSON (`Pino`) vinculados pelo código único `X-Request-Id` |

#### 7. Como sabemos que funciona
Confirmado por inspeção direta em `logger.js` e `requestLogger.js`.

#### 8. O que ainda falta
Nada bloqueante para a etapa atual. *(Em produção com muitos clientes pagantes, pode-se conectar esses logs a um painel externo de alertas automáticos de erro e latência).*

#### 9. Detalhe técnico (para desenvolvedores)
- **Arquivos:** [logger.js](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/config/logger.js) · [requestLogger.js](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/middlewares/requestLogger.js)
- **Etapa:** Etapa 6 — Rastreamento de logs e desligamento seguro do servidor.

---

<a id="operacao-08"></a>
### ⚙️ OPERACAO-08 — Faltavam checagens de saúde do servidor e um desligamento seguro sem derrubar ações em andamento

**Situação atual:** ✅ Resolvido  
**Gravidade original:** Média — *o que isso significa:* durante uma atualização de versão no servidor, quem estivesse no meio de uma venda podia ter a conexão cortada bruscamente e deixar conexões abertas no banco.  
**Código no catálogo original:** A7

#### 1. Em uma frase
O servidor agora expõe rotas de checagem de saúde (`/` e `/test-db`) e executa desligamento seguro (**graceful shutdown**), terminando pedidos em andamento e fechando o banco antes de encerrar.

#### 2. Qual era o problema
Quando o provedor de nuvem (Render) reinicia o servidor para publicar uma atualização, ele envia um aviso (`SIGTERM`). Se o programa simplesmente fecha na hora sem se preparar, requisições que estavam no meio de uma gravação são derrubadas no meio do caminho e o banco fica com conexões pendentes.

#### 3. Por que isso era um risco
Falhas inesperadas para usuários exatamente na hora de um deploy e risco de deixar conexões presas no PostgreSQL.

#### 4. Por que acontecia (a causa)
O servidor Express não escutava os sinais de encerramento do sistema operacional (`SIGTERM` e `SIGINT`).

#### 5. Como foi resolvido
1. **Rotas de saúde:** `/` confirma que a API está de pé e `/test-db` confirma a conexão real com o PostgreSQL (sem vazar detalhes técnicos em produção).
2. **Desligamento seguro (`SIGTERM` / `SIGINT`):** em `index.js`, ao receber sinal de parada, o servidor para de aceitar novas conexões, aguarda as requisições em andamento terminarem, desconecta o Prisma (`prisma.$disconnect()`) e aplica um limite máximo de 10 segundos antes de encerrar o processo.

#### 6. Como era × como ficou
| Durante atualização/reinício | Antes | Depois |
|---|---|---|
| Pedidos em andamento na hora do deploy | Podiam ser cortados bruscamente | Servidor fecha com calma, desconecta o banco e encerra em até 10s |
| Conferir se API e banco estão vivos | Verificação parcial | `/` e `/test-db` operacionais e seguras |

#### 7. Como sabemos que funciona
Confirmado em `backend/src/index.js` (linhas 118–195) e testado ao vivo em produção (`https://adm-estoque.onrender.com/test-db` retornando `200 OK` em 11/11/2026).

#### 8. O que ainda falta
Nada pendente identificado.

#### 9. Detalhe técnico (para desenvolvedores)
- **Arquivo:** [index.js](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/src/index.js)
- **Função / Rotas:** `shutdown`, `GET /`, `GET /test-db`
- **Etapas / Commits:** Etapa 6 e Etapa 9 (`1e049a9`).

---

## 6. Tema: Interface e comunicação com o servidor (`TELA`)

<a id="tela-01"></a>
### 🖥️ TELA-01 — Recarregar a página ou ficar sem login podia causar tela branca ou abrir páginas sem permissão

**Situação atual:** ✅ Resolvido  
**Gravidade original:** Média — *o que isso significa:* apertar F5 ou sair da conta podia travar a tela inteira em branco, e faltava feedback visual quando o servidor na nuvem demorava alguns segundos para acordar.  
**Código no catálogo original:** B8

#### 1. Em uma frase
As rotas privadas agora validam login e lista de cargos permitidos no `ProtectedRoute.jsx`, os componentes protegem contra usuário nulo e o cliente HTTP exibe um aviso amigável quando o servidor na nuvem está acordando.

#### 2. Qual era o problema
Em aplicações React, se um componente tenta ler `user.nome` antes de o estado do usuário terminar de carregar (ou logo após clicar em "Sair"), o navegador trava com erro `Cannot read properties of null` e a tela inteira fica branca. Além disso, faltava suportar múltiplos cargos permitidos por tela (como `ADMIN` e `GERENTE` juntos) e avisar o usuário durante a partida fria (*cold-start*) do servidor no Render.

#### 3. Por que isso era um risco
Experiência quebrada ao recarregar páginas, menus/rotas visíveis para perfis errados e usuários achando que o site travou enquanto o servidor gratuito estava acordando.

#### 4. Por que acontecia (a causa)
Acesso direto a propriedades de `user` sem checagem de estado carregado e guarda de rota simples que só aceitava um cargo por vez.

#### 5. Como foi resolvido
1. **Guarda de rotas por lista de cargos:** `ProtectedRoute.jsx` agora aceita listas como `requiredRole={["ADMIN", "GERENTE"]}` e redireciona corretamente quem não tem sessão ou permissão.
2. **Proteção contra estado nulo:** componentes principais (como `Sidebar.jsx`) tratam corretamente o estado nulo sem quebrar a página.
3. **Aviso inteligente de servidor acordando:** `apiClient.js` integrado a `serverToast.js` aguarda `1000 ms` e, se o servidor ainda estiver acordando no Render, mostra um aviso elegante na tela explicando que a conexão está sendo estabelecida.

#### 6. Como era × como ficou
| Situação na tela | Antes | Depois |
|---|---|---|
| Recarregar tela ou deslogar | Risco de tela branca (`null pointer`) | Tratado com segurança e redirecionamento limpo |
| Servidor no Render demorando para acordar | Tela parecia travada sem explicação | Aviso visual automático após `1000 ms` via `serverToast.js` |

#### 7. Como sabemos que funciona
Confirmado por inspeção de código, `npm --prefix frontend run lint` (`0` erros/avisos) e `vite build` (`2.420` módulos) em 11/11/2026.

#### 8. O que ainda falta
Nada bloqueante identificado.

#### 9. Detalhe técnico (para desenvolvedores)
- **Arquivos:** [ProtectedRoute.jsx](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/frontend/src/components/ProtectedRoute.jsx) · [apiClient.js](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/frontend/src/services/api/apiClient.js) · [serverToast.js](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/frontend/src/services/api/serverToast.js)
- **Commits:** `be32536`, `22c3448`.

---

<a id="tela-02"></a>
### 🖥️ TELA-02 — Algumas telas chamavam o servidor fora do canal padrão, perdendo avisos e controles automáticos

**Situação atual:** 🟡 Resolvido em parte  
**Gravidade original:** Baixa — *o que isso significa:* uma chamada feita "por fora" do cliente oficial pode esquecer de mandar a loja selecionada (`X-Loja-Id`), deixar de deslogar quando a sessão expira ou não exibir o aviso de servidor acordando.  
**Código no catálogo original:** B9

#### 1. Em uma frase
Quase todo o frontend (incluindo o formulário de login) já foi unificado no cliente padrão `apiClient.js`; restam apenas **2 chamadas diretas `fetch()`** dentro do componente `EditarItem.jsx`.

#### 2. Qual era o problema
Quando cada tela usa `fetch()` por conta própria em vez do módulo central (`apiClient.js`), qualquer regra global que você cria (como enviar automaticamente o crachá `Bearer`, enviar o cabeçalho da loja selecionada `X-Loja-Id`, mostrar o aviso de servidor acordando ou deslogar em erro `401`) deixa de funcionar naquela tela específica.

#### 3. Por que isso era um risco
Comportamento inconsistente ao editar itens em comparação com o restante do sistema (por exemplo, não exibir o toast de espera ou ter tratamento diferente se o token expirar na hora da edição).

#### 4. Por que acontecia (a causa)
`EditarItem.jsx` é um componente antigo que já usava `fetch()` diretamente e acabou ficando de fora da migração final para o `apiClient.js`.

#### 5. Como foi resolvido
1. **Migração do login e demais páginas:** `LoginForm.jsx` e todas as telas novas (Lojas, Pedidos, Desempenho, Usuários) já utilizam exclusivamente `apiClient.js`.

#### 6. Como era × como ficou
| Componente | Antes | Depois |
|---|---|---|
| `LoginForm.jsx` e páginas novas | Chamadas espalhadas | 100% unificados em `apiClient.js` |
| `EditarItem.jsx` | 2 chamadas `fetch()` diretas | **Ainda possui 2 chamadas `fetch()` diretas** (linhas `365` e `417`) |

#### 7. Como sabemos que funciona
Confirmado diretamente no código atual em 17/11/2026: busca por `fetch(` em `frontend/src/components/forms/EditarItem.jsx` encontrou exatamente as linhas **365** e **417** *(observação: relatórios antigos citavam linhas 308 e 360 antes da reformatação do arquivo no commit `78b362e`)*.

#### 8. O que ainda falta
- Substituir as 2 chamadas `fetch()` nas linhas `365` e `417` de `EditarItem.jsx` por chamadas ao `apiClient.js`.

#### 9. Detalhe técnico (para desenvolvedores)
- **Arquivos:** [EditarItem.jsx](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/frontend/src/components/forms/EditarItem.jsx#L365-L417) · [apiClient.js](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/frontend/src/services/api/apiClient.js)

---

## 7. Tema: Testes e automação (`QUALIDADE`)

<a id="qualidade-01"></a>
### 🧪 QUALIDADE-01 — Falta de testes automatizados e de verificação automática antes de publicar novas versões

**Situação atual:** 🟡 Resolvido em parte  
**Gravidade original:** Média — *o que isso significa:* sem testes automáticos, uma mudança feita hoje pode quebrar sem querer uma regra antiga de segurança ou estoque sem ninguém perceber antes de ir para o ar.  
**Código no catálogo original:** I11

#### 1. Em uma frase
O projeto saiu de zero testes para uma suíte real de **7 testes completos de ponta a ponta** no backend mais checagens de segurança, lint e build; ainda faltam testes automáticos de navegador (Playwright) e uma esteira automática no GitHub (CI/CD).

#### 2. Qual era o problema
No diagnóstico inicial (08/11/2026), não havia nenhum teste automatizado válido cobrindo as regras críticas de negócio (isolamento entre empresas, bloqueio de operador, pedidos, estornos, demissão de funcionário). Toda conferência precisava ser feita clicando manualmente tela por tela.

#### 3. Por que isso era um risco
Regressões silenciosas (consertar uma tela e quebrar outra sem perceber) e medo de alterar partes críticas do código no futuro.

#### 4. Por que acontecia (a causa)
Os testes ainda não haviam sido criados na versão inicial do projeto.

#### 5. Como foi resolvido
1. **Suíte oficial E2E no backend (`multitenant_audit.test.mjs`):** executa **7 cenários completos** contra a API e o banco Neon reais, validando cadastro de organização, criação de filiais, isolamento entre empresas, bloqueios de cargo, multipedidos com estorno, demissão com preservação histórica e bloqueio imediato de suspensos.
2. **Verificação de segurança (`verify_security.mjs`):** testa unitariamente as proteções contra XSS, links maliciosos, fórmulas em planilhas, path traversal e ocultação de erros `500`.
3. **Verificação de qualidade do frontend:** `eslint .` (`0` erros e `0` avisos) e `vite build` (`2.420` módulos compilados sem falhas).

#### 6. Como era × como ficou
| Camada de teste | Antes (08/11) | Hoje |
|---|---|---|
| Testes de ponta a ponta no backend | Nenhum (`0%`) | `7/7` cenários reais aprovados no Neon (`multitenant_audit.test.mjs`) |
| Checagem de sanitização e lint/build | Manual | Verificação unitária de segurança + `eslint` (`0` erros) + `vite build` |
| Testes de interface no navegador e CI no GitHub | Inexistentes | **Ainda pendentes** |

#### 7. Como sabemos que funciona
Todos os **7/7 cenários** da suíte `multitenant_audit.test.mjs`, a verificação de segurança, o `eslint .` e o `vite build` foram executados e aprovados após o endurecimento de segurança de 11/11/2026.

#### 8. O que ainda falta
- Criar uma esteira automática (**CI no GitHub Actions**, arquivo em `.github/workflows/`) para rodar testes, lint e build automaticamente a cada alteração enviada.
- Adicionar testes unitários isolados para regras de negócio individuais e testes automatizados de navegador (**Playwright**) cobrindo cliques reais nas telas.

#### 9. Detalhe técnico (para desenvolvedores)
- **Arquivos:** [multitenant_audit.test.mjs](file:///c:/Users/Ique%20Santana/Desktop/Mateus/vscode/projetos/portifolio/Estoque.OS/backend/tests/multitenant_audit.test.mjs)
- **Etapas / Commits:** Etapa 7, Etapa 8 e Etapa 9 (`3c95ebc`, `fa9b4b4`, `1e049a9`).
