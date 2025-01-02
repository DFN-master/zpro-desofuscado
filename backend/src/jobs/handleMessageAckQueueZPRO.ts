import { Message } from "../models/Message";
import { Chat } from "../models/Chat";
import HandleMsgAckZPRO from "../services/WbotBaileyServices/HandleMsgAckZPRO";
import { logger } from "../utils/logger";

interface QueueData {
  msg: Message;
  chat: Chat;
  tenantId: number;
}

interface QueueMessage {
  data: QueueData;
}

interface SendingMap {
  [key: number]: boolean;
}

const sending: SendingMap = {};

export const handleMessageAckQueueZPRO = {
  key: (tenantId: number): string => `${tenantId}-handleMessageAckQueue`,
  
  async handle(message: QueueMessage): Promise<void> {
    const { data } = message;

    try {
      if (sending[data.tenantId]) {
        return;
      }

      const { msg, chat, tenantId } = data;

      if ((!msg || !chat) || !tenantId) {
        logger.error(
          `handleMessageAckQueue ${tenantId}, Missing parameters because the chat is not defined`
        );
        sending[data.tenantId] = false;
        return;
      }

      sending[data.tenantId] = true;

      try {
        HandleMsgAckZPRO.default(msg, chat);
      } catch (error) {
        logger.error(
          `handleMessageAckQueue ${tenantId}`, 
          JSON.stringify(error)
        );
      } finally {
        sending[data.tenantId] = false;
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

    } catch (error) {
      sending[data.tenantId] = false;
      logger.error(
        `handleMessageAckQueue`, 
        JSON.stringify(error)
      );
    }
  }
}; 