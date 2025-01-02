import path from 'path';
import fs from 'fs';
import mime from 'mime-types';
import * as Sentry from '@sentry/node';
import { Readable } from 'stream';
import { v4 as uuid } from 'uuid';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegStatic from 'ffmpeg-static';
import { MessageMedia } from 'whatsapp-web.js';

import Message from '../../models/MessageZPRO';
import Contact from '../../models/ContactZPRO';
import Ticket from '../../models/TicketZPRO';

import { getWbot } from '../WbotServicesZPRO/wbotZPRO';
import { getWbotBaileys } from '../WbotServicesZPRO/wbot-baileysZPRO';
import CheckIsValidContactBulk from '../CheckServicesZPRO/CheckIsValidContactBulkZPRO';
import CheckIsValidBaileysContact from '../CheckServicesZPRO/CheckIsValidBaileysContactZPRO';
import FindOrCreateTicketService from '../TicketServicesZPRO/FindOrCreateTicketServiceZPRO';
import CreateMessageSystemService from '../MessageServicesZPRO/CreateMessageSystemServiceZPRO';
import socketEmit from '../../helpers/socketEmitZPRO';
import CreateOrUpdateContactService from '../ContactServicesZPRO/CreateOrUpdateContactServiceZPRO';

import SendWABAMetaImageService from '../WABAMetaServices/SendWABAMetaImageServiceZPRO';
import SendWABAMetaAudioService from '../WABAMetaServices/SendWABAMetaAudioServiceZPRO';
import SendWABAMetaDocService from '../WABAMetaServices/SendWABAMetaDocServiceZPRO';
import SendWABAMetaVideoService from '../WABAMetaServices/SendWABAMetaVideoServiceZPRO';

import logger from '../../utils/loggerZPRO';

interface SendMediaBase64Data {
  number: string;
  body?: string;
  tenantId: number;
  medias?: Express.Multer.File[];
  ticket?: Ticket;
}

interface WABAMessage {
  type: string;
  tokenAPI?: string;
}

ffmpeg.setFfmpegPath(ffmpegStatic);

const publicFolder = path.resolve(__dirname, '..', '..', '..', 'public');

