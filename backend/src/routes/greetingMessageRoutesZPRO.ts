import { Router } from 'express';
import isAuthZPRO from '../middleware/isAuthZPRO';
import * as GreetingMessageController from '../controllers/GreetingMessageController/ZPRO';

const greetingMessageRoutes = Router();

// Rotas para mensagens de saudação
greetingMessageRoutes.get(
  '/greetingMessage',
  isAuthZPRO,
  GreetingMessageController.index
);

greetingMessageRoutes.get(
  '/greetingMessage/:greetingMessageId',
  isAuthZPRO,
  GreetingMessageController.show
);

greetingMessageRoutes.post(
  '/greetingMessage',
  isAuthZPRO,
  GreetingMessageController.store
);

greetingMessageRoutes.put(
  '/greetingMessage/:greetingMessageId',
  isAuthZPRO,
  GreetingMessageController.update
);

greetingMessageRoutes.delete(
  '/greetingMessage/:greetingMessageId',
  isAuthZPRO,
  GreetingMessageController.remove
);

greetingMessageRoutes.delete(
  '/greetingMessageAll',
  isAuthZPRO,
  GreetingMessageController.removeAll
);

export default greetingMessageRoutes; 