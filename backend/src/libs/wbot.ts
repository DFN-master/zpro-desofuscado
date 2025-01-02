import { Client, LocalAuth, DefaultOptions } from 'whatsapp-web.js';
import path from 'path';
import { rm } from 'fs/promises';
import { getIO } from './socket';
import { logger } from './logger';
import SyncUnreadMessages from '../services/WbotServices/SyncUnreadMessages';
import AppError from '../errors/AppError';
import Queue from './Queue';

interface WhatsAppSession {
  id: string;
  status: string;
  qrcode: string;
  retries: number;
  number?: string;
  phone?: any;
  profilePic?: string;
  tenantId: number | string;
}

const sessions: Client[] = [];

const MINIMAL_CHROME_ARGS = [
  '--disable-default-apps',
  '--disable-gpu',
  '--disable-sync',
  '--no-sandbox',
  '--disable-background-networking',
  '--disable-background-timer-throttling',
  '--disable-breakpad',
  '--disable-client-side-phishing-detection',
  '--disable-component-extensions-with-background-pages',
  '--disable-dev-shm-usage',
  '--disable-extensions',
  '--disable-features=AudioServiceOutOfProcess',
  '--disable-hang-monitor',
  '--disable-ipc-flooding-protection',
  '--disable-notifications',
  '--disable-offer-store-unmasked-wallet-cards',
  '--disable-popup-blocking',
  '--disable-print-preview',
  '--disable-prompt-on-repost',
  '--disable-renderer-backgrounding',
  '--disable-setuid-sandbox',
  '--disable-speech-api',
  '--hide-scrollbars',
  '--ignore-gpu-blacklist',
  '--metrics-recording-only',
  '--mute-audio',
  '--no-default-browser-check',
  '--no-first-run',
  '--no-pings',
  '--no-zygote',
  '--password-store=basic',
  '--use-gl=swiftshader',
  '--use-mock-keychain'
];

export const apagarPastaSessao = async (whatsappId: string): Promise<void> => {
  try {
    const dirPath = path.join(__dirname, '..', '..', 'sessions');
    const sessionDir = `${dirPath}/.wwebjs_auth/session-${whatsappId}`;
    await rm(sessionDir, { recursive: true, force: true });
  } catch (error) {
    logger.error(`Error removing session folder: ${sessionDir}`);
    logger.error(error);
  }
};

export const removeWbot = (whatsappId: string): void => {
  try {
    const sessionIndex = sessions.findIndex(s => s.id === whatsappId);
    if (sessionIndex !== -1) {
      sessions[sessionIndex].destroy();
      sessions.splice(sessionIndex, 1);
    }
  } catch (err) {
    logger.error(`Error removing whatsapp session: ${err}`);
  }
};

const checkMessages = async (wbot: Client, tenantId: string | number): Promise<void> => {
  try {
    const isConnected = wbot && (await wbot.getState()) === 'CONNECTED';
    if (isConnected) {
      Queue.add(`${wbot.id}-checkMessages`, {
        sessionId: wbot.id,
        tenantId
      });
    }
  } catch (err) {
    logger.error(`Error checking messages: ${err}`);
    
    if (err.message === 'ERR_WAPP_NOT_INITIALIZED') {
      removeWbot(wbot.id);
    }
  }
};

export const initWbot = async (whatsapp: WhatsAppSession): Promise<Client> => {
  return new Promise((resolve, reject) => {
    try {
      const io = getIO();
      const sessionName = whatsapp.name;
      const { tenantId } = whatsapp;

      const client = new Client({
        authStrategy: new LocalAuth({ clientId: `wbot-${whatsapp.id}` }),
        puppeteer: {
          executablePath: process.env.CHROME_BIN || undefined,
          args: [
            `--user-agent=${DefaultOptions.userAgent}`,
            ...MINIMAL_CHROME_ARGS
          ]
        },
        webVersion: "2.2413.51-beta-alt",
        webVersionCache: { type: "local" }
      });

      client.id = whatsapp.id;

      client.initialize();

      client.on('qr', async (qr) => {
        logger.info(`Session QR CODE: ${sessionName} | BOT ID: ${whatsapp.id}-${whatsapp.status}`);
        await whatsapp.update({
          qrcode: qr,
          status: 'qrcode',
          retries: 0
        });
        
        const sessionIndex = sessions.findIndex(s => s.id === whatsapp.id);
        if (sessionIndex === -1) {
          sessions.push(client);
        }

        io.emit(`${tenantId}:whatsappSession`, {
          action: 'update',
          session: whatsapp
        });
      });

      client.on('authenticated', () => {
        logger.info(`Session authenticated: ${sessionName}`);
      });

      client.on('auth_failure', async (msg) => {
        logger.error(`Session auth error | ${sessionName}: ${msg}`);
        
        if (whatsapp.retries > 1) {
          await whatsapp.update({
            retries: 0,
            session: ''
          });
        }

        await whatsapp.update({ 
          status: 'DISCONNECTED',
          retries: whatsapp.retries + 1
        });

        io.emit(`${tenantId}:whatsappSession`, {
          action: 'update',
          session: whatsapp
        });
        
        reject(new Error('Auth failure, check the whatsapp connection.'));
      });

      client.on('ready', async () => {
        logger.info(`Session ready: ${sessionName}`);

        const profilePic = await client.getProfilePicUrl(client?.info?.wid?._serialized);

        await whatsapp.update({
          status: 'CONNECTED',
          qrcode: '',
          retries: 0,
          number: client?.info?.wid?.user,
          phone: client?.info || {},
          profilePic: profilePic || ''
        });

        io.emit(`${tenantId}:whatsappSession`, {
          action: 'update',
          session: whatsapp
        });

        io.emit(`${tenantId}:whatsappSession`, {
          action: 'readySession',
          session: whatsapp
        });

        const sessionIndex = sessions.findIndex(s => s.id === whatsapp.id);
        if (sessionIndex === -1) {
          sessions.push(client);
        }

        client.sendPresenceAvailable();
        await SyncUnreadMessages(client, tenantId);
        resolve(client);
      });

      client.checkMessages = setInterval(
        checkMessages,
        +(process.env.CHECK_INTERVAL || 5000),
        client,
        tenantId
      );

    } catch (err) {
      logger.error(`Error initializing whatsapp: ${err}`);
    }
  });
};

export const getWbot = (whatsappId: string): Client => {
  const sessionIndex = sessions.findIndex(s => s.id === whatsappId);
  
  if (sessionIndex === -1) {
    throw new AppError('ERR_WAPP_NOT_INITIALIZED');
  }

  return sessions[sessionIndex];
}; 