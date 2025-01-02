import { Router } from 'express';
import * as FacebookController from '../controllers/FacebookController-pages/FacebookControllerZPRO';
import isAuthZPRO from '../middleware/isAuthZPRO';

const fbRoutes = Router();

// Rotas do Facebook
fbRoutes.post('/fb/register-pages', isAuthZPRO, FacebookController.store);
fbRoutes.post('/fb/logout', isAuthZPRO, FacebookController.facebookLogout);

export default fbRoutes; 