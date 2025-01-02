import { Router } from 'express';
import isAuthZPRO from '../middleware/isAuthZPRO';
import * as ParticipantsListController from '../controllers/ParticipantsListControllerZPRO';

const participantsListRoutes = Router();

// Rotas para gerenciar lista de participantes
participantsListRoutes.get(
  '/participantsList',
  isAuthZPRO,
  ParticipantsListController.index
);

participantsListRoutes.get(
  '/participantsListAll',
  isAuthZPRO,
  ParticipantsListController.indexAll
);

participantsListRoutes.get(
  '/participantsList/:participantsListId',
  isAuthZPRO,
  ParticipantsListController.show
);

participantsListRoutes.post(
  '/participantsList',
  isAuthZPRO,
  ParticipantsListController.store
);

participantsListRoutes.put(
  '/participantsList/:participantsListId',
  isAuthZPRO,
  ParticipantsListController.update
);

participantsListRoutes.delete(
  '/participantsList/:participantsListId',
  isAuthZPRO,
  ParticipantsListController.remove
);

participantsListRoutes.delete(
  '/participantsListAll',
  isAuthZPRO,
  ParticipantsListController.removeAll
);

export default participantsListRoutes; 