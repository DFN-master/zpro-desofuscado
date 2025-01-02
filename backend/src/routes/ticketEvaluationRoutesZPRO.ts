import { Router } from 'express';
import isAuthZPRO from '../middleware/isAuthZPRO';
import * as TicketEvaluationController from '../controllers/TicketEvaluationControllerZPRO';

const ticketEvaluationRoutes = Router();

// Rotas para avaliações de tickets
ticketEvaluationRoutes.post(
  '/ticketEvaluations',
  isAuthZPRO,
  TicketEvaluationController.store
);

ticketEvaluationRoutes.get(
  '/ticketEvaluations',
  isAuthZPRO,
  TicketEvaluationController.index
);

ticketEvaluationRoutes.put(
  '/ticketEvaluations/:ticketId/logs',
  isAuthZPRO,
  TicketEvaluationController.update
);

ticketEvaluationRoutes.delete(
  '/ticketEvaluations/:ticketId/logs',
  isAuthZPRO,
  TicketEvaluationController.remove
);

ticketEvaluationRoutes.get(
  '/ticketEvaluations/:evaluationId/logs',
  isAuthZPRO,
  TicketEvaluationController.showLogsEvaluation
);

export default ticketEvaluationRoutes; 