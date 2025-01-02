import path from 'path';
import fs from 'fs';
import mime from 'mime-types';
import * as Sentry from '@sentry/node';
import { MessageMedia } from 'whatsapp-web.js';
import { v4 as uuidv4 } from 'uuid';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegStatic from 'ffmpeg-static';

import { getWbot } from '../WbotService/wbotZPRO';
import { getWbotBaileys } from '../WbotService/wbot-baileysZPRO';
import CheckIsValidContactBulkZPRO from '../../helpers/CheckIsValidContactBulkZPRO';
import CheckIsValidBaileysContactZPRO from '../../helpers/CheckIsValidBaileysContactZPRO';
import logger from '../../utils/loggerZPRO';
import Message from '../../models/Message';
import Contact from '../../models/Contact';
import socketEmitZPRO from '../../helpers/socketEmitZPRO';
import CreateMessageSystemServiceZPRO from '../MessageSystemService/CreateMessageSystemServiceZPRO';
import FindOrCreateTicketServiceZPRO from '../TicketService/FindOrCreateTicketServiceZPRO';
import CreateTicketServiceZPRO from '../TicketService/CreateTicketServiceZPRO';

interface MessageData {
  body: string;
  number: string;
  tenantId: number;
}

interface MediaFile {
  filename: string;
  mediaUrl: string;
}

interface Channel {
  id: number;
  name: string;
}

interface WhatsAppSession {
  id: number;
  sessionId: string;
}

const convertAudioToOgg = async (
  inputPath: string,
  tenantId: string
): Promise<string> => {
  return new Promise((resolve, reject) => {
    try {
      ffmpeg.setFfmpegPath(ffmpegStatic);
      
      const outputPath = path.join(
        __dirname,
        '..',
        '..',
        '..',
        'public',
        tenantId,
        `${new Date().getTime()}.ogg`
      );

      const chunks: any[] = [];

      ffmpeg(inputPath)
        .audioCodec('libopus')
        .toFormat('ogg')
        .addOutputOptions('-avoid_negative_ts make_zero')
        .noVideo()
        .on('end', async () => {
          fs.writeFileSync(outputPath, Buffer.concat(chunks));
          resolve(outputPath);
        })
        .on('error', error => reject(error))
        .pipe()
        .on('data', chunk => chunks.push(chunk))
        .on('error', error => reject(error));

    } catch (error) {
      reject(error);
    }
  });
};

const getMessageOptions = async (
  filename: string,
  filePath: string,
  messageBody: string | null,
  caption: string,
  tenantId: string
) => {
  try {
    const mimeType = mime.lookup(filePath);
    const messageCaption = messageBody?.caption || caption;

    if (!mimeType) {
      throw new Error('Invalid mimetype');
    }

    const mediaType = mimeType.split('/')[0];

    let messageOptions: any = {};

    switch(mediaType) {
      case 'video':
        messageOptions = {
          video: fs.readFileSync(filePath),
          caption: undefined,
          fileName: filename
        };
        break;

      case 'audio': 
        const audioPath = await convertAudioToOgg(filePath, tenantId);
        messageOptions = {
          audio: fs.readFileSync(audioPath),
          mimetype: 'audio/ogg',
          ptt: true
        };
        break;

      case 'document':
      case 'application':
        messageOptions = {
          document: fs.readFileSync(filePath),
          caption: undefined,
          fileName: filename,
          mimetype: mimeType
        };
        break;

      default:
        messageOptions = {
          image: fs.readFileSync(filePath),
          caption: undefined
        };
    }

    return messageOptions;

  } catch (err) {
    Sentry.captureException(err);
    console.log(err);
    return null;
  }
};

const handleBaileysMessage = async (
  cleanNumber: string,
  tenantId: number,
  whatsapp: WhatsAppSession,
  channel: Channel,
  mediaFile: MediaFile,
  mediaPath: string
): Promise<void> => {
  const contact = await Contact.findOne({
    where: {
      number: cleanNumber,
      tenantId
    }
  });

  if (contact) {
    const ticket = await FindOrCreateTicketServiceZPRO({
      contact,
      whatsappId: whatsapp.sessionId,
      unreadMessages: 0,
      tenantId,
      groupContact: undefined,
      channel: "whatsapp-web"
    });

    const messageId = uuidv4();
    
    const messageData = {
      fromMe: true,
      mediaUrl: mediaFile.filename,
      body: mediaFile.filename
    };

    await CreateMessageSystemServiceZPRO({
      messageId,
      sendType: messageData,
      tenantId,
      ticket,
      status: "sended",
      channel: "external-api"
    });

    const message = await Message.findOne({
      where: {
        messageId,
        tenantId
      }
    });

    if (message) {
      const mimeType = mime.lookup(mediaPath);
      if (!mimeType) {
        throw new Error('Invalid mimetype');
      }

      const mediaType = mimeType.split('/')[0];
      
      await message.update({
        mediaType,
        mediaName: mediaFile.filename
      });

      socketEmitZPRO({
        tenantId,
        type: "chat:update",
        payload: message
      });
    }
  }
};

