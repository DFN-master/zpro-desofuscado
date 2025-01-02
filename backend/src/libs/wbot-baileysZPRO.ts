import fs from 'fs/promises';
import path from 'path';
import * as Sentry from "@sentry/node";
import makeWASocket, { 
  useMultiFileAuthState,
  isJidGroup,
  isJidBroadcast,
  makeInMemoryStore,
  DisconnectReason,
  WASocket,
  proto,
  BaileysEventMap
} from '@whiskeysockets/baileys';
import { WhatsappZPRO } from '../models/WhatsappZPRO';
import { logger } from './loggerZPRO';
import NodeCache from 'node-cache';
import { getIO } from './socketZPRO';
import { StartWhatsAppSession } from '../services/WhatsappService/StartWhatsAppSessionZPRO';
import { DeleteBaileysService } from '../services/BaileysService/DeleteBaileysServiceZPRO';
import { useMultiRedisPostgresAuthState } from '../helpers/useMultiRedisPostgresAuthStateZPRO';
import { SocksProxyAgent } from 'socks-proxy-agent';
import { isValidMsg } from '../services/WbotServices/wbotMessageListener';
import { ImportWhatsAppMessage } from '../services/WbotServices/ImportWhatsAppMessageServiceZPRO';
import { useVoiceCalls } from './voice-calls-baileys';

interface Session extends WASocket {
  id: string;
}

interface WhatsAppSettings {
  id: string;
  name: string;
  tenantId: number;
  status?: string;
  wppUser?: string;
  proxyUrl?: string;
  proxyUser?: string;
  proxyPass?: string;
}

interface MessageCache {
  [key: string]: {
    messages: proto.IWebMessageInfo[];
    lastUpdate: number;
  }
}

interface MessageCounter {
  [key: string]: number;
}

// Cache configurations
const msgCache = new NodeCache({
  stdTTL: 120,
  checkperiod: 1000,
  maxKeys: 300,
  useClones: false
});

const sessions: Session[] = [];
const retriesQrCodeMap = new Map<string, number>();
const messageCache: MessageCache = {};
const messageCounter: MessageCounter = {};
const checkMessagesInterval = 5000; // 5 segundos

// Adicionar interface para chamadas VoIP
interface VoIPCall {
  id: string;
  from: string;
  to: string;
  status: string;
  timestamp: number;
}

export const getWbotBaileys = async (whatsappId: string): Promise<Session | null> => {
  try {
    const sessionIndex = sessions.findIndex(s => s.id === whatsappId);
    if (sessionIndex !== -1) {
      return sessions[sessionIndex];
    }
    return null;
  } catch (err) {
    logger.error(err);
    return null;
  }
};

export const removeWbot = async (
  whatsappId: string, 
  shouldClose: boolean = true
): Promise<void> => {
  try {
    const sessionIndex = sessions.findIndex(s => s.id === whatsappId);
    if (sessionIndex !== -1) {
      if (shouldClose) {
        sessions[sessionIndex].ev.removeAllListeners();
        sessions[sessionIndex].ws.close();
      }
      sessions.splice(sessionIndex, 1);
    }
  } catch (err) {
    logger.error(err);
  }
};

