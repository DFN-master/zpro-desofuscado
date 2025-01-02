import { Message, Chat } from "whatsapp-web.js";
import AppError from "../../errors/AppErrorZPRO";
import GetTicketWbotById from "../../helpers/GetTicketWbotByIdZPRO";
import { logger } from "../../utils/loggerZPRO";
import GroupChat from "../../models/GroupChat";
import { WAWebJS } from "whatsapp-web.js";

interface SendGroupMessageData {
  message: string;
  whatsappId: number;
}

interface GroupMessageStatus {
  groupId: string;
  status: 'success' | 'error';
  error?: string;
}

// Valida se a mensagem está dentro dos limites permitidos
const validateMessage = (message: string): boolean => {
  if (!message || message.length === 0) {
    throw new AppError("MESSAGE_REQUIRED");
  }
  if (message.length > 1000) {
    throw new AppError("MESSAGE_TOO_LONG");
  }
  return true;
};

// Verifica se o grupo está ativo e permite mensagens
const validateGroup = async (chat: Chat): Promise<boolean> => {
  try {
    if (!chat.isGroup) {
      return false;
    }
    const groupMetadata = await chat.getMetadata();
    return !groupMetadata.announce || groupMetadata.participants.some(p => p.isAdmin);
  } catch (err) {
    logger.error(`Error validating group ${chat.id._serialized}: ${err}`);
    return false;
  }
};

// Processa o envio da mensagem com retry em caso de erro
const processGroupMessage = async (
  wbot: any,
  chat: Chat, 
  message: string,
  retryCount = 0
): Promise<GroupMessageStatus> => {
  try {
    if (await validateGroup(chat)) {
      await wbot.sendMessage(chat.id._serialized, message);
      return {
        groupId: chat.id._serialized,
        status: 'success'
      };
    }
    return {
      groupId: chat.id._serialized,
      status: 'error',
      error: 'INVALID_GROUP'
    };
  } catch (err) {
    if (retryCount < 3) {
      // Aguarda 2s e tenta novamente
      await new Promise(resolve => setTimeout(resolve, 2000));
      return processGroupMessage(wbot, chat, message, retryCount + 1);
    }
    return {
      groupId: chat.id._serialized,
      status: 'error',
      error: err.message
    };
  }
};

const SendGroupMessage = async ({
  message,
  whatsappId
}: SendGroupMessageData): Promise<GroupMessageStatus[]> => {
  validateMessage(message);
  
  const wbot = await GetTicketWbotById(whatsappId);
  const results: GroupMessageStatus[] = [];

  try {
    let messageBody = message;

    const chats = await wbot.getChats();
    const groupChats = chats.filter(chat => chat.isGroup);

    if (groupChats.length == 0) {
      logger.info("::: ZDG ::: No groups found");
      return results;
    }

    // Processa os grupos em lotes de 5 para evitar sobrecarga
    const batchSize = 5;
    for (let i = 0; i < groupChats.length; i += batchSize) {
      const batch = groupChats.slice(i, i + batchSize);
      
      const batchPromises = batch.map((chat, index) => {
        return new Promise<GroupMessageStatus>(resolve => {
          setTimeout(async () => {
            const result = await processGroupMessage(wbot, chat, messageBody);
            resolve(result);
          }, 2000 * Math.floor(Math.random() * 5) * (index + 1));
        });
      });

      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);

      // Aguarda 5s entre os lotes
      if (i + batchSize < groupChats.length) {
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
    }

    const successCount = results.filter(r => r.status === 'success').length;
    const errorCount = results.filter(r => r.status === 'error').length;
    
    logger.info(`Bulk message sent to ${successCount} groups. Failed: ${errorCount}`);
    
    return results;

  } catch (err) {
    logger.error(`::: Z-PRO ::: Error sending bulk message: ${err}`);
    throw new AppError("ERR_SEND_MESSAGE_WAPP_GROUP");
  }
};

// Função auxiliar para verificar status do envio
const checkMessageStatus = async (
  messageId: string,
  whatsappId: number
): Promise<'sent' | 'delivered' | 'read' | 'failed'> => {
  try {
    const wbot = await GetTicketWbotById(whatsappId);
    const msg = await wbot.getMessage(messageId);
    
    if (msg.ack >= 3) return 'read';
    if (msg.ack >= 2) return 'delivered';
    if (msg.ack >= 1) return 'sent';
    return 'failed';
  } catch (err) {
    logger.error(`Error checking message status: ${err}`);
    return 'failed';
  }
};

export {
  SendGroupMessage as default,
  checkMessageStatus,
  validateMessage,
  validateGroup,
  GroupMessageStatus
}; 