const handleBaileysTextMessage = async (
  cleanNumber: string,
  tenantId: number,
  whatsapp: WhatsAppSession,
  channel: Channel,
  messageData: MessageData
): Promise<void> => {
  const contact = await Contact.findOne({
    where: {
      number: cleanNumber,
      tenantId
    }
  });

  if (contact) {
    const ticket = await FindOrCreateTicketServiceZPRO({
      contact,
      whatsappId: whatsapp.sessionId,
      unreadMessages: 0,
      tenantId,
      groupContact: undefined,
      channel: "whatsapp-web"
    });

    const messageData = {
      body: messageData.body,
      fromMe: true,
      read: true
    };

    await CreateMessageSystemServiceZPRO({
      sendType: messageData,
      tenantId,
      ticket,
      status: "sended",
      channel: "external-api"
    });
  }
};

const createTicketApiService = async (
  messageData: MessageData,
  whatsapp: WhatsAppSession,
  mediaFile: MediaFile | null,
  channel: Channel,
  contact: Contact
): Promise<{ message: string }> => {
  const { tenantId, number } = messageData;
  const cleanNumber = number.replace(/\D/g, '');

  try {
    // Create initial ticket
    await CreateTicketServiceZPRO({
      contactId: contact.id,
      status: 'pending',
      userId: whatsapp.userId,
      tenantId,
      channelId: channel.id,
      channel: channel
    });

    // Handle WhatsApp Web.js
    if (channel?.name === 'whatsapp') {
      const wbot = getWbot(whatsapp.sessionId);
      const validContact = await CheckIsValidContactBulkZPRO(cleanNumber, tenantId);
      
      if (mediaFile) {
        const mediaPath = path.join('public', tenantId, mediaFile.filename);
        await wbot.sendMessage(
          validContact.whatsappId || `${cleanNumber}@c.us`,
          MessageMedia.fromFilePath(mediaPath),
          { caption: messageData.body }
        );
      } else {
        await wbot.sendMessage(
          validContact.whatsappId || `${cleanNumber}@c.us`, 
          messageData.body
        );
      }
    }

    // Handle Baileys
    if (channel?.name === 'whatsapp-web') {
      const wbot = await getWbotBaileys(whatsapp.sessionId);
      const validContact = await CheckIsValidBaileysContactZPRO(cleanNumber, tenantId);

      if (mediaFile) {
        const mediaPath = path.join('public', tenantId, mediaFile.filename);
        const messageOptions = await getMessageOptions(
          mediaFile.filename,
          mediaPath,
          messageData.body,
          messageData.body,
          tenantId.toString()
        );

        await wbot.sendMessage(
          validContact || `${cleanNumber}@s.whatsapp.net`,
          { ...messageOptions }
        );

        try {
          await handleBaileysMessage(
            cleanNumber,
            tenantId,
            whatsapp,
            channel,
            mediaFile,
            mediaPath
          );
        } catch (err) {
          logger.error('ZDG ::: Z-PRO ::: Falha ao criar mensagem da API 1.');
        }

      } else {
        await wbot.sendMessage(
          validContact || `${cleanNumber}@s.whatsapp.net`,
          { text: messageData.body }
        );

        try {
          await handleBaileysTextMessage(
            cleanNumber,
            tenantId,
            whatsapp,
            channel,
            messageData
          );
        } catch (err) {
          logger.error('ZDG ::: Z-PRO ::: Falha ao criar mensagem da API 11.');
        }
      }
    }

    return { message: 'Ticket create successfully' };

  } catch (err) {
    return { 
      message: `Invalid mimetype error: ${JSON.stringify(err)}` 
    };
  }
};

export default createTicketApiService; 