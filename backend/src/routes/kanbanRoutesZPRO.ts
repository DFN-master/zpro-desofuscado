import { Router } from 'express';
import isAuthZPRO from '../middleware/isAuthZPRO';
import * as KanbanController from '../controllers/KanbanController';

const kanbanRoutes = Router();

// Rotas do Kanban
kanbanRoutes.post('/kanban', isAuthZPRO, KanbanController.store);
kanbanRoutes.get('/kanban', isAuthZPRO, KanbanController.index);
kanbanRoutes.put('/kanban/:kanbanId', isAuthZPRO, KanbanController.update);
kanbanRoutes.delete('/kanban/:kanbanId', isAuthZPRO, KanbanController.remove);

export default kanbanRoutes; 