import { Router } from 'express';
import isAuthZPRO from '../middleware/isAuthZPRO';
import * as TicketNotesController from '../controllers/TicketNotesControllerZPRO';

const ticketNotesRoutes = Router();

// Rotas para notas de tickets
ticketNotesRoutes.post(
  '/ticketNotes',
  isAuthZPRO,
  TicketNotesController.store
);

ticketNotesRoutes.get(
  '/ticketNotes',
  isAuthZPRO,
  TicketNotesController.index
);

ticketNotesRoutes.put(
  '/ticketNotes/:ticketNotesId',
  isAuthZPRO,
  TicketNotesController.update
);

ticketNotesRoutes.delete(
  '/ticketNotes/:ticketNotesId',
  isAuthZPRO,
  TicketNotesController.remove
);

ticketNotesRoutes.get(
  '/ticketNotes/:ticketNotesId/logs',
  isAuthZPRO,
  TicketNotesController.showLogsNotes
);

export default ticketNotesRoutes; 