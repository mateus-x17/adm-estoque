// arquivo responsável por definir as rotas protegidas de gestão de colaboradores, perfil individual (/me), situações de RH e transferências entre filiais.
// atua na camada de rotas HTTP do backend.
// tecnologias principais: Express.js Router, Multer, authMiddleware, roleMiddleware (permit) e validationMiddleware.
// usado por: index.js montado sob o prefixo /users.

// importações da biblioteca web: express provê o construtor Router para registro das rotas.
import express from "express";
// importações de autenticação: authMiddleware assegura a presença de sessão JWT e tenant ativo.
import { authMiddleware } from "../middlewares/authMiddleware.js";
// importações de autorização: permit restringe governança de equipe e relatórios de desligamento ao ADMIN.
import { permit } from "../middlewares/roleMiddleware.js";
// importações de validação: validateRequest garante integridade de campos obrigatórios no payload.
import { validateRequest } from "../middlewares/validationMiddleware.js";
// importações dos controladores: métodos de cadastro, edição, consulta e desligamento de usuários.
import {
  createUser,
  listUsers,
  getUser,
  updateUser,
  transferUserStore,
  changeUserSituation,
  deleteUser,
  getDismissalReport,
  getMe,
  updateMe,
  getUserNames,
} from "../controllers/userController.js";
// importações de upload: upload intercepta avatares de fotos de perfil e colaboradores na pasta uploads/usuarios.
import { upload } from "../config/multerConfig.js";

// roteador Express para os endpoints de usuários
const router = express.Router();

// 1 - Autenticação obrigatória com tenant e status ativo
router.use(authMiddleware);

// 2 - Rotas de perfil próprio (/me) acessíveis por qualquer usuário autenticado
router.get("/me", getMe);
router.put(
  "/me",
  upload.single("imagem"),
  validateRequest({ required: ["nome", "email"] }),
  updateMe
);

// 3 - Lista otimizada de nomes de vendedores para seletores (vedada ao OPERADOR por sigilo)
router.get("/names", permit("ADMIN", "GERENTE"), getUserNames);

// 4 - Governança completa de equipe e demissões restritas ao papel ADMIN da Organização
router.use(permit("ADMIN"));

router.post(
  "/",
  upload.single("imagem"),
  validateRequest({ required: ["nome", "email", "senha", "role"] }),
  createUser
);

router.get("/", listUsers);
router.get("/:refId/dismissal-report", getDismissalReport);
router.get("/:id", getUser);

router.put(
  "/:id",
  upload.single("imagem"),
  validateRequest({ required: ["nome", "email", "role"] }),
  updateUser
);

// 5 - Transferência de Gerente ou Operador para outra filial da rede
router.patch("/:id/store", validateRequest({ required: ["lojaId"] }), transferUserStore);

// 6 - Alteração de situação trabalhista do colaborador (ATIVO, SUSPENSO, FERIAS)
router.patch("/:id/situation", validateRequest({ required: ["situacao"] }), changeUserSituation);

// 7 - Demissão de colaborador com cancelamento de matrícula e geração de relatório rescisório
router.delete("/:id", deleteUser);

export default router;
