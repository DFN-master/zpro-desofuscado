import { Request } from 'express';
import axios from 'axios';
import path from 'path';
import fs from 'fs';
import mime from 'mime-types';
import * as Sentry from '@sentry/node';
import { v4 as uuidv4 } from 'uuid';
import { MessageMedia } from 'whatsapp-web.js';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegStatic from 'ffmpeg-static';

import AppError from '../../errors/AppErrorZPRO';
import { getWbot } from '../wbotZPRO';
import { getWbotBaileys } from '../wbot-baileysZPRO';
import Message from '../../models/MessageZPRO';
import Contact from '../../models/ContactZPRO';
import Ticket from '../../models/TicketZPRO';
import socketEmit from '../../helpers/socketEmitZPRO';
import FindOrCreateTicketService from '../TicketServices/FindOrCreateTicketServiceZPRO';
import CreateMessageSystemService from '../MessageServices/CreateMessageSystemServiceZPRO';
import logger from '../../utils/loggerZPRO';

interface MessageData {
  mediaUrl?: string;
  caption?: string;
  sendType?: string;
}

interface SendGroupMediaUrlRequest {
  tenantId: number | string;
  number: string;
  mediaUrl?: string;
  caption?: string;
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

ffmpeg.setFfmpegPath(ffmpegStatic);

const convertAudioToOgg = async (inputPath: string, tenantId: string | number): Promise<string> => {
  return new Promise((resolve, reject) => {
    try {
      const outputPath = [];
      const timestamp = new Date().getTime();
      const filename = `bulk_${timestamp}.ogg`;
      const outputFile = path.join(__dirname, '..', '..', '..', 'public', tenantId.toString(), filename);

      ffmpeg({ source: inputPath })
        .toFormat('ogg')
        .audioCodec('libopus')
        .audioChannels(1)
        .on('end', async () => {
          fs.writeFileSync(outputFile, Buffer.concat(outputPath));
          resolve(outputFile);
        })
        .on('error', error => {
          reject(error);
        })
        .pipe()
        .on('data', chunk => {
          outputPath.push(chunk);
        })
        .on('error', error => {
          reject(error);
        });
    } catch (error) {
      reject(error);
    }
  });
};

const getMessageOptions = async (
  fileName: string,
  filePath: string,
  caption: string | undefined,
  messageData: MessageData,
  tenantId: string | number
): Promise<MessageOptions | null> => {
  const mimetype = mime.lookup(filePath);
  const messageCaption = caption || messageData?.caption;

  if (!mimetype) {
    throw new Error('Invalid mimetype');
  }

  const type = mimetype.split('/')[0];

  try {
    let messageOptions: MessageOptions;

    switch (type) {
      case 'video':
        messageOptions = {
          video: fs.readFileSync(filePath),
          caption: undefined,
          fileName
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
          fileName,
          mimetype
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
    console.error(err);
    return null;
  }
};

const downloadFileAndGetName = async (url: string, tenantId: string | number): Promise<string | null> => {
  try {
    const response = await axios.get(url, { responseType: 'arraybuffer' });
    const buffer = Buffer.from(response.data);

    const { fileTypeFromBuffer } = await import('file-type');
    const fileType = await fileTypeFromBuffer(buffer);

    if (!fileType) {
      throw new Error('Não foi possível determinar o tipo do arquivo.');
    }

    const ext = fileType.ext;
    const timestamp = Date.now();
    const fileName = `bulk_${timestamp}.${ext}`;
    const filePath = path.join(__dirname, '..', '..', '..', 'public', tenantId.toString(), fileName);

    await fs.promises.writeFile(filePath, buffer);
    await new Promise(resolve => setTimeout(resolve, 1000));
    await fs.promises.access(filePath, fs.constants.F_OK | fs.constants.R_OK);

    logger.info(`:::: Z-PRO :::: Download da imagem concluído. Salvo como: ${fileName}`);
    return fileName;

  } catch (err) {
    logger.error(':::: Z-PRO :::: Erro ao baixar a imagem.', err);
    return null;
  }
};

const sendGroupMediaUrlService = async (
  messageData: SendGroupMediaUrlRequest,
  ticket: Ticket,
  contact: Contact,
  message?: Message
): Promise<{ msg: string }> => {
  const { tenantId, number } = messageData;
  const cleanNumber = number.replace(/\D/g, '');

  try {
    // Envio via whatsapp-web.js
    if (message?.sendType === 'whatsapp') {
      const wbot = getWbot(ticket.whatsappId);

      if (messageData.mediaUrl) {
        try {
          const media = await MessageMedia.fromUrl(messageData.mediaUrl);
          await wbot.sendMessage(`${cleanNumber}@g.us`, media, { caption: messageData.caption });
        } catch (error) {
          throw new AppError('Error sending message via whatsapp-web.js');
        }
      }
    }

    // Envio via baileys
    if (message?.sendType === 'baileys') {
      const wbot = await getWbotBaileys(ticket.whatsappId);

      try {
        await downloadFileAndGetName(messageData.mediaUrl!, tenantId.toString())
          .then(async fileName => {
            if (fileName) {
              const filePath = `public/${tenantId}/${fileName}`;
              const messageOptions = await getMessageOptions(
                fileName,
                filePath,
                messageData.caption,
                messageData,
                tenantId.toString()
              );

              await wbot.sendMessage(
                `${cleanNumber}@g.us`,
                { ...messageOptions }
              );

              try {
                const contact = await Contact.findOne({
                  where: { number: cleanNumber, tenantId }
                });

                if (contact) {
                  const ticket = await FindOrCreateTicketService({
                    contact,
                    whatsappId: ticket.whatsappId,
                    unreadMessages: 0,
                    tenantId,
                    groupContact: undefined,
                    status: 'closed'
                  });

                  const messageRecord = {
                    sendType: true,
                    fromMe: true,
                    mediaUrl: fileName
                  };

                  const messageId = uuidv4();
                  
                  await CreateMessageSystemService({
                    messageId,
                    body: messageRecord,
                    tenantId,
                    ticket,
                    sendType: 'group',
                    status: 'pending'
                  });

                  const dbMessage = await Message.findOne({
                    where: { messageId, tenantId }
                  });

                  if (dbMessage) {
                    const mimetype = mime.lookup(filePath);
                    if (!mimetype) throw new Error('Invalid mimetype');
                    
                    const messageType = mimetype.split('/')[0];
                    await dbMessage.update({ mediaType: messageType, mediaUrl: fileName });
                    
                    socketEmit({
                      tenantId,
                      type: 'chat:update',
                      payload: dbMessage
                    });
                  }
                }
              } catch (err) {
                logger.error('Error creating message record');
              }
            } else {
              logger.error('Error downloading media file');
            }
          });
      } catch (error) {
        // Silently handle error
      }
    }

    return { msg: 'Message sent successfully' };
  } catch (err) {
    return { msg: `Error sending message: ${err}` };
  }
};

export default sendGroupMediaUrlService; 