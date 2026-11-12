// arquivo responsável por controlar requisições HTTP de categorias de produtos isoladas por Organização e Loja.
// atua na camada de controladores HTTP do backend.
// tecnologias principais: Express.js e Pino Logger.
// usado por: categoryRoutes.js para responder aos endpoints de listagem, contagem, criação, edição e exclusão de categorias.

// importações de logging: childLogger instancia o logger estruturado com módulo categoryController.
import { childLogger } from "../config/logger.js";
// importações de serviços: categoryService executa as operações de negócio e acesso ao banco de dados.
import * as categoryService from "../services/categoryService.js";
// importações de escopo: resolveReadScope e resolveWriteStore validam o isolamento multitenant entre filiais.
import { resolveReadScope, resolveWriteStore } from "../utils/tenantScope.js";

// instância de logger para registro de operações de categorias
const log = childLogger("categoryController");

// função responsável por listar categorias pertencentes à organização ou à loja selecionada no escopo.
//
// contexto: invocada pela rota GET /categories para abastecer menus de navegação e seletores de cadastro.
//
// parâmetros:
//   - req (Request, obrigatório): requisição contendo parâmetros de consulta (status) e usuário autenticado.
//   - res (Response, obrigatório): resposta Express para envio do array de categorias em formato JSON.
//   - next (NextFunction, obrigatório): função para encaminhamento de exceções ao errorHandler.
//
// retorno: nenhum (envia JSON com a lista de categorias).
// erros: repassa exceções ao next(err) em caso de falha de conexão ou escopo inválido.
// efeitos colaterais: nenhum (leitura no banco de dados).
//
// passo a passo:
// 1 - recebe req, res e next.
// 2 - resolve o escopo de leitura do usuário via resolveReadScope(req).
// 3 - extrai o filtro de status da query string (padrão 'ativos').
// 4 - consulta as categorias no service através de categoryService.listCategories(scope, status).
// 5 - responde enviando o array de categorias em formato JSON.
export async function listCategories(req, res, next) {
  try {
    // 2 - resolve escopo multitenant
    const scope = await resolveReadScope(req);
    // 3 - obtém filtro de status
    const status = req.query.status || "ativos";
    // 4 - busca no serviço
    const cats = await categoryService.listCategories(scope, status);
    // 5 - entrega resposta
    res.json(cats);
  } catch (err) {
    log.error({ err }, "Erro ao listar categorias");
    next(err);
  }
}

// função responsável por contar a quantidade de categorias ativas na organização ou loja do escopo.
//
// contexto: chamada pela rota GET /categories/count para exibir indicadores resumidos no painel.
//
// parâmetros:
//   - req (Request, obrigatório): requisição contendo usuário autenticado e escopo.
//   - res (Response, obrigatório): resposta HTTP para envio do contador em JSON.
//   - next (NextFunction, obrigatório): função de encadeamento de erro.
//
// retorno: nenhum (envia JSON com { count }).
// erros: repassa ao next(err) se houver falha de validação ou consulta.
// efeitos colaterais: nenhum (leitura de contagem).
//
// passo a passo:
// 1 - recebe req, res e next.
// 2 - resolve o escopo de leitura através de resolveReadScope(req).
// 3 - obtém a contagem de categorias ativas com categoryService.countCategories(scope).
// 4 - responde com objeto JSON { count }.
export async function countCategories(req, res, next) {
  try {
    // 2 - resolve escopo
    const scope = await resolveReadScope(req);
    // 3 - calcula total
    const count = await categoryService.countCategories(scope);
    // 4 - devolve contador
    res.json({ count });
  } catch (err) {
    log.error({ err }, "Erro ao contar categorias");
    next(err);
  }
}

// função responsável por cadastrar uma nova categoria vinculada à loja ativa do escopo de escrita.
//
// contexto: invocada pela rota POST /categories por usuários com perfil ADMIN ou GERENTE.
//
// parâmetros:
//   - req (Request, obrigatório): requisição contendo req.body.nome e usuário autenticado.
//   - res (Response, obrigatório): resposta HTTP com status 201 e dados da categoria criada.
//   - next (NextFunction, obrigatório): manipulador de exceções.
//
// retorno: nenhum (responde HTTP 201 com o modelo da categoria criada).
// erros: repassa erro ao next(err) se o nome for duplicado na mesma loja ou escopo for inválido.
// efeitos colaterais: insere novo registro na tabela Categoria no PostgreSQL e emite log de auditoria.
//
// passo a passo:
// 1 - recebe req, res e next.
// 2 - resolve a loja de destino da gravação através de resolveWriteStore(req).
// 3 - aciona categoryService.createCategory passando o nome e o escopo da filial.
// 4 - registra log informativo com os dados da criação (usuário, organização, loja e ID da categoria).
// 5 - responde com status HTTP 201 Created entregando a categoria cadastrada.
export async function createCategory(req, res, next) {
  try {
    // 2 - valida loja de gravação
    const storeScope = await resolveWriteStore(req);
    // 3 - persiste categoria
    const c = await categoryService.createCategory(req.body.nome, storeScope);
    // 4 - auditoria
    log.info(
      {
        user: req.user?.id,
        organizacaoId: storeScope.organizacaoId,
        lojaId: storeScope.lojaId,
        action: "CREATE_CATEGORY",
        targetId: c.id,
      },
      "Categoria criada"
    );
    // 5 - responde com 201
    res.status(201).json(c);
  } catch (err) {
    log.error({ err }, "Erro ao criar categoria");
    next(err);
  }
}

