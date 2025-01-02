import path from 'path';
import fs from 'fs';
import mime from 'mime-types';
import * as Sentry from '@sentry/node';
import { v4 as uuidv4 } from 'uuid';
import { MessageMedia } from 'whatsapp-web.js';

import { getWbot } from '../../libs/wbotZPRO';
import { getWbotBaileys } from '../../libs/wbot-baileysZPRO';
import logger from '../../utils/loggerZPRO';
import Contact from '../../models/ContactZPRO';
import Message from '../../models/MessageZPRO';
import socketEmit from '../../helpers/socket/socketEmitZPRO';
import FindOrCreateTicketService from '../TicketServices/FindOrCreateTicketServiceZPRO';
import CreateMessageSystemService from '../MessageServices/CreateMessageSystemServiceZPRO';

import ffmpeg from 'fluent-ffmpeg';
import ffmpegStatic from 'ffmpeg-static';

ffmpeg.setFfmpegPath(ffmpegStatic);

interface MessageData {
  body: string;
  fromMe: boolean;
  read: boolean;
  mediaUrl?: string;
  mediaType?: string;
}

interface SendGroupMessageData {
  tenantId: number;
  number: string;
  body: string;
  mediaFile?: Express.Multer.File;
}

interface SessionData {
  sessionId: string;
  tenantId: number;
}

const publicFolder = path.resolve(__dirname, '..', '..', '..', 'public');

const convertAudioToOgg = async (
  inputPath: string,
  tenantId: string
): Promise<string> => {
  return new Promise((resolve, reject) => {
    try {
      const command = ffmpeg({ source: inputPath });
      const chunks: any[] = [];
      const outputPath = `${publicFolder}/${tenantId}/${new Date().getTime()}.ogg`;

      command
        .toFormat('ogg')
        .noVideo()
        .audioCodec('libopus')
        .addOutputOptions('-avoid_negative_ts make_zero')
        .audioChannels(1)
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

const getMessageOptions = async (
  fileName: string,
  filePath: string,
  messageBody?: string,
  caption?: string,
  tenantId?: string
) => {
  try {
    const mimeType = mime.lookup(filePath);
    const messageCaption = messageBody ?? caption;

    if (!mimeType) {
      throw new Error('Invalid mimetype');
    }

    const fileType = mimeType.split('/')[0];

    let messageOptions: any;

    if (fileType === 'video') {
      messageOptions = {
        video: fs.readFileSync(filePath),
        caption: undefined,
        fileName
      };
    } else if (fileType === 'audio') {
      const audioPath = await convertAudioToOgg(filePath, tenantId!);
      messageOptions = {
        audio: fs.readFileSync(audioPath),
        mimetype: 'audio/ogg',
        ptt: true
      };
    } else if (fileType === 'document' || fileType === 'application') {
      messageOptions = {
        document: fs.readFileSync(filePath),
        caption: undefined,
        fileName,
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
    console.log(err);
    return null;
  }
};

export const sendGroupMessageService = async (
  messageData: SendGroupMessageData,
  session: SessionData,
  channel?: { type: string },
  mediaFile?: Express.Multer.File
): Promise<{ status: string }> => {
  const { tenantId, number } = messageData;
  const cleanNumber = number.replace(/\D/g, '');

  try {
    if (channel?.type === 'whatsapp') {
      const wbot = getWbot(session.sessionId);

      if (mediaFile) {
        const mediaPath = MessageMedia.fromFilePath(
          `${publicFolder}/${tenantId}/${mediaFile.filename}`
        );
        await wbot.sendMessage(`${cleanNumber}@g.us`, mediaPath, {
          caption: messageData.body
        });
      } else {
        await wbot.sendMessage(`${cleanNumber}@g.us`, messageData.body);
      }
    }

    if (channel?.type === 'baileys') {
      const wbot = await getWbotBaileys(session.sessionId);

      if (mediaFile) {
        const filePath = `${publicFolder}/${tenantId}/${mediaFile.filename}`;
        const options = await getMessageOptions(
          mediaFile.filename,
          filePath,
          messageData.body,
          messageData.body,
          tenantId.toString()
        );

        await wbot.sendMessage(`${cleanNumber}@g.us`, { ...options });

        try {
          const contact = await Contact.findOne({
            where: { number: cleanNumber, tenantId }
          });

          if (contact) {
            const ticket = await FindOrCreateTicketService({
              contact,
              whatsappId: session.sessionId,
              unreadMessages: 0,
              tenantId,
              groupContact: undefined,
              channel: 'baileys'
            });

            const messageId = uuidv4();
            
            await CreateMessageSystemService({
              id: messageId,
              body: {
                text: mediaFile.filename,
                fromMe: true,
                read: true
              },
              tenantId,
              ticket,
              sendType: 'group',
              status: 'pending'
            });

            const dbMessage = await Message.findOne({
              where: { id: messageId, tenantId }
            });

            if (dbMessage) {
              const mimeType = mime.lookup(filePath);
              if (!mimeType) {
                throw new Error('Invalid mimetype');
              }

              const fileType = mimeType.split('/')[0];

              await dbMessage.update({
                mediaType: fileType,
                mediaUrl: mediaFile.filename
              });

              socketEmit({
                tenantId,
                type: 'chat:update',
                payload: dbMessage
              });
            }
          }
        } catch (err) {
          logger.error('Error handling message and ticket creation');
        }
      } else {
        await wbot.sendMessage(`${cleanNumber}@g.us`, { text: messageData.body });

        try {
          const contact = await Contact.findOne({
            where: { number: cleanNumber, tenantId }
          });

          if (contact) {
            const ticket = await FindOrCreateTicketService({
              contact,
              whatsappId: session.sessionId,
              unreadMessages: 0,
              tenantId,
              groupContact: undefined,
              channel: 'baileys'
            });

            await CreateMessageSystemService({
              body: {
                text: messageData.body,
                fromMe: true,
                read: true
              },
              tenantId,
              ticket,
              sendType: 'group',
              status: 'pending'
            });
          }
        } catch (err) {
          logger.error('Error handling message and ticket creation');
        }
      }
    }

    return { status: 'Message sent successfully' };
  } catch (err) {
    return { status: `Error sending message: ${err}` };
  }
};

export default sendGroupMessageService; 