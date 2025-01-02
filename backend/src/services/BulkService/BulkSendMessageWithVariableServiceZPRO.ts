import path from 'path';
import fs from 'fs';
import * as Sentry from '@sentry/node';
import axios from 'axios';
import mime from 'mime-types';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegPath from 'ffmpeg-static';
import tmp from 'tmp';
import { MessageMedia } from 'whatsapp-web.js';

import AppError from '../../errors/AppErrorZPRO';
import { logger } from '../../utils/loggerZPRO';
import { getWbot } from '../WbotServices/wbotZPRO';
import { getWbotBaileys } from '../WbotServices/wbot-baileysZPRO';
import ListWhatsAppsService from '../WhatsappService/ListWhatsAppsServiceZPRO';
import CheckIsValidContactBulk from '../ContactServices/CheckIsValidContactBulkZPRO';
import CheckIsValidBaileysContact from '../ContactServices/CheckIsValidBaileysContactZPRO';
import socketEmit from '../helpers/socketEmitZPRO';
import Message from '../../models/MessageZPRO';
import Ticket from '../../models/TicketZPRO';
import Whatsapp from '../../models/WhatsappZPRO';
import CreateOrUpdateContactService from '../ContactServices/CreateOrUpdateContactServiceZPRO';
import FindOrCreateTicketService from '../TicketServices/FindOrCreateTicketServiceZPRO';
import { SendTextMessageService } from '../MessageServices/SendTextMessageServiceZPRO';
import { SendMediaMessageService } from '../MessageServices/SendMediaMessageServiceZPRO';

interface MessageData {
  whatsappId: number;
  whatsappType: string;
  number: string;
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
}

interface Request {
  data: MessageData;
  tenantId: number;
  file?: Express.Multer.File;
}

interface MessageOptions {
  video?: Buffer;
  audio?: Buffer;
  document?: Buffer;
  image?: Buffer;
  caption?: string;
  fileName?: string;
  mimetype?: string;
  ptt?: boolean;
}

ffmpeg.setFfmpegPath(ffmpegPath);

const downloadMediaAsTmpFile = async (url: string): Promise<{filePath: string; mimeType: string}> => {
  try {
    const response = await axios.get(url, { responseType: 'arraybuffer' });
    const mimeType = response.headers['content-type'];
    
    const tmpFile = tmp.fileSync();
    fs.writeFileSync(tmpFile.name, Buffer.from(response.data));

    return {
      filePath: tmpFile.name,
      mimeType
    };
  } catch (err) {
    logger.error(`Error downloading media: ${err}`);
    throw new Error('Failed to download media file');
  }
};

const convertAudioToOgg = async (inputPath: string, tenantId: number): Promise<string> => {
  return new Promise((resolve, reject) => {
    try {
      const chunks: any[] = [];
      const outputFileName = new Date().getTime() + '.ogg';
      const outputPath = path.join('public', tenantId.toString(), outputFileName);

      ffmpeg(inputPath)
        .toFormat('ogg')
        .audioCodec('libopus')
        .audioChannels(1)
        .addOutputOptions('-avoid_negative_ts make_zero')
        .on('end', async () => {
          fs.writeFileSync(outputPath, Buffer.concat(chunks));
          resolve(outputPath);
        })
        .on('error', error => {
          reject(error);
        })
        .pipe()
        .on('data', chunk => {
          chunks.push(chunk);
        })
        .on('error', error => {
          reject(error);
        });
    } catch (error) {
      reject(error);
    }
  });
};

const getMessageOptionsWithCaption = async (
  fileName: string,
  filePath: string,
  quotedMsg: any,
  caption: string,
  tenantId: number
): Promise<MessageOptions | null> => {
  const mimeType = mime.lookup(filePath);
  const messageCaption = (quotedMsg?.body ?? caption) || caption;

  if (!mimeType) {
    throw new Error('Invalid mimetype');
  }

  const fileType = mimeType.split('/')[0];

  try {
    let messageOptions: MessageOptions;

    if (fileType === 'video') {
      messageOptions = {
        video: fs.readFileSync(filePath),
        caption: messageCaption || undefined,
        fileName
      };
    } else if (fileType === 'audio') {
      const audioPath = await convertAudioToOgg(filePath, tenantId);
      messageOptions = {
        audio: fs.readFileSync(audioPath),
        mimetype: 'audio/ogg',
        ptt: true
      };
    } else if (fileType === 'document' || fileType === 'application') {
      messageOptions = {
        document: fs.readFileSync(filePath),
        caption: messageCaption || undefined,
        fileName,
        mimetype: mimeType
      };
    } else {
      messageOptions = {
        image: fs.readFileSync(filePath),
        caption: messageCaption || undefined
      };
    }

    return messageOptions;
  } catch (err) {
    Sentry.captureException(err);
    logger.error(err);
    return null;
  }
};

