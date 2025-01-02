import { MessengerClient } from 'messaging-api-messenger';
import { logger } from '../utils/loggerZPRO';
import { AppError } from '../errors/AppErrorZPRO';

interface MessengerConfig {
  id: string;
  tokenAPI: string;
}

const sessionsMessenger: MessengerClient[] = [];

export const initMessengerBot = async (config: MessengerConfig): Promise<MessengerClient> => {
  try {
    const { tokenAPI } = config;
    const appId = process.env.FACEBOOK_APP_ID;

    if (!tokenAPI) {
      throw new Error('Token não configurado');
    }

    const client = new MessengerClient({
      accessToken: tokenAPI,
      appId: appId
    });

    client.id = config.id;

    const sessionIndex = sessionsMessenger.findIndex(session => session.id === config.id);

    if (sessionIndex === -1) {
      client.id = config.id;
      sessionsMessenger.push(client);
    } else {
      client.id = config.id;
      sessionsMessenger[sessionIndex] = client;
    }

    return client;

  } catch (error) {
    logger.warn(`::: ZDG ::: Z-PRO ::: initMessengerBot error | Error: ${error}`);
    throw new AppError(`${error}`, 400);
  }
};

export const getMessengerBot = (id: string): MessengerClient | undefined => {
  const sessionIndex = sessionsMessenger.findIndex(session => session.id === id);
  return sessionsMessenger[sessionIndex];
}; 