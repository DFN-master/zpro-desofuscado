import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import * as SessionController from '../controllers/SessionControllerZPRO';
import * as UserController from '../controllers/UserControllerZPRO';
import AppErrorZPRO from '../errors/AppErrorZPRO';

// Configuração do limitador de taxa para tentativas de login
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // limite de 5 tentativas
  handler: (_req, _res, next) => {
    next(new AppErrorZPRO('ERR_LIMIT_MAX', 429));
  }
});

// Criação do roteador
const authRoutes = Router();

// Definição das rotas de autenticação
authRoutes.post('/signup', UserController.store);
authRoutes.post('/login', loginLimiter, SessionController.store);
authRoutes.post('/logout', SessionController.logout);
authRoutes.post('/refresh_token', SessionController.update);

export default authRoutes; 