const getMessageOptionsWithMime = async (
  fileName: string,
  filePath: string,
  quotedMsg: any,
  caption: string,
  mimeType: string,
  tenantId: string
): Promise<MessageOptions | null> => {
  const messageCaption = (quotedMsg?.body ?? caption) || caption;
  const fileType = mimeType.split('/')[0];

  try {
    let messageOptions: MessageOptions;

    if (fileType === 'video') {
      messageOptions = {
        video: fs.readFileSync(filePath),
        caption: messageCaption || undefined,
        fileName
      };
    } else if (fileType === 'audio') {
      const audioPath = await convertAudioToOgg(filePath, parseInt(tenantId));
      messageOptions = {
        audio: fs.readFileSync(audioPath),
        mimetype: 'audio/ogg',
        ptt: true
      };
    } else if (fileType === 'document' || fileType === 'application') {
      messageOptions = {
        document: fs.readFileSync(filePath),
        caption: messageCaption || undefined,
        fileName,
        mimetype: mimeType
      };
    } else {
      messageOptions = {
        image: fs.readFileSync(filePath),
        caption: messageCaption || undefined
      };
    }

    return messageOptions;
  } catch (err) {
    Sentry.captureException(err);
    logger.error(err);
    return null;
  }
};

// Função para atualizar o status do ticket e emitir evento via socket
const updateTicketStatus = async (ticket: any, status: string, tenantId: number) => {
  await ticket.update({ status });
  
  socketEmit({
    tenantId,
    type: 'ticket:update',
    payload: ticket,
  });
};

// Função para criar mensagem no banco de dados
const createMessage = async (messageData: {
  ticketId: number;
  body: string;
  contactId: number;
  fromMe: boolean;
  read: boolean;
  mediaType?: string;
  mediaUrl?: string;
  status?: string;
  tenantId: number;
}) => {
  const message = await Message.create({
    ...messageData,
    createdAt: new Date(),
    updatedAt: new Date()
  });

  return message;
};

// Função para processar mensagem após envio
const afterSendMessage = async (
  message: string | undefined,
  ticket: any,
  tenantId: number,
  mediaInfo?: {
    type: string;
    url: string;
  }
) => {
  // Criar registro da mensagem
  if (message || mediaInfo) {
    await createMessage({
      ticketId: ticket.id,
      body: message || '',
      contactId: ticket.contact.id,
      fromMe: true,
      read: true,
      mediaType: mediaInfo?.type,
      mediaUrl: mediaInfo?.url,
      status: 'sended',
      tenantId
    });
  }

  // Atualizar status do ticket
  await updateTicketStatus(ticket, 'closed', tenantId);
};

// Função para validar mídia antes do envio
const validateMedia = async (
  mediaUrl: string | undefined,
  mediaType: string
): Promise<void> => {
  if (!mediaUrl) {
    throw new AppError('ERR_MEDIA_URL_NOT_FOUND', 404);
  }

  try {
    const response = await axios.head(mediaUrl);
    const contentType = response.headers['content-type'];
    
    if (!contentType?.startsWith(mediaType)) {
      throw new AppError('ERR_INVALID_MEDIA_TYPE', 400);
    }
  } catch (err) {
    throw new AppError('ERR_MEDIA_VALIDATION_FAILED', 400);
  }
};

