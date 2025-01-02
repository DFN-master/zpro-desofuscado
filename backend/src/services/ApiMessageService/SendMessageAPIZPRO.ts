import path from 'path';
import fs from 'fs';
import mime from 'mime-types';
import * as Sentry from '@sentry/node';
import { v4 as uuidv4 } from 'uuid';
import { MessageMedia } from 'whatsapp-web.js';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegStatic from 'ffmpeg-static';

import { getWbot } from '../WbotServices/wbotZPRO';
import { getWbotBaileys } from '../WbotServices/wbot-baileysZPRO';
import CheckIsValidContactBulk from './CheckContactBulkZPRO';
import CheckIsValidBaileysContact from './CheckBaileysContactZPRO';
import Message from '../../models/MessageZPRO';
import socketEmit from '../../helpers/socketEmitZPRO';
import Contact from '../../models/ContactZPRO';
import logger from '../../utils/loggerZPRO';
import FindOrCreateTicketService from '../TicketServices/FindOrCreateTicketServiceZPRO';
import CreateMessageSystemService from '../MessageServices/CreateMessageSystemServiceZPRO';
import SendWABAMetaTextService from '../WABAMetaServices/SendWABAMetaTextServiceZPRO';
import SendWABAMetaImageService from '../WABAMetaServices/SendWABAMetaImageServiceZPRO';
import SendWABAMetaAudioService from '../WABAMetaServices/SendWABAMetaAudioServiceZPRO';
import SendWABAMetaDocService from '../WABAMetaServices/SendWABAMetaDocServiceZPRO';
import SendWABAMetaVideoService from '../WABAMetaServices/SendWABAMetaVideoServiceZPRO';
import CreateOrUpdateContactService from '../ContactServices/CreateOrUpdateContactServiceZPRO';

interface SendMessageData {
  tenantId: number | string;
  number: string;
  body: string;
  channel?: string;
  tokenAPI?: string;
}

interface MediaFile {
  filename: string;
  mimetype: string;
}

interface WABAConfig {
  type: string;
  tokenAPI: string;
}

ffmpeg.setFfmpegPath(ffmpegStatic);

const publicFolder = path.resolve(__dirname, '..', '..', '..', 'public');

