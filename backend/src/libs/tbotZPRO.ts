import { Telegraf } from 'telegraf';
import { getIO } from './socketZPRO';
import { logger } from '../utils/loggerZPRO';

interface TelegramSession extends Telegraf {
  id: number;
}

interface TelegramConfig {
  id: number;
  name: string;
  tenantId: string;
  tokenTelegram: string;
  update: (data: UpdateData) => void;
}

interface UpdateData {
  status: string;
  qrcode: string;
  retries: number;
}

const TelegramSessions: TelegramSession[] = [];

const initTbot = async (config: TelegramConfig): Promise<Telegraf> => {
  return new Promise((resolve, reject) => {
    try {
      const io = getIO();
      const { name, tenantId } = config;

      const bot = new Telegraf(config.tokenTelegram, {});
      bot.id = config.id;

      const sessionIndex = TelegramSessions.findIndex(s => s.id === config.id);

      if (sessionIndex === -1) {
        TelegramSessions.push(bot as TelegramSession);
      } else {
        TelegramSessions[sessionIndex] = bot as TelegramSession;
      }

      bot.launch();

      // Atualizar status inicial
      config.update({
        status: 'CONNECTED',
        qrcode: '',
        retries: 0
      });

      // Emitir evento de conexão
      io.emit(`${tenantId}:whatsappSession`, {
        action: 'update',
        session: config
      });

      logger.info(`::: Z-PRO ::: ZDG ::: Telegram session started successfully - ${name}`);

      // Configurar handlers de encerramento
      process.once('SIGINT', () => bot.stop('SIGINT'));
      process.once('SIGTERM', () => bot.stop('SIGTERM'));

      resolve(bot);

    } catch (err) {
      config.update({
        status: 'DISCONNECTED',
        qrcode: '',
        retries: 0
      });

      logger.warn(`::: Z-PRO ::: ZDG ::: Error starting telegram session: ${err}`);
      reject(new Error('Error starting telegram session.'));
    }
  });
};

const getTbot = (botId: number, checkState = true): Telegraf | undefined => {
  logger.info(`::: Z-PRO ::: ZDG ::: getTbot | checkState: ${botId} | state: ${checkState}`);
  const sessionIndex = TelegramSessions.findIndex(s => s.id === botId);
  return TelegramSessions[sessionIndex];
};

const removeTbot = (botId: number): void => {
  try {
    const sessionIndex = TelegramSessions.findIndex(s => s.id === botId);
    const bot = TelegramSessions[sessionIndex];

    if (sessionIndex !== -1) {
      process.once('SIGINT', () => bot.stop('SIGINT'));
      process.once('SIGTERM', () => bot.stop('SIGTERM'));
      TelegramSessions.splice(sessionIndex, 1);
    }
  } catch (err) {
    logger.warn(`::: Z-PRO ::: ZDG ::: removeTbot | Error: ${err}`);
  }
};

export { initTbot, getTbot, removeTbot }; 