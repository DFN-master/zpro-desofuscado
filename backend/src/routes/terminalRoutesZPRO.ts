import express, { Router } from 'express';
import isAuthZPRO from '../middleware/isAuthZPRO';
import { handleCommand } from '../controllers/TerminalControllerZPRO';

const router: Router = Router();

router.post('/command', isAuthZPRO, handleCommand);

export default router; 