// função responsável por atualizar o nome de uma categoria existente respeitando as permissões do usuário.
//
// contexto: chamada pela rota PUT /categories/:id por administradores ou gerentes da filial.
//
// parâmetros:
//   - req (Request, obrigatório): requisição contendo req.params.id e req.body.nome.
//   - res (Response, obrigatório): resposta HTTP com os dados atualizados da categoria.
//   - next (NextFunction, obrigatório): função de encadeamento.
//
// retorno: nenhum (envia JSON com a categoria atualizada).
// erros: repassa 404 ao next(err) caso a categoria não pertença à organização ou loja do usuário.
// efeitos colaterais: atualiza registro na tabela Categoria no PostgreSQL e grava log de auditoria.
//
// passo a passo:
// 1 - recebe req, res e next.
// 2 - aciona categoryService.updateCategory informando o ID da rota, o novo nome e o contexto de restrição do usuário.
// 3 - registra log de auditoria confirmando a modificação da categoria.
// 4 - envia a resposta JSON com os dados da categoria atualizada.
export async function updateCategory(req, res, next) {
  try {
    // 2 - executa atualização no service com isolamento de filial
    const updated = await categoryService.updateCategory(req.params.id, req.body.nome, {
      organizacaoId: req.user.organizacaoId,
      lojaId: req.user.lojaId,
      restrictToUserStore: req.user.role !== "ADMIN",
    });
    // 3 - auditoria
    log.info(
      {
        user: req.user?.id,
        organizacaoId: req.user.organizacaoId,
        action: "UPDATE_CATEGORY",
        targetId: updated.id,
      },
      "Categoria atualizada"
    );
    // 4 - responde
    res.json(updated);
  } catch (err) {
    log.error({ err }, "Erro ao atualizar categoria");
    next(err);
  }
}

// função responsável por alterar o estado de ativação lógica (ativo = true/false) de uma categoria.
//
// contexto: invocada pela rota PATCH /categories/:id/status para inativação temporária ou reativação de categorias.
//
// parâmetros:
//   - req (Request, obrigatório): requisição contendo req.params.id e req.body.ativo.
//   - res (Response, obrigatório): resposta HTTP com o modelo modificado.
//   - next (NextFunction, obrigatório): função de repasse de erro.
//
// retorno: nenhum (envia JSON com a categoria e seu novo status).
// erros: repassa ao next(err) se a categoria não for encontrada no escopo.
// efeitos colaterais: altera a coluna ativo da tabela Categoria no PostgreSQL.
//
// passo a passo:
// 1 - recebe req, res e next.
// 2 - extrai o booleano ativo do corpo da requisição.
// 3 - aciona categoryService.toggleCategoryStatus com o ID e o escopo de tenant.
// 4 - devolve o modelo da categoria com o status alterado em formato JSON.
export async function toggleCategoryStatus(req, res, next) {
  try {
    // 2 - extrai novo status
    const { ativo } = req.body;
    // 3 - executa alternância lógica no service
    const updated = await categoryService.toggleCategoryStatus(req.params.id, ativo, {
      organizacaoId: req.user.organizacaoId,
      lojaId: req.user.lojaId,
      restrictToUserStore: req.user.role !== "ADMIN",
    });
    // 4 - devolve modelo atualizado
    res.json(updated);
  } catch (err) {
    next(err);
  }
}

// função responsável por processar a exclusão física ou Soft Delete de uma categoria (exclusivo para perfil ADMIN).
//
// contexto: chamada pela rota DELETE /categories/:id na exclusão definitiva de categorias do catálogo.
//
// parâmetros:
//   - req (Request, obrigatório): requisição contendo req.params.id e a organização do administrador autenticado.
//   - res (Response, obrigatório): resposta HTTP com o resultado da exclusão.
//   - next (NextFunction, obrigatório): manipulador de exceções.
//
// retorno: nenhum (envia JSON indicando se houve exclusão permanente ou Soft Delete automático).
// erros: repassa ao next(err) se a categoria não existir na organização.
// efeitos colaterais: exclui o registro no banco OU inativa logicamente se houver produtos vinculados.
//
// passo a passo:
// 1 - recebe req, res e next.
// 2 - invoca categoryService.deleteCategory com o ID da categoria e a organizacaoId do administrador.
// 3 - registra log de auditoria com o resultado da exclusão.
// 4 - responde com o objeto de resultado em formato JSON.
export async function deleteCategory(req, res, next) {
  try {
    // 2 - executa deleção no serviço
    const result = await categoryService.deleteCategory(req.params.id, req.user.organizacaoId);
    // 3 - auditoria
    log.info(
      {
        user: req.user?.id,
        organizacaoId: req.user.organizacaoId,
        action: "DELETE_CATEGORY",
        targetId: req.params.id,
        result,
      },
      "Resultado da exclusão de categoria"
    );
    // 4 - responde ao cliente
    res.json(result);
  } catch (err) {
    log.error({ err }, "Erro ao deletar categoria");
    next(err);
  }
}
