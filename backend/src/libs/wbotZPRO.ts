import { Client, LocalAuth, DefaultOptions, WAState } from 'whatsapp-web.js';
import path from 'path';
import { rm } from 'fs/promises';
import { getIO } from './socketZPRO';
import WhatsappZPRO from '../models/WhatsappZPRO';
import { logger } from '../utils/loggerZPRO';
import SyncUnreadMessages from '../services/WbotServices/SyncUnreadMessagesWbotZPRO';
import AppError from '../errors/AppErrorZPRO';
import QueueZPRO from './QueueZPRO_Dig';

interface Session {
  id: string;
  status: string;
  qrcode: string;
  number?: string;
  phone?: any;
  profilePic?: string;
  retries?: number;
  tenantId: number;
  wppUser?: string;
  wppPass?: string;
  proxyUrl?: string;
  proxyUser?: string;
  proxyPass?: string;
  update: (data: Partial<Session>) => Promise<void>;
}

interface WhatsAppClient extends Client {
  id?: string;
  checkMessages?: NodeJS.Timeout;
  info?: WhatsappInfo;
}

interface WhatsappInfo {
  wid: {
    user: string;
    _serialized: string;
  };
}

const sessions: WhatsAppClient[] = [];

const minimal_args = [
  '--disable-default-apps',
  '--disable-extensions',
  '--disable-component-extensions-with-background-pages',
  '--disable-background-networking',
  '--disable-sync',
  '--disable-translate',
  '--disable-windows10-custom-titlebar',
  '--disable-notifications',
  '--disable-background-timer-throttling',
  '--disable-backgrounding-occluded-windows',
  '--disable-renderer-backgrounding',
  '--disable-popup-blocking',
  '--disable-client-side-phishing-detection',
  '--disable-breakpad',
  '--disable-dev-shm-usage',
  '--disable-ipc-flooding-protection',
  '--disable-prompt-on-repost',
  '--metrics-recording-only',
  '--no-default-browser-check',
  '--no-first-run',
  '--ignore-gpu-blacklist',
  '--use-gl=swiftshader',
  '--use-mock-keychain',
  '--password-store=basic',
  '--autoplay-policy=user-gesture-required',
  '--no-sandbox',
  '--no-zygote',
  '--no-pings',
  '--mute-audio',
  '--no-default-browser-check',
  '--hide-scrollbars',
  '--disable-speech-api',
  '--disable-setuid-sandbox',
  '--ignore-certificate-errors',
  '--ignore-certificate-errors-spki-list'
];

export const apagarPastaSessao = async (sessionId: string): Promise<void> => {
  const dirPath = path.join(__dirname, '..', '..', 'sessions');
  const sessionPath = `${dirPath}/session-whatsapp-${sessionId}`;

  try {
    await rm(sessionPath, { recursive: true, force: true });
  } catch (error) {
    logger.warn(`:: Z-PRO :: Error removing session folder: ${sessionPath}`);
    logger.error(error);
  }
};

export const removeWbot = (sessionId: string): void => {
  try {
    const sessionIndex = sessions.findIndex(s => s.id === sessionId);
    if (sessionIndex !== -1) {
      sessions[sessionIndex].destroy();
      sessions.splice(sessionIndex, 1);
    }
  } catch (err) {
    logger.warn(`:: Z-PRO :: Error removing bot session: ${err}`);
  }
};

