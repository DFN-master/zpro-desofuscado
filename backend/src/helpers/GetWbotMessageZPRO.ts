import { Message, Chat } from 'whatsapp-web.js';
import GetTicketWbot from './GetTicketWbotZPRO';
import AppError from '../errors/AppErrorZPRO';
import { logger } from '../utils/loggerZPRO';
import { Ticket } from '../models/Ticket';

interface MessageFound {
  id: {
    id: string;
  };
}

const GetWbotMessage = async (
  ticket: Ticket,
  messageId: string,
  limit: number = 20
): Promise<Message | undefined> => {
  try {
    const wbot = await GetTicketWbot(ticket);
    const chatId = `${ticket.contact.number}@${ticket.isGroup ? 'g' : 'c'}.us`;
    const chat: Chat = await wbot.getChatById(chatId);

    let count = 0;

    const fetchMessage = async (): Promise<Message | undefined> => {
      const messages = await chat.fetchMessages({ limit: count });
      const messageFound = messages.find(msg => msg.id.id === messageId);

      if (!messageFound && count < limit) {
        count += 20;
        return fetchMessage();
      }

      return messageFound;
    };

    const message = await fetchMessage();

    if (!message) {
      logger.warn(
        `:::Z-PRO:::ZDG::: Cannot found message within ${limit} last messages`
      );
      return undefined;
    }

    return message;
  } catch (err) {
    logger.error(err);
    throw new AppError('ERR_FETCH_WAPP_MSG');
  }
};

export default GetWbotMessage; 