const convertAudioToOgg = async (
  inputPath: string,
  tenantId: string | number
): Promise<string> => {
  return new Promise((resolve, reject) => {
    try {
      const ffmpegCommand = ffmpeg({ source: inputPath });
      const chunks: any[] = [];
      const outputFilename = new Date().getTime() + '.ogg';
      const outputPath = `${publicFolder}/${tenantId}/${outputFilename}`;

      ffmpegCommand
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
  filename: string,
  path: string,
  message?: any,
  caption?: string,
  tenantId?: string | number
): Promise<MessageMedia | null> => {
  const mimeType = mime.lookup(path);
  const messageCaption = message?.body || caption;

  if (!mimeType) {
    throw new Error('Invalid mimetype');
  }

  const mediaType = mimeType.split('/')[0];

  try {
    let messageOptions;

    if (mediaType === 'video') {
      messageOptions = {
        video: fs.readFileSync(path),
        caption: undefined,
        fileName: filename
      };
    } else if (mediaType === 'audio') {
      const audioPath = await convertAudioToOgg(path, tenantId);
      messageOptions = {
        audio: fs.readFileSync(audioPath),
        mimetype: 'audio/ogg',
        ptt: true
      };
    } else if (
      mediaType === 'application' ||
      mediaType === 'text'
    ) {
      messageOptions = {
        document: fs.readFileSync(path),
        caption: undefined,
        fileName: filename,
        mimetype: mimeType
      };
    } else if (mediaType === 'document') {
      messageOptions = {
        document: fs.readFileSync(path),
        caption: undefined,
        fileName: filename,
        mimetype: mimeType
      };
    } else {
      messageOptions = {
        image: fs.readFileSync(path),
        caption: undefined
      };
    }

    return messageOptions;
  } catch (error) {
    Sentry.captureException(error);
    logger.error(error);
    return null;
  }
};

const mimetypeToService = {
  'video/mp4': SendWABAMetaVideoService,
  'video/3gp': SendWABAMetaVideoService,
  'image/jpeg': SendWABAMetaImageService,
  'image/png': SendWABAMetaImageService,
  'application/pdf': SendWABAMetaDocService,
  'application/msword': SendWABAMetaDocService,
  'application/vnd.ms-excel': SendWABAMetaDocService,
  'application/vnd.ms-powerpoint': SendWABAMetaDocService,
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': SendWABAMetaDocService,
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': SendWABAMetaDocService,
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': SendWABAMetaDocService,
  'audio/mp3': SendWABAMetaAudioService,
  'audio/mp4': SendWABAMetaAudioService,
  'audio/mpeg': SendWABAMetaAudioService,
  'audio/ogg': SendWABAMetaAudioService,
  'audio/amr': SendWABAMetaAudioService,
  'audio/aac': SendWABAMetaAudioService
};

const sendMessageService = async (
  messageData: SendMessageData,
  contact: Contact,
  media?: MediaFile,
  wabaConfig?: WABAConfig
): Promise<{ body: string }> => {
  const { tenantId, number } = messageData;
  const cleanNumber = number.replace(/\D/g, '');

  try {
    // API 1 (código existente permanece igual)
    if (wabaConfig?.type === 'API 1.') {
      const wbot = getWbot(contact.tenantId);
      const validContact = await CheckIsValidContactBulk(cleanNumber, tenantId);

      if (media) {
        const validContactMedia = await CheckIsValidContactBulk(cleanNumber, tenantId);
        const mediaPath = MessageMedia.fromFilePath(`${publicFolder}/${tenantId}/${media.filename}`);
        await wbot.sendMessage(validContactMedia.number || `${cleanNumber}@c.us`, mediaPath, {
          caption: messageData.body
        });
      } else {
        await wbot.sendMessage(validContact.number || `${cleanNumber}@c.us`, messageData.body);
      }
    }

    // API 2 (Baileys)
    if (wabaConfig?.type === 'API 2.') {
      const wbot = await getWbotBaileys(contact.tenantId);
      const validContact = await CheckIsValidBaileysContact(cleanNumber, tenantId);

      if (media) {
        const mediaPath = `${publicFolder}/${tenantId}/${media.filename}`;
        const messageOptions = await getMessageOptions(
          media.filename,
          mediaPath,
          messageData,
          messageData.body,
          tenantId
        );

        await wbot.sendMessage(
          validContact || `${cleanNumber}@s.whatsapp.net`,
          Object.assign({}, messageOptions)
        );

        try {
          const contactRecord = await Contact.findOne({
            where: { number: cleanNumber, tenantId }
          });

          if (contactRecord) {
            const ticket = await FindOrCreateTicketService({
              contact: contactRecord,
              whatsappId: contact.tenantId,
              unreadMessages: 0,
              tenantId,
              groupContact: undefined,
              channel: 'baileys'
            });

            const messageRecord = {
              fromMe: true,
              mediaUrl: true,
              body: media.filename
            };

            const messageId = uuidv4();
            
            await CreateMessageSystemService({
              msg: messageId,
              messageData: messageRecord,
              tenantId,
              ticket,
              sendType: 'API 2.',
              status: 'pending'
            });

            const dbMessage = await Message.findOne({
              where: { id: messageId, tenantId }
            });

            if (dbMessage) {
              await dbMessage.update({
                mediaType: mediaType,
                mediaName: media.filename
              });

              socketEmit({
                tenantId,
                type: 'chat:update',
                payload: dbMessage
              });
            }
          }
        } catch (err) {
          logger.error('Error creating message system record');
        }
      } else {
        await wbot.sendMessage(
          validContact || `${cleanNumber}@s.whatsapp.net`,
          { text: messageData.body }
        );

        try {
          const contactRecord = await Contact.findOne({
            where: { number: cleanNumber, tenantId }
          });

          if (contactRecord) {
            const ticket = await FindOrCreateTicketService({
              contact: contactRecord,
              whatsappId: contact.tenantId,
              unreadMessages: 0,
              tenantId,
              groupContact: undefined,
              channel: 'baileys'
            });

            const messageRecord = {
              body: messageData.body,
              fromMe: true,
              read: true
            };

            await CreateMessageSystemService({
              messageData: messageRecord,
              tenantId,
              ticket,
              sendType: 'API 2.',
              status: 'pending'
            });
          }
        } catch (err) {
          logger.error('Error creating message system record');
        }
      }
    }

    // WABA
    if (wabaConfig?.type === 'waba') {
      const contactData = {
        name: number,
        number: number,
        profilePicUrl: undefined,
        isGroup: false,
        isUser: false,
        isWAContact: false,
        tenantId,
        pushname: number
      };

      const contactRecord = await CreateOrUpdateContactService(contactData);
      const messageId = uuidv4();

      const ticket = await FindOrCreateTicketService({
        contact: contactRecord,
        whatsappId: contact.tenantId,
        unreadMessages: 0,
        tenantId,
        groupContact: undefined,
        channel: 'waba'
      });

      if (media) {
        const messageRecord = {
          fromMe: true,
          mediaUrl: true,
          body: media.filename
        };

        await CreateMessageSystemService({
          msg: messageId,
          messageData: messageRecord,
          tenantId,
          ticket,
          sendType: 'WABA API',
          status: 'pending'
        });

        const dbMessage = await Message.findOne({
          where: { id: messageId, tenantId }
        });

        const mediaPath = process.env.BACKEND_URL + '/public/' + tenantId + '/' + media.filename;
        const ServiceClass = mimetypeToService[media.mimetype];

        if (ServiceClass) {
          const service = new ServiceClass();
          let response;

          switch (ServiceClass) {
            case SendWABAMetaImageService:
              response = await service.sendImage({
                number: cleanNumber,
                wabaBearerToken: wabaConfig.tokenAPI,
                imageUrl: mediaPath,
                ticket,
                tenantId,
                messageId,
                whatsapp: wabaConfig
              });
              break;

            case SendWABAMetaAudioService:
              response = await service.sendAudio({
                number: cleanNumber,
                wabaBearerToken: wabaConfig.tokenAPI,
                audioUrl: mediaPath,
                ticket,
                tenantId,
                messageId,
                whatsapp: wabaConfig
              });
              break;

            case SendWABAMetaDocService:
              response = await service.sendDoc({
                number: cleanNumber,
                wabaBearerToken: wabaConfig.tokenAPI,
                docUrl: mediaPath,
                caption: media.filename,
                ticket,
                tenantId,
                messageId,
                whatsapp: wabaConfig
              });
              break;

            case SendWABAMetaVideoService:
              response = await service.sendVideo({
                number: cleanNumber,
                wabaBearerToken: wabaConfig.tokenAPI,
                videoUrl: mediaPath,
                caption: media.filename,
                ticket,
                tenantId,
                messageId,
                whatsapp: wabaConfig
              });
              break;

            default:
              throw new Error('Unsupported media type');
          }
        } else {
          logger.error('Unsupported mimetype: ' + media.mimetype);
        }

        if (dbMessage) {
          await dbMessage.update({
            mediaType: mediaType,
            mediaName: media.filename
          });

          socketEmit({
            tenantId,
            type: 'chat:update',
            payload: dbMessage
          });
        }
      } else {
        const messageRecord = {
          messageData: messageData,
          tenantId,
          ticket,
          sendType: 'WABA API',
          status: 'pending',
          messageId
        };

        await CreateMessageSystemService(messageRecord);

        const service = new SendWABAMetaTextService();
        await service.sendMessage({
          number: cleanNumber,
          wabaBearerToken: wabaConfig.tokenAPI,
          text: messageData.body,
          ticket,
          tenantId,
          messageId,
          whatsapp: wabaConfig
        });
      }
    }

    return { body: 'Message sent successfully' };
  } catch (error) {
    return { body: `Message sent error: ${error}` };
  }
};

export { sendMessageService }; 