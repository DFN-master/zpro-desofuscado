import { logger } from '../utils/loggerZPRO';

interface JobOptions {
  repeat: {
    every: number;
  };
  removeOnComplete: boolean;
  removeOnFail: boolean;
}

interface Consumer360JobZPRO {
  options: JobOptions;
  handle(): Promise<void>;
}

const options: JobOptions = {
  repeat: {
    every: 1000 * 60 * 60 // 1 hora em milissegundos
  },
  removeOnComplete: true,
  removeOnFail: false
};

const consumer360JobZPRO: Consumer360JobZPRO = {
  options,
  
  async handle(): Promise<void> {
    try {
      // Aqui você pode adicionar a lógica do job
      // O código original estava vazio no bloco try
      
    } catch (error) {
      logger.error({
        message: "Error sending messages",
        error
      });
      throw new Error(error as string);
    }
  }
};

export default consumer360JobZPRO; 