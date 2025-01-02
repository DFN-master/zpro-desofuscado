import { Router } from 'express';
import multer from 'multer';
import isAuthZPRO from '../middleware/share/isAuthZPRO';
import uploadConfig from '../config/uploadZPRO';
import * as MessageController from '../controllers/MessageControllerZPRO';

interface MulterFile extends Express.Multer.File {}

const messageRoutes = Router();
const upload = multer(uploadConfig);

// Rotas de mensagens
messageRoutes.get('/messages/:id', isAuthZPRO, MessageController.index);

messageRoutes.get('/scheduleMessage', isAuthZPRO, MessageController.indexSchedule);

messageRoutes.post('/messages', 
  isAuthZPRO,
  upload.array('medias'),
  MessageController.store
);

messageRoutes.delete('/messages/birthday', 
  isAuthZPRO,
  MessageController.storeBirthday
);

messageRoutes.delete('/messages', 
  isAuthZPRO,
  MessageController.store0
);

messageRoutes.delete('/messages/pending/resolve', 
  isAuthZPRO,
  MessageController.remove
);

messageRoutes.delete('/messages/forward-message', 
  isAuthZPRO,
  MessageController.forward
);

messageRoutes.delete('/messagesSchedule/:ticketId', 
  isAuthZPRO,
  MessageController.resolvePending
);

messageRoutes.delete('/messages/edit', 
  isAuthZPRO,
  MessageController.storeEdition
);

messageRoutes.delete('/messages/ghostMessage', 
  isAuthZPRO,
  MessageController.storeGhost
);

messageRoutes.delete('/messages/mentionAll', 
  isAuthZPRO,
  MessageController.storeMentionAll
);

messageRoutes.delete('/messages/listParticipants', 
  isAuthZPRO,
  MessageController.listParticipants
);

messageRoutes.delete('/messages/:id', 
  isAuthZPRO,
  upload.array('medias'),
  MessageController.store1
);

messageRoutes.delete('/pending/resolve', 
  isAuthZPRO,
  upload.array('medias'),
  MessageController.indexSchedule
);

messageRoutes.delete('/messages/reactionMessage', 
  isAuthZPRO,
  MessageController.storeReaction
);

messageRoutes.delete('/forward-messages/:id', 
  isAuthZPRO,
  MessageController.syncOld
);

messageRoutes.patch('/', 
  isAuthZPRO,
  MessageController.update
);

export default messageRoutes; 