export const initWbot = async (whatsapp: Session): Promise<WhatsAppClient> => {
  return new Promise((resolve, reject) => {
    try {
      const io = getIO();
      const { wppUser, tenantId } = whatsapp;
      
      const existingSession = sessions.find(s => s.id === whatsapp.id);
      if (existingSession) {
        return resolve(existingSession);
      }

      const sessionName = `wbot-${whatsapp.id}`;

      let customUserAgent;
      let proxyConfig = false;
      let browserArgs = [
        `--user-agent=${DefaultOptions.userAgent}`,
        ...minimal_args
      ];

      if (whatsapp.proxyUrl) {
        proxyConfig = true;
        browserArgs.push(`--proxy-server=${whatsapp.proxyUrl}`);
      }

      const puppeteerConfig = {
        executablePath: process.env.CHROME_BIN || undefined,
        args: browserArgs
      };

      const authConfig = {
        authStrategy: new LocalAuth({
          clientId: sessionName
        }),
        restartOnAuthFail: true,
        puppeteer: puppeteerConfig
      };

      if (proxyConfig) {
        authConfig['proxyAuthentication'] = {
          username: whatsapp.proxyUser,
          password: whatsapp.proxyPass
        };
      }

      const wbot = new Client(authConfig);
      wbot.id = whatsapp.id;
      wbot.initialize();

      wbot.on('loading_screen', (percent, message) => {
        logger.info(`:: Z-PRO :: Bot Whatsapp ${wppUser} - ID: ${percent}-${message}`);
        io.emit(`${tenantId}:whatsappSession`, {
          action: 'LOADING_SCREEN',
          session: whatsapp,
          percent
        });
      });

      wbot.on('qr', async qr => {
        logger.info(`:: Z-PRO :: Bot Whatsapp QR CODE: ${wppUser} - ID: ${whatsapp.id}`);
        
        const sessionIndex = sessions.findIndex(s => s.id === whatsapp.id);
        if (sessionIndex === -1) {
          wbot.id = whatsapp.id;
          sessions.push(wbot);
        }

        await whatsapp.update({
          qrcode: qr,
          status: 'qrcode',
          retries: 0
        });

        io.emit(`${tenantId}:whatsappSession`, {
          action: 'qrcode',
          session: whatsapp
        });
      });

      wbot.on('ready', async () => {
        logger.info(`:: Z-PRO :: Bot Whatsapp ${wppUser} CONNECTED`);

        const profilePic = await wbot.getProfilePicUrl(wbot.info?.wid._serialized);

        await whatsapp.update({
          status: 'CONNECTED',
          qrcode: '',
          retries: 0,
          number: wbot.info?.wid.user,
          profilePic: profilePic || ''
        });

        io.emit(`${tenantId}:whatsappSession`, {
          action: 'CONNECTED',
          session: whatsapp
        });

        const sessionIndex = sessions.findIndex(s => s.id === whatsapp.id);
        if (sessionIndex === -1) {
          wbot.id = whatsapp.id;
          sessions.push(wbot);
        }

        wbot.sendPresenceAvailable();
        await SyncUnreadMessages(wbot, tenantId);
        resolve(wbot);
      });

      wbot.on('auth_failure', async () => {
        logger.error(`Bot ${wppUser} - Auth Error`);
        
        if (whatsapp.retries === 0) {
          await whatsapp.update({
            retries: 0,
            status: ''
          });
        }

        const retries = whatsapp.retries;
        await whatsapp.update({
          status: 'DISCONNECTED',
          retries: retries + 1
        });

        io.emit(`${tenantId}:whatsappSession`, {
          action: 'DISCONNECTED',
          session: whatsapp
        });
        
        reject(new Error('Auth failure, check the console'));
      });

      wbot.checkMessages = setInterval(
        checkMessages,
        +(process.env.CHECK_INTERVAL || 5000),
        wbot,
        tenantId
      );

    } catch (err) {
      logger.error(`:: Z-PRO :: Error initializing whatsapp: ${err}`);
      reject(err);
    }
  });
};

export const getWbot = (whatsappId: string): WhatsAppClient => {
  const sessionIndex = sessions.findIndex(s => s.id === whatsappId);

  if (sessionIndex === -1) {
    throw new AppError('ERR_WAPP_NOT_INITIALIZED');
  }

  return sessions[sessionIndex];
};

const checkMessages = async (wbot: WhatsAppClient, tenantId: number): Promise<void> => {
  try {
    const state = await wbot.getState();
    
    if (state === WAState.CONNECTED) {
      QueueZPRO.add(`${wbot.id}-SendMessages`, {
        sessionId: wbot.id,
        tenantId,
        options: {
          jobId: `${wbot.id}-SendMessages`,
          removeOnComplete: true,
          removeOnFail: true
        }
      });
    }
  } catch (error) {
    const err = String(error);
    if (err.indexOf("Session closed.") !== -1) {
      logger.warn(`:: Z-PRO :: Bot Whatsapp | Error | Session closed. Tenant: ${tenantId}`);
      clearInterval(wbot.checkMessages);
      removeWbot(wbot.id);
      return;
    }
    logger.error(`:: Z-PRO :: Bot Whatsapp | Error checking messages | Tenant: ${tenantId}::`, error);
  }
}; 