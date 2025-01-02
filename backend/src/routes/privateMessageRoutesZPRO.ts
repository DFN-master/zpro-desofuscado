import { Router } from 'express';
import * as PrivateMessageController from '../controllers/PrivateMessageControllerZPRO';
import isAuthZPRO from '../middleware/isAuthZPRO';
import multer from 'multer';
import uploadConfig from '../config/uploadZPRO';

const PrivateChatRouter = Router();
const upload = multer(uploadConfig);

// Listar mensagens privadas
PrivateChatRouter.get(
  '/chat-privado/msg/:userId',
  isAuthZPRO,
  PrivateMessageController.listPrivateMessage
);

// Listar contagem de mensagens não lidas
PrivateChatRouter.get(
  '/chat-privado/msgs/mensagens',
  isAuthZPRO,
  PrivateMessageController.listPrivateMessageCountUnread
);

// Listar grupos de contatos
PrivateChatRouter.get(
  '/chat-privado/groups',
  isAuthZPRO,
  PrivateMessageController.listGroupContacts
);

// Criar mensagem privada
PrivateChatRouter.post(
  '/chat-privado/msg',
  isAuthZPRO,
  upload.array('medias'),
  PrivateMessageController.createPrivateMessage
);

// Marcar mensagem como lida
PrivateChatRouter.put(
  '/chat-privado/msg/:mensagemId/nao-lida',
  isAuthZPRO,
  PrivateMessageController.marckAsRead
);

// Marcar mensagem como lida por contato
PrivateChatRouter.put(
  '/chat-privado/msg/:contactId',
  isAuthZPRO,
  PrivateMessageController.marckAsRead
);

export default PrivateChatRouter; 