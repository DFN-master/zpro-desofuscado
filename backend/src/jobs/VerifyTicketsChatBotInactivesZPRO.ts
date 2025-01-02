import { logger } from '../utils/loggerZPRO';
import FindUpdateTicketsInactiveChatBotZPRO from '../services/TicketServices/FindUpdateTicketsInactiveChatBotZPRO';

interface JobHandler {
  handle(): Promise<void>;
}

export const VerifyTicketsChatBotInactivesZPRO: JobHandler = {
  async handle(): Promise<void> {
    try {
      logger.info(':::  Z-PRO ::: FindUpdateTicketsInactiveChatBot Initiated');
      
      await FindUpdateTicketsInactiveChatBotZPRO();
      
      logger.info(':::  Z-PRO ::: FindUpdateTicketsInactiveChatBot Finalized');
    } catch (error) {
      logger.error({
        message: 'Error sending messages',
        error
      });
      throw new Error(error as string);
    }
  }
}; 