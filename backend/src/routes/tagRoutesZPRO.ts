import express, { Router } from 'express';
import isAuthZPRO from '../middleware/isAuthZPRO';
import * as TagController from '../controllers/TagControllerZPRO';

const tagRoutes: Router = Router();

// Rotas para gerenciamento de tags
tagRoutes.post('/tags', isAuthZPRO, TagController.store);
tagRoutes.get('/tags', isAuthZPRO, TagController.index);
tagRoutes.put('/tags/:tagId', isAuthZPRO, TagController.update);
tagRoutes.delete('/tags/:tagId', isAuthZPRO, TagController.remove);

export default tagRoutes; 