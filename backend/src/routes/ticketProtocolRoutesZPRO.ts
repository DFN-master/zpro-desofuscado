import express, { Router } from 'express';
import isAuthZPRO from '../middleware/isAuthZPRO';
import * as TicketProtocolController from '../controllers/TicketProtocolControllerZPRO';

const ticketProtocolRoutes: Router = Router();

// Rotas para protocolos de tickets
ticketProtocolRoutes.post(
  '/ticketProtocols',
  isAuthZPRO,
  TicketProtocolController.create
);

ticketProtocolRoutes.get(
  '/ticketProtocols',
  isAuthZPRO,
  TicketProtocolController.index
);

ticketProtocolRoutes.put(
  '/ticketProtocols/:ticketProtocolId',
  isAuthZPRO,
  TicketProtocolController.update
);

ticketProtocolRoutes.delete(
  '/ticketProtocols/:ticketProtocolId',
  isAuthZPRO,
  TicketProtocolController.remove
);

ticketProtocolRoutes.get(
  '/ticketProtocols/:ticketId/logs',
  isAuthZPRO,
  TicketProtocolController.showLogsProtocol
);

export default ticketProtocolRoutes; 