export const initWASocket = async (whatsappSettings: WhatsAppSettings): Promise<Session> => {
  return new Promise(async (resolve, reject) => {
    try {
      const io = getIO();
      const { 
        id: whatsappId,
        name,
        tenantId,
        wppUser
      } = whatsappSettings;

      let retriesQrCode = 0;
      let qrCodeGenerated = false;
      let pairingCode = '';
      let needsUpdate = false;

      // Configurar proxy se necessário
      let socksAgent;
      if (whatsappSettings.proxyUrl) {
        logger.info("Configurando proxy");
        const proxyHost = whatsappSettings.proxyUrl.split(':')[1].replace('//', '');
        const proxyPort = whatsappSettings.proxyUrl.split(':')[2];
        const proxyUrl = `socks://${whatsappSettings.proxyUser}:${whatsappSettings.proxyPass}@${proxyHost}:${proxyPort}`;
        socksAgent = new SocksProxyAgent(proxyUrl);
      }

      // Configurar autenticação
      const { state, saveCreds } = await useMultiRedisPostgresAuthState(whatsappSettings);

      // Criar socket do WhatsApp
      const sock = makeWASocket({
        version: [2, 2424, 6],
        logger,
        printQRInTerminal: false,
        auth: {
          creds: state.creds,
          keys: useMultiFileAuthState(state.keys, logger).state.keys
        },
        agent: socksAgent,
        browser: ["Chrome", "Windows", "10"],
        defaultQueryTimeoutMs: 20000,
        msgRetryCounterCache: msgCache,
        generateHighQualityLinkPreview: false,
        markOnlineOnConnect: false,
        emitOwnEvents: false,
        syncFullHistory: true,
        fireInitQueries: true,
        shouldIgnoreJid: jid => {
          if (typeof jid !== 'string') {
            logger.info("jid is not a string: " + jid);
            return false;
          }
          return isJidGroup(jid) || isJidBroadcast(jid);
        }
      });

      sock.ev.on('connection.update', async ({ 
        connection,
        lastDisconnect,
        qr,
        receivedPendingNotifications
      }) => {
        logger.info(`${name} Connection Update ${connection}`);

        if (connection === 'close') {
          const shouldReconnect = (lastDisconnect?.error as any)?.output?.statusCode !== DisconnectReason.loggedOut;
          
          if (shouldReconnect) {
            await removeWbot(whatsappId, false);
            setTimeout(() => StartWhatsAppSession(whatsappSettings), 2000);
          } else {
            await whatsappSettings.update({ status: 'DISCONNECTED', qrcode: '' });
            await DeleteBaileysService(whatsappId);
            io.emit(`${tenantId}:whatsappSession`, {
              action: 'update',
              session: whatsappSettings
            });
            await removeWbot(whatsappId, false);
          }
        }

        if (connection === 'open') {
          if (receivedPendingNotifications) {
            try {
              sock.ev.flush();
            } catch (error) {
              logger.error(error);
            }
          }

          await whatsappSettings.update({
            status: 'CONNECTED',
            qrcode: '',
            retries: 0,
            number: sock?.user?.id?.split('@')[0] || '',
            phone: sock?.user || {}
          });

          io.emit(`${tenantId}:whatsappSession`, {
            action: 'update',
            session: whatsappSettings
          });

          const sessionIndex = sessions.findIndex(s => s.id === whatsappId);
          if (sessionIndex === -1) {
            sock.id = whatsappId;
            sessions.push(sock as Session);
          }

          // Importar mensagens antigas se necessário
          setTimeout(async () => {
            const whatsapp = await WhatsappZPRO.findByPk(whatsappId);
            if (whatsapp?.importOldMessages) {
              await ImportWhatsAppMessage(whatsapp);
            }
          }, 2000);
        }

        if (qr !== undefined) {
          if (retriesQrCodeMap.get(whatsappId) && retriesQrCodeMap.get(whatsappId) >= 5) {
            await removeWbot(whatsappId);
            await whatsappSettings.update({ status: 'DISCONNECTED', qrcode: '' });
            await DeleteBaileysService(whatsappId);
            io.emit(`${tenantId}:whatsappSession`, {
              action: 'update',
              session: whatsappSettings
            });
          } else {
            logger.info(`${name} - Novo QR Code gerado`);
            
            if (wppUser && !qrCodeGenerated) {
              pairingCode = await sock.requestPairingCode(wppUser);
              qrCodeGenerated = true;
            }

            retriesQrCodeMap.set(whatsappId, (retriesQrCode += 1));
            
            await whatsappSettings.update({ 
              qrcode: qr,
              status: 'qrcode',
              retries: 0,
              number: '',
              phone: pairingCode
            });

            const sessionIndex = sessions.findIndex(s => s.id === whatsappId);
            if (sessionIndex === -1) {
              sock.id = whatsappId;
              sessions.push(sock as Session);
            }

            io.emit(`${tenantId}:whatsappSession`, {
              action: 'update',
              session: whatsappSettings
            });
          }
        }
      });

      sock.ev.on('creds.update', saveCreds);

      // Adicionar listeners de mensagens
      sock.ev.on('messages.upsert', async ({ messages, type }) => {
        const tenantId = whatsappSettings.tenantId;
        
        if (type === 'notify') {
          for (const message of messages) {
            if (!isValidMsg(message)) continue;
            
            const isGroup = message.key.remoteJid?.endsWith('@g.us');
            
            // Verificar configurações de grupo se necessário
            if (isGroup && whatsappSettings.ignoreGroups) {
              continue;
            }

            try {
              // Processar mensagem
              await processMessage(message, sock as Session, tenantId);
            } catch (err) {
              logger.error(`Error processing message: ${err}`);
              Sentry.captureException(err);
            }
          }
        }
      });

      // Adicionar listener de chamadas
      sock.ev.on('call', async (calls) => {
        for (const call of calls) {
          if (call.status === "offer") {
            const callerId = call.from;
            
            // Verificar configurações de chamada
            if (whatsappSettings.rejectCalls) {
              await sock.rejectCall(call.id, call.from);
            }

            // Emitir evento de chamada
            io.emit(`${tenantId}:call`, {
              action: 'receiveCall',
              call: {
                id: call.id,
                from: callerId,
                timestamp: Date.now()
              }
            });
          }
        }
      });

      // Adicionar listener de participantes de grupo
      sock.ev.on('group-participants.update', async ({ id, participants, action }) => {
        try {
          const groupData = await sock.groupMetadata(id);
          
          io.emit(`${tenantId}:group-participants`, {
            groupId: id,
            participants,
            action,
            groupName: groupData.subject
          });
          
        } catch (err) {
          logger.error(`Error processing group participants update: ${err}`);
        }
      });

      // Adicionar verificação periódica de mensagens
      const checkMessages = async (sock: Session, tenantId: number) => {
        try {
          const whatsapp = await WhatsappZPRO.findByPk(whatsappId);
          
          if (!whatsapp) return;

          const now = Date.now();
          const lastCheck = messageCache[whatsappId]?.lastUpdate || 0;
          
          if (now - lastCheck > checkMessagesInterval) {
            // Atualizar cache de mensagens
            const messages = await sock.loadMessages(whatsapp.id, 50);
            
            messageCache[whatsappId] = {
              messages: messages,
              lastUpdate: now
            };

            // Processar mensagens não lidas
            for (const msg of messages) {
              if (!messageCounter[msg.key.id!]) {
                await processMessage(msg, sock, tenantId);
                messageCounter[msg.key.id!] = 1;
              }
            }
          }
        } catch (err) {
          logger.error(`Error checking messages: ${err}`);
        }
      };

      // Iniciar verificação periódica
      if (sock) {
        sock.messageCheckInterval = setInterval(
          () => checkMessages(sock as Session, tenantId),
          checkMessagesInterval
        );
      }

      // Adicionar listener de chamadas VoIP
      sock.ev.on('call', async ([call]) => {
        if (call.status === "offer") {
          try {
            const callData: VoIPCall = {
              id: call.id,
              from: call.from,
              to: call.to,
              status: call.status,
              timestamp: Date.now()
            };

            // Usar o módulo de chamadas VoIP
            const wavoipToken = process.env.WAVOIP_TOKEN;
            if (wavoipToken) {
              logger.info(`Iniciando chamada VoIP: ${call.id}`);
              
              // Iniciar chamada VoIP
              await useVoiceCalls(
                call.from,
                sock as Session, 
                wavoipToken,
                false // autoAccept
              );

              // Emitir evento de chamada VoIP
              io.emit(`${tenantId}:wavoip`, {
                action: 'call',
                data: callData
              });

              // Aguardar um pouco antes de processar próxima chamada
              await new Promise(resolve => setTimeout(resolve, 1000));
            }

            // Verificar configurações de rejeição automática
            if (whatsappSettings.rejectCalls) {
              await sock.rejectCall(call.id, call.from);
              logger.info(`Chamada rejeitada automaticamente: ${call.id}`);
            }

          } catch (err) {
            logger.error(`Erro ao processar chamada VoIP: ${err}`);
            Sentry.captureException(err);
          }
        }
      });

      // Adicionar listener de status de chamada
      sock.ev.on('call.update', async (callUpdate) => {
        try {
          const { id, status, from } = callUpdate;
          
          logger.info(`Atualização de status de chamada: ${id} - ${status}`);

          // Emitir atualização de status
          io.emit(`${tenantId}:callStatus`, {
            action: 'update',
            call: {
              id,
              status,
              from,
              timestamp: Date.now()
            }
          });

          // Se a chamada foi finalizada, limpar recursos
          if (status === 'terminated') {
            await useVoiceCalls(from, sock as Session, '', true);
          }

        } catch (err) {
          logger.error(`Erro ao atualizar status da chamada: ${err}`);
          Sentry.captureException(err);
        }
      });

      resolve(sock as Session);

    } catch (error) {
      Sentry.captureException(error);
      console.error(error);
      reject(error);
    }
  });
};

