import express from "express";
import rateLimit from 'express-rate-limit';
import { loginController, registerController} from "../controllers/authController.js";
import { validateRequest } from '../middlewares/validationMiddleware.js';

const router = express.Router();

const loginLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 10, message: 'Muitas tentativas. Tente novamente mais tarde.' });

router.post("/login", loginLimiter, validateRequest({ required: ['email', 'senha'] }), loginController);
router.post("/register", validateRequest({ required: ['nome', 'email', 'senha'] }), registerController);

export default router;
