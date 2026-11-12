// arquivo responsável por controlar autorização baseada em papéis (Role-Based Access Control - RBAC).
// atua na camada de middlewares de segurança do backend.
// tecnologias principais: Express.js e AppError.
// usado por: rotas protegidas que exigem privilégios específicos (ex.: ADMIN, GERENTE).

// importações de erros: AppError emite respostas com status 401 (não autenticado) ou 403 (acesso negado).
import { AppError } from "../utils/errorHandler.js";

// função responsável por criar um middleware de autorização que restringe o acesso a determinados papéis (roles).
//
// contexto: utilizada nas declarações de rotas para garantir que apenas os papéis especificados possam executar a ação.
//
// parâmetros:
//   - allowedRoles (array de strings, obrigatório via rest operator): lista de papéis autorizados (ex.: 'ADMIN', 'GERENTE').
//
// retorno: função middleware do Express (req, res, next) => void.
// erros:
//   - AppError(401) se req.user não existir na requisição.
//   - AppError(403) se req.user.role não estiver presente na lista allowedRoles.
// efeitos colaterais: nenhum (validação em memória do usuário autenticado).
//
// passo a passo:
// 1 - recebe allowedRoles como lista de strings via rest parameters.
// 2 - retorna a função middleware do Express recebendo req, res e next.
// 3 - verifica se req.user existe; se não existir, chama next(new AppError("Não autenticado", 401)).
// 4 - verifica se req.user.role pertence à lista allowedRoles; se não pertencer, chama next(new AppError("Acesso negado", 403)).
// 5 - se o usuário possuir o papel permitido, chama next() autorizando a continuação.
export function permit(...allowedRoles) {
  return (req, res, next) => {
    // 3 - valida autenticação prévia
    const { user } = req;
    if (!user) return next(new AppError("Não autenticado", 401));

    // 4 - valida permissão do cargo
    if (!allowedRoles.includes(user.role)) {
      return next(new AppError("Acesso negado", 403));
    }

    // 5 - libera acesso
    next();
  };
}
