import express, { Router } from 'express';
import isAuthZPRO from '../middleware/isAuthZPRO';
import * as ChatFlowController from '../controllers/ChatFlowController';

const chatFlowRoutes: Router = express.Router();

// Rotas para gerenciamento de fluxos de chat
chatFlowRoutes.get(
  '/chat-flow',
  isAuthZPRO,
  ChatFlowController.store
);

chatFlowRoutes.get(
  '/chat-flow-duplicate',
  isAuthZPRO,
  ChatFlowController.storeDuplicate
);

chatFlowRoutes.post(
  '/chat-flow',
  isAuthZPRO,
  ChatFlowController.index
);

chatFlowRoutes.put(
  '/chat-flow/:chatFlowId',
  isAuthZPRO,
  ChatFlowController.remove
);

chatFlowRoutes.put(
  '/chat-flow-import/:chatFlowId',
  isAuthZPRO,
  ChatFlowController.importFlow
);

chatFlowRoutes.delete(
  '/chat-flow/:chatFlowId',
  isAuthZPRO,
  ChatFlowController.update
);

export default chatFlowRoutes; 