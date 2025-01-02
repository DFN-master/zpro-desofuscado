import { join } from 'path';
import { promises as fs } from 'fs';
import * as Sentry from '@sentry/node';
import axios from 'axios';
import { MessageMedia } from 'whatsapp-web.js';
import { getContentType } from '@whiskeysockets/baileys';
import mime from 'mime-types';
import ffmpeg from 'fluent-ffmpeg';
import tmp from 'tmp';

import AppError from '../../errors/AppErrorZPRO';
import { logger } from '../../utils/loggerZPRO';
import { getWbot } from '../WbotServices/wbotZPRO';
import { getWbotBaileys } from '../WbotServices/wbot-baileysZPRO';
import ListWhatsAppsService from '../WhatsappService/ListWhatsAppsServiceZPRO';
import CheckIsValidContactBulk from '../CheckServices/CheckIsValidContactBulkZPRO';
import CheckIsValidBaileysContact from '../CheckServices/CheckIsValidBaileysContactZPRO';
import socketEmit from '../../helpers/socketEmitZPRO';
import Message from '../../models/MessageZPRO';
import Ticket from '../../models/TicketZPRO';
import CreateMessageService from '../MessageServices/CreateMessageServiceZPRO';
import SendMediaMessageService from '../MessageServices/SendMediaMessageServiceZPRO';
import CreateOrUpdateContactService from '../ContactServices/CreateOrUpdateContactServiceZPRO';
import FindOrCreateTicketService from '../TicketServices/FindOrCreateTicketServiceZPRO';
import SendTextMessageService from '../MessageServices/SendTextMessageServiceZPRO';
import Whatsapp from '../../models/WhatsappZPRO';

interface Request {
  body: {
    whatsappId: string | number;
    whatsappType: string;
    arrayNumbers: string[] | string;
    message?: string;
    groups?: boolean;
    media?: boolean;
    mediaUrl?: string; 
    mediaDescription?: string;
    voice?: boolean;
    voiceUrl?: string;
    mediaLocal?: boolean;
    mediaLocalDescription?: string;
    voiceLocal?: boolean;
    min: number;
    max: number;
    ticketId?: number;
  };
  tenantId: number | string;
  file?: Express.Multer.File;
}

interface MessageData {
  messageId: string;
  ticketId: number;
  contactId?: number;
  body: string;
  fromMe: boolean;
  mediaType?: string;
  read: boolean;
  quotedMsgId: string | null;
  timestamp: number;
  status: string;
}

interface MessageOptions {
  caption?: string;
  sendAudioAsVoice?: boolean;
  media?: any;
}

interface Contact {
  name: string;
  number: string;
  profilePicUrl?: string;
  isGroup: boolean;
  isUser: boolean;
  isWAContact: boolean;
  tenantId: number | string;
  pushname: string;
}

const downloadMediaAsTmpFile = async (url: string): Promise<{
  filePath: string;
  mimeType: string | null;
}> => {
  const response = await axios.get(url, {
    responseType: 'arraybuffer'
  });
  
  const mimeType = response.headers['content-type'];
  const tmpFile = tmp.fileSync();
  await fs.writeFile(tmpFile.name, response.data);

  return {
    filePath: tmpFile.name,
    mimeType
  };
};

const getMessageOptionsWithMime = async (
  filename: string,
  filePath: string,
  caption: string,
  description: string,
  mimeType: string | null,
  tenantId: string
): Promise<MessageOptions> => {
  const media = MessageMedia.fromFilePath(filePath);
  const options: MessageOptions = {
    caption: description || caption,
    sendAudioAsVoice: mimeType?.includes('audio')
  };
  return options;
};

const getMessageOptionsWithCaption = async (
  filename: string,
  filePath: string,
  caption: string,
  description: string,
  tenantId: string
): Promise<MessageOptions> => {
  const media = MessageMedia.fromFilePath(filePath);
  const options: MessageOptions = {
    caption: description || caption,
    sendAudioAsVoice: filename.endsWith('.ogg')
  };
  return options;
};

const getTypeMessage = (msg: any): string => {
  const types = ['video', 'audio', 'document', 'image'];
  const type = types.find(t => msg.hasMedia && msg.type === t);
  return type || 'text';
};

const getTimestampMessage = (msg: any): number => {
  return msg.timestamp || Math.floor(Date.now() / 1000);
};

