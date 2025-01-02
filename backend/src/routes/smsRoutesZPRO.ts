import express, { Router } from 'express';
import isAuthZPRO from '../middleware/isAuthZPRO';
import * as SMSController from '../controllers/SMSControllerZPRO';

const smsRoute: Router = Router();

// Rota para enviar SMS individual
smsRoute.post('/sendSms', isAuthZPRO, SMSController.sendSMS);

// Rota para envio em massa de SMS
smsRoute.post('/bulkSms', isAuthZPRO, SMSController.bulkSMS);

export default smsRoute; 