export async function countFilesWithPrefix(
  directory: string,
  prefix: string
): Promise<number> {
  try {
    const files = await fs.readdir(directory);
    const matchingFiles = files.filter(file => file.startsWith(prefix));
    return matchingFiles.length;
  } catch (err) {
    throw err;
  }
}

export async function verificarEExcluirArquivos(
  directory: string,
  dias: number = 3
): Promise<void> {
  const currentDate = new Date();
  const limitDate = new Date(
    currentDate.getTime() - dias * 24 * 60 * 60 * 1000
  );

  const files = await fs.readdir(directory);

  files.forEach(async fileName => {
    if (fileName.startsWith('auth_info_') || fileName.startsWith('session-')) {
      const filePath = path.join(directory, fileName);
      const stats = await fs.stat(filePath);

      if (stats.mtime < limitDate) {
        logger.info(`Arquivo antigo encontrado e será excluído: ${filePath}`);
        await fs.unlink(filePath);
      }
    }
  });
} 

// Função auxiliar para processar mensagens
async function processMessage(
  message: proto.IWebMessageInfo,
  sock: Session,
  tenantId: number
) {
  try {
    // Verificar se é uma mensagem válida
    if (!message.key.id || !message.key.remoteJid) return;

    // Emitir evento de mensagem
    const io = getIO();
    io.emit(`${tenantId}:message`, {
      action: 'message',
      message: message,
      timestamp: Date.now()
    });

    // Salvar mensagem no banco de dados
    await ImportWhatsAppMessage({
      message,
      tenantId,
      whatsappId: sock.id
    });

  } catch (err) {
    logger.error(`Error processing message: ${err}`);
    Sentry.captureException(err);
  }
} 