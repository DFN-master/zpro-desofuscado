import { Job } from 'bull';
import SendMessagesSchenduleWbotZPRO from '../services/WbotServices/SendMessagesSchenduleWbotZPRO';
import logger from '../utils/loggerZPRO';

interface JobOptions {
  removeOnComplete: boolean;
  removeOnFail: boolean;
  jobId: string;
  repeat: {
    cron: string;
  };
}

const jobOptions: JobOptions = {
  removeOnComplete: false,
  removeOnFail: false,
  jobId: 'SendMessageSchendule',
  repeat: {
    cron: '*/30 * * * * *' // Executa a cada 30 segundos
  }
};

export default {
  key: 'SendMessageSchendule',
  options: jobOptions,
  async handle(): Promise<void> {
    try {
      logger.info(':::: Z-PRO :::: SendMessageSchendule Initiated');
      
      await SendMessagesSchenduleWbotZPRO();
      
      logger.info(':::: Z-PRO :::: SendMessageSchendule Finalized');
    } catch (error) {
      logger.error({
        message: 'Error sending messages',
        error
      });
      throw new Error(error as string);
    }
  }
}; 