import { Request } from 'express';
import * as Sentry from '@sentry/node';
import path from 'path';
import fs from 'fs';
import mime from 'mime-types';
import { v4 as uuidv4 } from 'uuid';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegStatic from 'ffmpeg-static';
import { MessageMedia } from 'whatsapp-web.js';
import axios from 'axios';

import { getWbot } from '../../helpers/wbotZPRO';
import { getWbotBaileysZPRO } from '../../helpers/wbot-baileysZPRO';
import CheckIsValidContactBulkZPRO from '../CheckContactServices/CheckIsValidContactBulkZPRO';
import CheckIsValidBaileysContactZPRO from '../CheckContactServices/CheckIsValidBaileysContactZPRO';
import AppErrorZPRO from '../../errors/AppErrorZPRO';
import Contact from '../../models/ContactZPRO';
import Message from '../../models/MessageZPRO';
import FindOrCreateTicketService from '../TicketServices/FindOrCreateTicketServiceZPRO';
import CreateMessageSystemService from '../MessageServices/CreateMessageSystemServiceZPRO';
import socketEmitZPRO from '../../helpers/socketEmitZPRO';
import logger from '../../utils/loggerZPRO';

interface MessageData {
  tenantId: number | string;
  number: string;
  mediaUrl?: string;
  body?: string;
  fromMe?: boolean;
  message?: any;
}

interface MessageResponse {
  status: string;
}

ffmpeg.setFfmpegPath(ffmpegStatic);

const publicFolder = path.resolve(__dirname, '..', '..', '..', 'public');

const convertAudioToOgg = async (inputPath: string, tenantId: string | number): Promise<string> => {
  return new Promise((resolve, reject) => {
    try {
      const chunks: any[] = [];
      const timestamp = new Date().getTime();
      const filename = `${timestamp}.ogg`;
      const outputPath = path.join(publicFolder, String(tenantId), filename);

      ffmpeg({ source: inputPath })
        .toFormat('ogg')
        .noVideo()
        .audioCodec('libopus')
        .audioChannels(1)
        .addOutputOptions('-avoid_negative_ts make_zero')
        .on('end', async () => {
          fs.writeFileSync(outputPath, Buffer.from(chunks));
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

const getMessageOptions = async (
  filename: string,
  filePath: string,
  messageData: MessageData,
  mediaUrl: string,
  tenantId: string | number
): Promise<any> => {
  const mimeType = mime.lookup(filePath);
  const messageBody = messageData?.body || mediaUrl;

  if (!mimeType) {
    throw new Error('Invalid mime type');
  }

  const fileType = mimeType.split('/')[0];

  try {
    let messageOptions;

    if (fileType === 'video') {
      messageOptions = {
        video: fs.readFileSync(filePath),
        caption: undefined,
        fileName: filename
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
        caption: undefined,
        fileName: filename,
        mimetype: mimeType
      };
    } else {
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

const downloadFileAndGetName = async (url: string, tenantId: number | string): Promise<string | null> => {
  try {
    const response = await axios.get(url, { responseType: 'arraybuffer' });
    const buffer = Buffer.from(response.data);
    
    const { fileTypeFromBuffer } = await import('file-type');
    const fileType = await fileTypeFromBuffer(buffer);

    if (!fileType) {
      throw new Error('Error downloading file from URL');
    }

    const ext = fileType.ext;
    const timestamp = Date.now();
    const filename = `bulk_${timestamp}.${ext}`;
    const filePath = path.join(publicFolder, String(tenantId), filename);

    await fs.promises.writeFile(filePath, buffer);
    await new Promise(resolve => setTimeout(resolve, 3000));
    await fs.promises.access(filePath, fs.constants.F_OK | fs.constants.R_OK);

    logger.info(`Download concluído com sucesso: ${filename}`);
    return filename;

  } catch (err) {
    logger.error('Erro ao baixar o arquivo:', err);
    return null;
  }
};

export const sendMediaAudioService = async (
  messageData: MessageData,
  ticket: any,
  contact: any
): Promise<MessageResponse> => {
  const { tenantId, number } = messageData;
  const cleanNumber = number.replace(/\D/g, '');

  try {
    if (contact?.message?.type === 'whatsapp') {
      const wbot = getWbot(ticket.whatsappId);
      const validContact = await CheckIsValidContactBulkZPRO(cleanNumber, tenantId);

      if (messageData.mediaUrl) {
        try {
          const media = await MessageMedia.fromUrl(messageData.mediaUrl);
          wbot.sendMessage(validContact.numberId || `${cleanNumber}@c.us`, media, {
            sendAudioAsVoice: true
          });
        } catch (error) {
          throw new AppErrorZPRO('ERR_SENDING_WAPP_MSG');
        }
      }
    }

    if (contact?.message?.type === 'baileys') {
      const wbot = await getWbotBaileysZPRO(ticket.whatsappId);
      const validContact = await CheckIsValidBaileysContactZPRO(cleanNumber, tenantId);

      try {
        const downloadAndSendMessage = async (filename: string) => {
          if (filename) {
            const filePath = `public/${tenantId}/${filename}`;
            const messageOptions = await getMessageOptions(
              filename,
              filePath,
              messageData,
              messageData.mediaUrl!,
              tenantId
            );

            await wbot.sendMessage(
              validContact || `${cleanNumber}@s.whatsapp.net`,
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
                  channel: 'baileys'
                });

                const messageId = uuidv4();
                
                const message = await CreateMessageSystemService({
                  id: messageId,
                  body: messageOptions,
                  tenantId,
                  ticket,
                  sendType: 'API 7.',
                  status: 'pending'
                });

                const dbMessage = await Message.findOne({
                  where: { id: messageId, tenantId }
                });

                if (dbMessage) {
                  await dbMessage.update({
                    mediaType: fileType,
                    mediaUrl: filename
                  });

                  socketEmitZPRO({
                    tenantId,
                    type: 'chat:update',
                    payload: dbMessage
                  });
                }
              }
            } catch (err) {
              logger.error('Error creating message system');
            }
          } else {
            logger.error('Error downloading file from URL');
          }
        };

        await downloadFileAndGetName(messageData.mediaUrl!, tenantId)
          .then(downloadAndSendMessage);

      } catch (error) {
        // Error handling
      }
    }

    return { status: 'Message sent successfully' };
  } catch (err) {
    return { status: `Error sending message: ${err}` };
  }
};

export default sendMediaAudioService; 