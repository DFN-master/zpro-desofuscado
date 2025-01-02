import express, { Router } from 'express';
import isAuthZPRO from '../middleware/isAuthZPRO';
import * as WhatsAppController from '../controllers/WhatsAppControllerZPRO';

const whatsappRoutes: Router = Router();

// Rotas básicas
whatsappRoutes.get('/whatsapp', isAuthZPRO, WhatsAppController.index);
whatsappRoutes.get('/whatsappTenants', isAuthZPRO, WhatsAppController.showTenant);
whatsappRoutes.get('/whatsapp/:whatsappId', isAuthZPRO, WhatsAppController.show);
whatsappRoutes.get('/whatsappTenants/:whatsappId', isAuthZPRO, WhatsAppController.indexTenant);

// Rotas de atualização
whatsappRoutes.put('/whatsapp/:whatsappId', isAuthZPRO, WhatsAppController.update);
whatsappRoutes.put('/whatsappTenants/:whatsappId', isAuthZPRO, WhatsAppController.updateTenant);

// Rotas de criação
whatsappRoutes.post('/setDefault', isAuthZPRO, WhatsAppController.updateIsDefault);
whatsappRoutes.post('/checkConta', isAuthZPRO, WhatsAppController.checkConta);
whatsappRoutes.post('/forceMessage', isAuthZPRO, WhatsAppController.forceMessage);
whatsappRoutes.post('/forceIndividualMessage', isAuthZPRO, WhatsAppController.forceIndividualMessage);
whatsappRoutes.post('/store', isAuthZPRO, WhatsAppController.create);
whatsappRoutes.post('/whatsappTenants', isAuthZPRO, WhatsAppController.storeTenant);

// Rotas de remoção
whatsappRoutes.delete('/whatsapp/:whatsappId', isAuthZPRO, WhatsAppController.remove);
whatsappRoutes.delete('/whatsappTenants/:whatsappId', isAuthZPRO, WhatsAppController.removeTenant);

export default whatsappRoutes; 