const convertAudioToOgg = async (inputPath: string, tenantId: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const timestamp = new Date().getTime();
    const outputPath = join(__dirname, '..', '..', '..', 'public', tenantId.toString(), `${timestamp}.ogg`);

    ffmpeg(inputPath)
      .toFormat('ogg')
      .audioCodec('libopus')
      .audioChannels(1)
      .addOutputOptions([
        '-avoid_negative_ts make_zero',
        '-acodec libopus'
      ])
      .on('end', () => {
        resolve(outputPath);
      })
      .on('error', (err) => {
        reject(new Error(`Error converting audio: ${err.message}`));
      })
      .save(outputPath);
  });
};

const processLocalMedia = async (
  file: Express.Multer.File,
  tenantId: string
): Promise<{
  filePath: string;
  mimeType: string;
}> => {
  const { mimetype } = file;
  const newFilename = `${new Date().getTime()}-${file.originalname}`;
  const publicFolder = join(__dirname, '..', '..', '..', 'public', tenantId.toString());
  
  // Criar pasta se não existir
  await fs.mkdir(publicFolder, { recursive: true });
  
  const filePath = join(publicFolder, newFilename);
  await fs.writeFile(filePath, file.buffer);

  // Converter áudio para OGG se necessário
  if (mimetype.startsWith('audio/')) {
    const oggPath = await convertAudioToOgg(filePath, tenantId.toString());
    await fs.unlink(filePath); // Remove arquivo original
    return {
      filePath: oggPath,
      mimeType: 'audio/ogg'
    };
  }

  return {
    filePath,
    mimeType: mimetype
  };
};

const handleGroupMessage = async (
  groupId: string,
  message: string | undefined,
  media: any,
  wbot: any,
  options?: MessageOptions
) => {
  try {
    if (message) {
      await wbot.sendMessage(groupId, message);
    }
    
    if (media) {
      await wbot.sendMessage(groupId, media, options);
    }
  } catch (err) {
    logger.error(`Error sending message to group ${groupId}: ${err}`);
  }
};

const formatNumber = (number: string): string => {
  const cleaned = number.replace(/\D/g, '');
  if (cleaned.length < 10 || cleaned.length > 14) {
    throw new Error('Invalid phone number format');
  }
  return `${cleaned}@c.us`;
};

const createMessageTicket = async (
  messageData: MessageData,
  ticket: any,
  contact: any
): Promise<void> => {
  try {
    const newMessage = await CreateMessageService({
      messageData,
      tenantId: ticket.tenantId
    });

    const messageCreated = await Message.findOne({
      where: { id: newMessage.id },
      include: [
        {
          model: Ticket,
          as: "ticket",
          where: { tenantId: ticket.tenantId },
          include: ["contact"]
        },
        {
          model: Message,
          as: "quotedMsg",
          include: ["contact"]
        }
      ]
    });

    if (messageCreated) {
      await ticket.update({
        lastMessage: messageCreated.body,
        lastMessageAt: new Date().getTime(),
        answered: true
      });
      
      socketEmit({
        tenantId: ticket.tenantId,
        type: "chat:message",
        payload: messageCreated
      });
    }
  } catch (err) {
    logger.error(`Error creating message ticket: ${err}`);
  }
};