const bulkSendMessageWithVariableService = async (request: Request): Promise<void> => {
  const {
    whatsappId,
    whatsappType,
    number,
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
    max
  } = request.data;

  const { tenantId } = request;
  const file = request.file;

  const whatsapps = await ListWhatsAppsService(tenantId);
  const whatsapp = whatsapps.find(w => w.id === parseInt(whatsappId.toString()));

  if (!whatsapp) {
    throw new AppError("ERR_WAPP_NOT_FOUND", 404);
  }

  let filePath: string | undefined;
  let mimeType: string | undefined;

  // Download media if URL provided
  if (mediaUrl && (whatsappType === 'baileys' || whatsappType === 'meow')) {
    try {
      const downloadResult = await downloadMediaAsTmpFile(mediaUrl);
      filePath = downloadResult.filePath;
      mimeType = downloadResult.mimeType;
    } catch (err) {
      throw new AppError(`Error downloading media from URL: ${err.message}`);
    }
  }

  // Handle voice URL similarly
  if (voiceUrl && (whatsappType === 'baileys' || whatsappType === 'meow')) {
    try {
      const downloadResult = await downloadMediaAsTmpFile(voiceUrl);
      filePath = downloadResult.filePath;
      mimeType = downloadResult.mimeType;
    } catch (err) {
      throw new AppError(`Error downloading voice from URL: ${err.message}`);
    }
  }

  // Web.js Implementation
  if (whatsappType === 'web') {
    const wbot = getWbot(parseInt(whatsappId));

    // Handle individual messages
    if (!groups && typeof groups === 'boolean') {
      try {
        const delay = Math.floor(Math.random() * (parseInt(max) - parseInt(min) + 1) + min);
        
        let validContact;
        try {
          validContact = await CheckIsValidContactBulk(number, tenantId);
        } catch (err) {
          // Handle contact validation error
        }

        if (message) {
          await wbot.sendMessage(validContact.numberId, message);
        }

        if (media) {
          await validateMedia(mediaUrl, 'image');
          const mediaMessage = await MessageMedia.fromUrl(mediaUrl!);
          await wbot.sendMessage(validContact.numberId, mediaMessage, {
            caption: mediaDescription
          });
          
          await afterSendMessage(
            mediaDescription,
            ticket,
            tenantId,
            { type: 'image', url: mediaUrl! }
          );
        }

        if (voice) {
          const voiceMessage = await MessageMedia.fromUrl(voiceUrl!);
          await wbot.sendMessage(validContact.numberId, voiceMessage, {
            sendAudioAsVoice: true
          });
        }

        await new Promise(resolve => setTimeout(resolve, delay));

      } catch (err) {
        logger.error(`Error sending message: ${err}`);
      }
    }
    // Handle group messages
    else if (groups === true) {
      try {
        const delay = Math.floor(Math.random() * (parseInt(max) - parseInt(min) + 1) + min);

        if (message) {
          await wbot.sendMessage(`${number}@g.us`, message);
        }

        if (media) {
          await validateMedia(mediaUrl, 'image');
          const mediaMessage = await MessageMedia.fromUrl(mediaUrl!);
          await wbot.sendMessage(`${number}@g.us`, mediaMessage, {
            caption: mediaDescription
          });
          
          await afterSendMessage(
            mediaDescription,
            ticket,
            tenantId,
            { type: 'image', url: mediaUrl! }
          );
        }

        if (voice) {
          const voiceMessage = await MessageMedia.fromUrl(voiceUrl!);
          await wbot.sendMessage(`${number}@g.us`, voiceMessage, {
            sendAudioAsVoice: true
          });
        }

        if (mediaLocal === true) {
          const mediaPath = path.join(__dirname, '..', '..', '..', 'public', tenantId.toString());
          const localPath = path.join(mediaPath, file!.filename);
          const options = await getMessageOptionsWithCaption(
            file!.filename,
            localPath,
            mediaLocalDescription,
            mediaLocalDescription,
            tenantId
          );

          try {
            await wbot.sendMessage(`${number}@g.us`, options);
            logger.info('newMedia >>>>>>');
          } catch (err) {
            logger.info(`Error sending media: ${err}`);
          }
        }

        if (voiceLocal === true) {
          const mediaPath = path.join(__dirname, '..', '..', '..', 'public', tenantId.toString());
          const localPath = path.join(mediaPath, file!.filename);
          const options = await getMessageOptionsWithCaption(
            file!.filename,
            localPath,
            mediaDescription,
            mediaDescription,
            tenantId
          );

          try {
            await wbot.sendMessage(`${number}@g.us`, options);
            logger.info('newMedia >>>>>>');
          } catch (err) {
            logger.info(`Error sending media: ${err}`);
          }
        }

        await new Promise(resolve => setTimeout(resolve, delay));

      } catch (err) {
        logger.error(`Error sending group message: ${err}`);
      }
    }
  }

  // Baileys Implementation
  if (whatsappType === 'baileys') {
    const wbot = await getWbotBaileys(parseInt(whatsappId));
    
    // Handle individual messages
    if (!groups && typeof groups === 'boolean') {
      try {
        const delay = Math.floor(Math.random() * (parseInt(max) - parseInt(min) + 1) + min);
        
        let validContact;
        try {
          validContact = await CheckIsValidBaileysContact(number, tenantId);
        } catch (err) {
          // Handle contact validation error
        }

        if (message) {
          await wbot.sendMessage(validContact, {
            text: message
          });
        }

        if (media) {
          const fileName = mediaUrl!.split('/').pop()!;
          const options = await getMessageOptionsWithMime(
            fileName,
            filePath!,
            mediaDescription,
            mediaDescription,
            mimeType!,
            tenantId.toString()
          );
          
          try {
            await wbot.sendMessage(validContact, {...options});
            logger.info('newMedia >>>>>>');
          } catch (err) {
            logger.info(`Error sending media: ${err}`);
          }
        }

        // Similar implementation for voice messages...

        await new Promise(resolve => setTimeout(resolve, delay));

      } catch (err) {
        logger.error(`Error sending message: ${err}`);
      }
    }
    // Handle group messages
    else if (groups === true) {
      try {
        const delay = Math.floor(Math.random() * (parseInt(max) - parseInt(min) + 1) + min);

        if (message) {
          await wbot.sendMessage(`${number}@g.us`, {
            text: message
          });
        }

        if (media) {
          const fileName = mediaUrl!.split('/').pop()!;
          const options = await getMessageOptionsWithMime(
            fileName,
            filePath!,
            mediaDescription,
            mediaDescription,
            mimeType!,
            tenantId.toString()
          );
          
          try {
            await wbot.sendMessage(`${number}@g.us`, {...options});
            logger.info('newMedia >>>>>>');
          } catch (err) {
            logger.info(`Error sending media: ${err}`);
          }
        }

        if (voice) {
          const fileName = voiceUrl!.split('/').pop()!;
          const options = await getMessageOptionsWithMime(
            fileName,
            filePath!,
            mediaDescription,
            mediaDescription,
            mimeType!,
            tenantId.toString()
          );
          
          try {
            await wbot.sendMessage(`${number}@g.us`, {...options});
            logger.info('newMedia >>>>>>');
          } catch (err) {
            logger.info(`Error sending voice: ${err}`);
          }
        }

        if (mediaLocal === true) {
          const mediaPath = path.join(__dirname, '..', '..', '..', 'public', tenantId.toString());
          const localPath = path.join(mediaPath, file!.filename);
          const options = await getMessageOptionsWithCaption(
            file!.filename,
            localPath,
            mediaLocalDescription,
            mediaLocalDescription,
            tenantId
          );

          try {
            await wbot.sendMessage(`${number}@g.us`, {...options});
            logger.info('newMedia >>>>>>');
          } catch (err) {
            logger.info(`Error sending local media: ${err}`);
          }
        }

        if (voiceLocal === true) {
          const mediaPath = path.join(__dirname, '..', '..', '..', 'public', tenantId.toString());
          const localPath = path.join(mediaPath, file!.filename);
          const options = await getMessageOptionsWithCaption(
            file!.filename,
            localPath,
            mediaDescription,
            mediaDescription,
            tenantId
          );

          try {
            await wbot.sendMessage(`${number}@g.us`, {...options});
            logger.info('newMedia >>>>>>');
          } catch (err) {
            logger.info(`Error sending local voice: ${err}`);
          }
        }

        await new Promise(resolve => setTimeout(resolve, delay));

      } catch (err) {
        logger.error(`Error sending group message: ${err}`);
      }
    }
  }

  // Meow Implementation
  if (whatsappType === 'meow') {
    const whatsappModel = await Whatsapp.findOne({
      where: { id: whatsappId }
    });

    // Handle individual messages
    if (!groups && typeof groups === 'boolean') {
      const contactData = {
        name: number.replace(/\D/g, ''),
        number: number.replace(/\D/g, ''),
        profilePicUrl: undefined,
        isGroup: false,
        isUser: !number.includes('@g.us'),
        isWAContact: false,
        tenantId,
        pushname: number
      };

      if (contactData.isUser) {
        contactData.pushname = number.replace('@g.us', '');
      }

      const contact = await CreateOrUpdateContactService(contactData);
      
      const ticketData = {
        contact,
        whatsappId,
        unreadMessages: 0,
        tenantId,
        groupContact: undefined,
        status: 'closed'
      };

      const ticket = await FindOrCreateTicketService(ticketData);

      try {
        const delay = Math.floor(Math.random() * (parseInt(max) - parseInt(min) + 1) + min);

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
          await validateMedia(mediaUrl, 'image');
          await SendMediaMessageService(
            mediaUrl!,
            request.data.message,
            request.data.message,
            ticket.id,
            ticket.contact,
            whatsappModel,
            tenantId,
            true
          );
          
          await afterSendMessage(
            mediaDescription,
            ticket,
            tenantId,
            { type: 'image', url: mediaUrl! }
          );
        }

        if (voice) {
          await SendMediaMessageService(
            voiceUrl!,
            request.data.message,
            request.data.message,
            ticket.id,
            ticket.contact,
            whatsappModel,
            tenantId,
            true
          );
        }

        if (mediaLocal === true) {
          const mediaPath = path.join(__dirname, '..', '..', '..', 'public', tenantId.toString());
          const localPath = path.join(mediaPath, file!.filename);
          
          await SendMediaMessageService(
            localPath,
            request.data.message,
            request.data.message,
            ticket.id,
            ticket.contact,
            whatsappModel,
            tenantId,
            false
          );
        }

        if (voiceLocal === true) {
          const mediaPath = path.join(__dirname, '..', '..', '..', 'public', tenantId.toString());
          const localPath = path.join(mediaPath, file!.filename);
          
          await SendMediaMessageService(
            localPath,
            request.data.message,
            request.data.message,
            ticket.id,
            ticket.contact,
            whatsappModel,
            tenantId,
            false
          );
        }

        await new Promise(resolve => setTimeout(resolve, delay));

      } catch (err) {
        logger.error(`Error sending group message: ${err}`);
      }
    }
    // Handle group messages
    else if (groups === true) {
      const contactData = {
        name: number.replace(/\D/g, ''),
        number: number.replace(/\D/g, ''),
        profilePicUrl: undefined,
        isGroup: true,
        isUser: !number.includes('@g.us'),
        isWAContact: false,
        tenantId,
        pushname: number
      };

      if (contactData.isUser) {
        contactData.pushname = number.replace('@g.us', '');
      }

      const contact = await CreateOrUpdateContactService(contactData);
      
      const ticketData = {
        contact,
        whatsappId,
        unreadMessages: 0,
        tenantId,
        groupContact: undefined,
        status: 'closed'
      };

      const ticket = await FindOrCreateTicketService(ticketData);

      try {
        const delay = Math.floor(Math.random() * (parseInt(max) - parseInt(min) + 1) + min);

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
          await validateMedia(mediaUrl, 'image');
          await SendMediaMessageService(
            mediaUrl!,
            request.data.message,
            request.data.message,
            ticket.id,
            ticket.contact,
            whatsappModel,
            tenantId,
            true
          );
          
          await afterSendMessage(
            mediaDescription,
            ticket,
            tenantId,
            { type: 'image', url: mediaUrl! }
          );
        }

        if (voice) {
          await SendMediaMessageService(
            voiceUrl!,
            request.data.message,
            request.data.message,
            ticket.id,
            ticket.contact,
            whatsappModel,
            tenantId,
            true
          );
        }

        if (mediaLocal === true) {
          const mediaPath = path.join(__dirname, '..', '..', '..', 'public', tenantId.toString());
          const localPath = path.join(mediaPath, file!.filename);
          
          await SendMediaMessageService(
            localPath,
            request.data.message,
            request.data.message,
            ticket.id,
            ticket.contact,
            whatsappModel,
            tenantId,
            false
          );
        }

        if (voiceLocal === true) {
          const mediaPath = path.join(__dirname, '..', '..', '..', 'public', tenantId.toString());
          const localPath = path.join(mediaPath, file!.filename);
          
          await SendMediaMessageService(
            localPath,
            request.data.message,
            request.data.message,
            ticket.id,
            ticket.contact,
            whatsappModel,
            tenantId,
            false
          );
        }

        await new Promise(resolve => setTimeout(resolve, delay));

      } catch (err) {
        logger.error(`Error sending group message: ${err}`);
      }
    }
  }
};

export default bulkSendMessageWithVariableService; 