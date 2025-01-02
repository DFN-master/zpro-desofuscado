import { Router } from 'express';
import isAuthZPRO from '../middleware/isAuthZPRO';
import * as FarewellMessageController from '../controllers/FarewellMessageController/ZPRO';

const farewellMessageRoutes = Router();

// Rotas para mensagens de despedida
farewellMessageRoutes.get(
  '/farewellMessage',
  isAuthZPRO,
  FarewellMessageController.index
);

farewellMessageRoutes.get(
  '/farewellMessage/:farewellMessageId',
  isAuthZPRO,
  FarewellMessageController.show
);

farewellMessageRoutes.post(
  '/farewellMessage',
  isAuthZPRO,
  FarewellMessageController.store
);

farewellMessageRoutes.put(
  '/farewellMessage/:farewellMessageId',
  isAuthZPRO,
  FarewellMessageController.update
);

farewellMessageRoutes.delete(
  '/farewellMessage/:farewellMessageId',
  isAuthZPRO,
  FarewellMessageController.remove
);

farewellMessageRoutes.delete(
  '/farewellMessageAll',
  isAuthZPRO,
  FarewellMessageController.removeAll
);

export default farewellMessageRoutes; 