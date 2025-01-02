import { Router } from 'express';
import isAuthZPRO from '../middleware/isAuthZPRO';
import * as WordListController from '../controllers/WordListControllerZPRO';

const wordListRoutes = Router();

// Rotas para gerenciamento de listas de palavras
wordListRoutes.get('/wordList', isAuthZPRO, WordListController.index);
wordListRoutes.get('/wordList/:wordListId', isAuthZPRO, WordListController.show);
wordListRoutes.post('/wordList', isAuthZPRO, WordListController.store);
wordListRoutes.put('/wordList/:wordListId', isAuthZPRO, WordListController.update);
wordListRoutes.delete('/wordList/:wordListId', isAuthZPRO, WordListController.remove);
wordListRoutes.delete('/wordListAll', isAuthZPRO, WordListController.removeAll);

export default wordListRoutes; 