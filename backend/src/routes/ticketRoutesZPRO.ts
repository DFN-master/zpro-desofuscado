import express, { Router } from 'express';
import isAuthZPRO from '../middleware/isAuth';
import * as TicketController from '../controllers/TicketControllerZPRO';

const ticketRoutes: Router = Router();

// Rotas básicas de tickets
ticketRoutes.get('/tickets', isAuthZPRO, TicketController.index);
ticketRoutes.get('/tickets/:ticketId', isAuthZPRO, TicketController.show);
ticketRoutes.get('/ticketsChannel', isAuthZPRO, TicketController.getChannelId);
ticketRoutes.post('/tickets', isAuthZPRO, TicketController.store);
ticketRoutes.put('/tickets/:ticketId', isAuthZPRO, TicketController.update);

// Rotas específicas
ticketRoutes.put('/ticketsForce/:ticketId', isAuthZPRO, TicketController.updateForce);
ticketRoutes.put('/ticketsChatBot/:ticketId', isAuthZPRO, TicketController.updateChatBot);
ticketRoutes.put('/ticketsClear/:ticketId', isAuthZPRO, TicketController.updateChannel);
ticketRoutes.put('/ticketsNull/:ticketId', isAuthZPRO, TicketController.updateNull);
ticketRoutes.put('/ticketsChannel', isAuthZPRO, TicketController.updateChannelId);

// Rotas de gerenciamento
ticketRoutes.delete('/tickets/:ticketId', isAuthZPRO, TicketController.remove);
ticketRoutes.get('/tickets/:ticketId/logs', isAuthZPRO, TicketController.showLogsTicket);

export default ticketRoutes; 