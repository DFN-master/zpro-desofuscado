import { Router } from 'express';
import * as autenticacaoController from '../controllers/autenticacaoController';
import { isAuthLocal } from '../middleware/isAuthLocal';

const router = Router();

router.post('/autenticar', isAuthLocal, autenticacaoController.autenticar);

export default router; 