const bulkSendMessageService = async (
  request: Request
): Promise<void> => {
  const {
    whatsappId,
    whatsappType,
    arrayNumbers,
    message,
    groups,
    media,
    mediaUrl,
    mediaDescription,
    voice,
    voiceUrl,
    mediaLocal,
    mediaLocalDescription,
    voiceLocal,
    min,
    max,
    ticketId
  } = request.body;

  const { tenantId } = request;
  const file = request.file;

  const whatsapps = await ListWhatsAppsService(tenantId);
  const whatsapp = whatsapps.find(w => w.id === parseInt(whatsappId as string));

  if (!whatsapp) {
    throw new AppError("ERR_WAPP_NOT_FOUND", 404);
  }

  let filePath: string | undefined;
  let mimeType: string | null;

  if (mediaUrl && (whatsappType === 'web' || whatsappType === 'baileys')) {
    try {
      const downloadedMedia = await downloadMediaAsTmpFile(mediaUrl);
      filePath = downloadedMedia.filePath;
      mimeType = downloadedMedia.mimeType;
    } catch (err) {
      throw new AppError(`Error downloading media from URL: ${err.message}`);
    }
  }

  if (voiceUrl && (whatsappType === 'web' || whatsappType === 'baileys')) {
    try {
      const downloadedMedia = await downloadMediaAsTmpFile(voiceUrl);
      filePath = downloadedMedia.filePath;
      mimeType = downloadedMedia.mimeType;
    } catch (err) {
      throw new AppError(`Error downloading media from URL: ${err.message}`);
    }
  }

  // Web WhatsApp handling
  if (whatsappType === 'web') {
    const wbot = getWbot(parseInt(whatsappId as string));

    if (!groups && typeof groups === 'boolean') {
      for (const number of arrayNumbers) {
        try {
          let validNumber;
          try {
            validNumber = await CheckIsValidContactBulk(number, tenantId);
          } catch (err) {
            logger.error(`Error validating number ${number}: ${err}`);
            continue;
          }

          const delay = Math.floor(Math.random() * (max - min + 1) + min);

          if (message) {
            await wbot.sendMessage(validNumber.number, message);
          }

          if (media) {
            const mediaMessage = await MessageMedia.fromUrl(mediaUrl as string);
            await wbot.sendMessage(validNumber.number, mediaMessage, {
              caption: mediaDescription
            });
          }

          if (voice) {
            const voiceMessage = await MessageMedia.fromUrl(voiceUrl as string);
            await wbot.sendMessage(validNumber.number, voiceMessage, {
              sendAudioAsVoice: true
            });
          }

          await new Promise(resolve => setTimeout(resolve, delay));

        } catch (err) {
          logger.error(`Error sending message: ${err}`);
        }
      }
    }
    // Continue with groups handling...
  }

  // Baileys handling  
  if (whatsappType === 'baileys') {
    const wbot = await getWbotBaileys(parseInt(whatsappId as string));

    if (!groups && typeof groups === 'boolean') {
      for (const number of arrayNumbers) {
        try {
          let validNumber;
          try {
            validNumber = await CheckIsValidBaileysContact(number, tenantId);
          } catch (err) {
            logger.error(`Error validating number ${number}: ${err}`);
            continue;
          }

          const delay = Math.floor(Math.random() * (max - min + 1) + min);

          if (message) {
            await wbot.sendMessage(validNumber, { text: message });
          }

          if (media) {
            const filename = mediaUrl?.split('/').pop() as string;
            const options = await getMessageOptionsWithMime(
              filename,
              filePath as string,
              mediaDescription as string,
              mediaDescription as string, 
              mimeType,
              tenantId.toString()
            );

            try {
              await wbot.sendMessage(validNumber, options);
              logger.info('Media message sent successfully');
            } catch (err) {
              logger.error(`Error sending media message: ${err}`);
            }
          }

          if (voice) {
            const filename = voiceUrl?.split('/').pop() as string;
            const options = await getMessageOptionsWithMime(
              filename,
              filePath as string,
              mediaDescription as string,
              mediaDescription as string,
              mimeType,
              tenantId.toString()
            );

            try {
              await wbot.sendMessage(validNumber, options);
              logger.info('Voice message sent successfully');
            } catch (err) {
              logger.error(`Error sending voice message: ${err}`);
            }
          }

          await new Promise(resolve => setTimeout(resolve, delay));

        } catch (err) {
          logger.error(`Error sending message: ${err}`);
        }
      }
    }
    // Continue with groups handling...
  }

  // Default WhatsApp handling
  if (whatsappType === 'default') {
    const whatsappModel = await Whatsapp.findOne({
      where: { id: whatsappId }
    });

    if (!groups && typeof groups === 'boolean') {
      for (const number of arrayNumbers) {
        try {
          const contact = {
            name: number.replace(/\D/g, ''),
            number: number.replace(/\D/g, ''),
            profilePicUrl: undefined,
            isGroup: false,
            isUser: !number.includes('@g.us'),
            isWAContact: false,
            tenantId,
            pushname: number
          };

          if (contact.isUser) {
            contact.number = number.replace('@c.us', '');
          }

          const createdContact = await CreateOrUpdateContactService(contact);

          const ticketData = {
            contact: createdContact,
            whatsappId,
            unreadMessages: 0,
            tenantId,
            groupContact: undefined,
            channel: 'default'
          };

          const ticket = await FindOrCreateTicketService(ticketData);

          const delay = Math.floor(Math.random() * (max - min + 1) + min);

          if (message) {
            await SendTextMessageService(
              message,
              undefined,
              ticket.id,
              ticket.contact,
              whatsappModel
            );
          }

          if (media) {
            await SendMediaMessageService(
              mediaUrl as string,
              undefined,
              'true',
              ticket.id,
              ticket.contact,
              whatsappModel,
              tenantId,
              true
            );
          }

          if (voice) {
            await SendMediaMessageService(
              voiceUrl as string,
              undefined,
              'true',
              ticket.id,
              ticket.contact,
              whatsappModel,
              tenantId,
              true
            );
          }

          await new Promise(resolve => setTimeout(resolve, delay));

        } catch (err) {
          logger.error(`Error sending message: ${err}`);
        }
      }
    }
    // Continue with groups handling...
  }
};

export default bulkSendMessageService; 