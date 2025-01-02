import { Router } from 'express';
import isAuthZPRO from '../middleware/isAuthZPRO';
import WhatsAppSessionControllerZPRO from '../controllers/WhatsAppSessionControllerZPRO';

const whatsappSessionRoutes = Router();

// Rotas para gerenciamento de sessões WhatsApp
whatsappSessionRoutes.post(
  '/whatsappsession/:whatsappId',
  isAuthZPRO,
  WhatsAppSessionControllerZPRO.store
);

whatsappSessionRoutes.put(
  '/whatsappsession/:whatsappId',
  isAuthZPRO,
  WhatsAppSessionControllerZPRO.update
);

whatsappSessionRoutes.delete(
  '/whatsappsession/:whatsappId',
  isAuthZPRO,
  WhatsAppSessionControllerZPRO.remove
);

export default whatsappSessionRoutes; 