const convertAudioToOgg = async (
  inputFile: string,
  tenantId: string
): Promise<string> => {
  return new Promise((resolve, reject) => {
    try {
      const outputFileName = new Date().getTime() + '.ogg';
      const outputFile = `${publicFolder}/${tenantId}/${outputFileName}`;
      const chunks: any[] = [];

      ffmpeg({ source: inputFile })
        .toFormat('ogg')
        .noVideo()
        .audioCodec('libopus')
        .addOutputOptions('-avoid_negative_ts make_zero')
        .audioChannels(1)
        .on('end', async () => {
          fs.writeFileSync(outputFile, Buffer.concat(chunks));
          resolve(outputFile);
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
  message: SendMediaBase64Data,
  body: string | undefined,
  tenantId: string
) => {
  const mimeType = mime.lookup(filePath);
  const messageBody = message?.body || body;

  if (!mimeType) {
    throw new Error('Invalid mimetype');
  }

  const fileType = mimeType.split('/')[0];

  try {
    let messageOptions: any;

    switch(fileType) {
      case 'video':
        messageOptions = {
          video: fs.readFileSync(filePath),
          caption: messageBody,
          fileName
        };
        break;

      case 'audio': 
        const audioFile = await convertAudioToOgg(filePath, tenantId);
        messageOptions = {
          audio: fs.readFileSync(audioFile),
          mimetype: 'audio/ogg',
          ptt: true
        };
        break;

      case 'application':
        messageOptions = {
          document: fs.readFileSync(filePath),
          caption: messageBody,
          fileName,
          mimetype: mimeType
        };
        break;

      default:
        messageOptions = {
          image: fs.readFileSync(filePath),
          caption: messageBody
        };
    }

    return messageOptions;

  } catch (err) {
    Sentry.captureException(err);
    console.log(err);
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
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': SendWABAMetaDocService,
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': SendWABAMetaDocService,
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': SendWABAMetaDocService,
  'audio/mp3': SendWABAMetaAudioService,
  'audio/mp4': SendWABAMetaAudioService,
  'audio/mpeg': SendWABAMetaAudioService,
  'audio/ogg': SendWABAMetaAudioService,
  'audio/amr': SendWABAMetaAudioService,
  'audio/aac': SendWABAMetaAudioService
};

const bufferToMulterFile = (
  buffer: Buffer,
  originalname: string,
  mimetype: string
): Express.Multer.File => {
  return {
    fieldname: 'file',
    originalname,
    encoding: '7bit',
    mimetype,
    buffer,
    size: buffer.length,
    stream: Readable.from(buffer),
    destination: '',
    filename: originalname,
    path: ''
  } as Express.Multer.File;
};

const readFileAndReturnMulterObject = async (
  filename: string,
  tenantId: string,
  mimetype: string | false
): Promise<Express.Multer.File | undefined> => {
  try {
    const filePath = path.join(
      __dirname,
      '..',
      '..',
      '..',
      'public',
      tenantId,
      filename
    );
    const buffer = await fs.promises.readFile(filePath);
    return bufferToMulterFile(buffer, filename, mimetype as string);
  } catch (err) {
    logger.error('Erro ao ler o arquivo:', err);
    return undefined;
  }
};

const sendMediaBase64Service = async (
  messageData: SendMediaBase64Data,
  contact: Contact,
  waba: WABAMessage,
  filePath: string,
  fileName: string
): Promise<{ status: string }> => {
  const { tenantId, number } = messageData;
  const cleanNumber = number.replace(/\D/g, '');

  try {
    // Envio via WhatsApp Web
    if (waba?.type === 'whatsapp') {
      const wbot = getWbot(contact.sessionId);
      const validNumber = await CheckIsValidContactBulk(cleanNumber, tenantId);
      const media = MessageMedia.fromFilePath(filePath);
      await wbot.sendMessage(
        validNumber.numberId || `${cleanNumber}@c.us`,
        media,
        { caption: messageData.body }
      );
    }

    // Envio via Baileys
    if (waba?.type === 'baileys') {
      const wbot = await getWbotBaileys(contact.sessionId);
      const validNumber = await CheckIsValidBaileysContact(cleanNumber, tenantId);
      const options = await getMessageOptions(
        fileName,
        filePath,
        messageData,
        messageData.body,
        tenantId.toString()
      );

      await wbot.sendMessage(
        validNumber || `${cleanNumber}@s.whatsapp.net`,
        { ...options }
      );

      try {
        const messageRecord = await Message.findOne({
          where: { idFront: uuid() }
        });

        if (messageRecord) {
          const ticket = await FindOrCreateTicketService({
            contact: validNumber,
            sessionId: contact.sessionId,
            unreadMessages: 0,
            tenantId,
            whatsappId: undefined,
            channel: 'baileys'
          });

          await CreateMessageSystemService({
            msg: {
              ...messageData,
              fromMe: true
            },
            tenantId,
            ticket,
            userId: contact.userId,
            status: 'sended'
          });

          const mimeType = mime.lookup(filePath);
          const fileType = mimeType?.split('/')[0];

          await messageRecord.update({
            mediaType: fileType,
            mediaName: fileName
          });

          socketEmit({
            tenantId,
            type: 'chat:update',
            payload: messageRecord
          });
        }
      } catch (err) {
        logger.warn('Falha ao criar mensagem da API 6.');
      }
    }

    // Envio via WABA
    if (waba?.type === 'waba') {
      try {
        const newContact = await CreateOrUpdateContactService({
          name: number,
          number: number,
          profilePicUrl: undefined,
          isGroup: false,
          isUser: false,
          isWAContact: false,
          tenantId,
          pushname: number
        });

        const ticket = await FindOrCreateTicketService({
          contact: newContact,
          sessionId: contact.sessionId,
          unreadMessages: 0,
          tenantId,
          whatsappId: undefined,
          channel: 'waba'
        });

        const mimeType = mime.lookup(`${publicFolder}/${fileName}`);
        const media = await readFileAndReturnMulterObject(
          fileName,
          tenantId.toString(),
          mimeType
        );

        await CreateMessageSystemService({
          msg: {
            ...messageData,
            fromMe: true
          },
          tenantId,
          medias: media ? [media] : undefined,
          ticket,
          userId: contact.userId,
          scheduleDate: undefined,
          sendType: mimeType?.toString().split('/')[0],
          status: 'pending',
          idFront: uuid()
        });

        const ServiceClass = mimetypeToService[mimeType?.toString() as keyof typeof mimetypeToService];

        if (ServiceClass) {
          const service = new ServiceClass();
          let response;

          const mediaUrl = `${process.env.BACKEND_URL}/public/${tenantId}/${fileName}`;

          switch (ServiceClass) {
            case SendWABAMetaImageService:
              response = await service.sendImage({
                number: cleanNumber,
                tokenAPI: waba.tokenAPI,
                imageUrl: mediaUrl,
                ticket,
                tenantId,
                idFront: uuid(),
                whatsapp: waba
              });
              break;

            case SendWABAMetaAudioService:
              response = await service.sendAudio({
                number: cleanNumber,
                tokenAPI: waba.tokenAPI,
                audioUrl: mediaUrl,
                ticket,
                tenantId,
                idFront: uuid(),
                whatsapp: waba
              });
              break;

            case SendWABAMetaDocService:
              response = await service.sendDoc({
                number: cleanNumber,
                tokenAPI: waba.tokenAPI,
                docUrl: mediaUrl,
                caption: fileName,
                ticket,
                tenantId,
                idFront: uuid(),
                whatsapp: waba
              });
              break;

            case SendWABAMetaVideoService:
              response = await service.sendVideo({
                number: cleanNumber,
                tokenAPI: waba.tokenAPI,
                videoUrl: mediaUrl,
                caption: fileName,
                ticket,
                tenantId,
                idFront: uuid(),
                whatsapp: waba
              });
              break;

            default:
              throw new Error('Unsupported media type');
          }
        } else {
          logger.warn('Unsupported mimetype:', mimeType);
        }
      } catch (err) {
        logger.warn('Falha ao criar mensagem da API 8.:', err);
      }
    }

    return { status: 'Message sent successfully' };
  } catch (err) {
    return { status: `Message sent error: ${err}` };
  }
};

export { sendMediaBase64Service }; 