import express, { Router } from 'express';
import isAuthZPRO from '../middleware/isAuthZPRO';
import * as FarewellPrivateMessageController from '../controllers/FarewellPrivateMessageControllerZPRO';

const farewellPrivateMessageRoutes: Router = Router();

// Rotas para mensagens privadas de despedida
farewellPrivateMessageRoutes.get(
  '/farewellPrivateMessage/:farewellMessageId',
  isAuthZPRO,
  FarewellPrivateMessageController.show
);

farewellPrivateMessageRoutes.get(
  '/farewellPrivateMessage',
  isAuthZPRO,
  FarewellPrivateMessageController.index
);

farewellPrivateMessageRoutes.post(
  '/farewellPrivateMessage',
  isAuthZPRO,
  FarewellPrivateMessageController.store
);

farewellPrivateMessageRoutes.put(
  '/farewellPrivateMessage/:farewellMessageId',
  isAuthZPRO,
  FarewellPrivateMessageController.update
);

farewellPrivateMessageRoutes.delete(
  '/farewellPrivateMessage/:farewellMessageId',
  isAuthZPRO,
  FarewellPrivateMessageController.remove
);

farewellPrivateMessageRoutes.delete(
  '/farewellPrivateMessageAll',
  isAuthZPRO,
  FarewellPrivateMessageController.removeAll
);

export default farewellPrivateMessageRoutes; 