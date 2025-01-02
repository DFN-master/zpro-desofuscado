import path from 'path';
import fs from 'fs';
import * as Sentry from '@sentry/node';
import axios from 'axios';
import mime from 'mime-types';
import AppError from '../../errors/AppErrorZPRO';
import { logger } from '../../utils/loggerZPRO';
import { getWbot } from '../WbotServices/wbotZPRO';
import { getWbotBaileys } from '../WbotServices/wbot-baileysZPRO';
import ListWhatsAppsService from '../WhatsappService/ListWhatsAppsServiceZPRO';
import CheckIsValidContactBulk from '../WbotServices/CheckIsValidContactBulkZPRO';
import CheckIsValidBaileysContact from '../WbotServices/CheckIsValidBaileysContactZPRO';
import socketEmit from '../../helpers/socket-emitZPRO';
import { MessageMedia } from 'whatsapp-web.js';
import Message from '../../models/Message/MessageZPRO';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegStatic from 'ffmpeg-static';
import { v4 as uuidv4 } from 'uuid';
import CreateMessageSystemService from '../MessageSystemService/CreateMessageSystemServiceZPRO';
import FindOrCreateTicketService from '../TicketService/FindOrCreateTicketServiceZPRO';
import CreateOrUpdateContactService from '../ContactService/CreateOrUpdateContactServiceZPRO';
import { SendTextMessageService } from '../MessageService/SendTextMessageServiceZPRO';
import Whatsapp from '../../models/Whatsapp/WhatsappZPRO';

interface IndividualRequest {
  body: {
    whatsappId: string;
    whatsappType: string;
    number: string;
    message?: string;
    media?: boolean;
    mediaUrl?: string;
    mediaDescription?: string;
    voice?: boolean;
    voiceUrl?: string;
    mediaLocal?: string;
    mediaLocalDescription?: string;
    voiceLocal?: string;
  };
  tenantId: number;
  file?: Express.Multer.File;
}

const publicFolder = path.join(__dirname, '..', '..', '..', 'public');

ffmpeg.setFfmpegPath(ffmpegStatic);

const convertAudioToOgg = async (inputPath: string, tenantId: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    try {
      const outputPath: any[] = [];
      const timestamp = new Date().getTime() + '.ogg';
      const finalPath = `${publicFolder}/${tenantId}/${timestamp}`;

      ffmpeg({ source: inputPath })
        .toFormat('ogg')
        .noVideo()
        .audioCodec('libopus')
        .audioChannels(1)
        .on('end', async () => {
          fs.writeFileSync(finalPath, Buffer.from(outputPath));
          resolve(finalPath);
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

async function downloadFileAndGetName(url: string, tenantId: string): Promise<string | null> {
  try {
    const response = await axios.get(url, { responseType: 'arraybuffer' });
    const buffer = Buffer.from(response.data);
    
    const { fileTypeFromBuffer } = await import('file-type');
    const fileType = await fileTypeFromBuffer(buffer);
    
    if (!fileType) {
      throw new Error('Não foi possível determinar o tipo do arquivo.');
    }

    const extension = fileType.ext;
    const timestamp = Date.now();
    const filename = `bulk_${timestamp}.${extension}`;
    const filepath = path.join(__dirname, '..', '..', '..', 'public', tenantId.toString(), filename);

    await fs.promises.writeFile(filepath, buffer);
    await new Promise(resolve => setTimeout(resolve, 500));
    await fs.promises.access(filepath, fs.constants.F_OK | fs.constants.R_OK);

    logger.info(`::: Z-PRO ::: Download concluído. Salvo como: ${filename}`);
    return filename;

  } catch (error) {
    logger.error('Error individual text: Download error:', error);
    return null;
  }
}

const getMessageOptions = async (
  filename: string,
  filePath: string,
  description: any,
  caption: string,
  tenantId: string
) => {
  const mimeType = mime.lookup(filePath);
  const messageDescription = description ?? caption;

  if (!mimeType) {
    throw new Error('Invalid mime-type');
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

export const individualService = async (request: IndividualRequest): Promise<void> => {
  const {
    whatsappId,
    whatsappType,
    number,
    message,
    media,
    mediaUrl,
    mediaDescription,
    voice,
    voiceUrl,
    mediaLocal,
    mediaLocalDescription,
    voiceLocal
  } = request.body;

  const { tenantId } = request;
  const file = request.file;

  const whatsapps = await ListWhatsAppsService(tenantId);
  const whatsapp = whatsapps.find(w => w.id === parseInt(whatsappId, 10));

  if (!whatsapp) {
    throw new AppError("ERR_SESSION_NOT_ALLOWED", 404);
  }

  if (whatsappType === 'web') {
    const wbot = getWbot(parseInt(whatsappId, 10));
    const validNumber = await CheckIsValidContactBulk(number, tenantId);

    if (validNumber) {
      try {
        if (message) {
          await wbot.sendMessage(validNumber.numberId, message);
        }

        if (media) {
          const mediaMessage = await MessageMedia.fromUrl(mediaUrl);
          await wbot.sendMessage(validNumber.numberId, mediaMessage, {
            caption: mediaDescription
          });
        }

        if (voice) {
          const voiceMessage = await MessageMedia.fromUrl(voiceUrl);
          await wbot.sendMessage(validNumber.numberId, voiceMessage, {
            sendAudioAsVoice: true
          });
        }

        if (mediaLocal === 'true') {
          const mediaMessage = MessageMedia.fromFilePath(
            `${publicFolder}/${tenantId}/${file.filename}`
          );
          await wbot.sendMessage(validNumber.numberId, mediaMessage, {
            caption: mediaLocalDescription
          });
        }

        if (voiceLocal === 'true') {
          const mediaMessage = MessageMedia.fromFilePath(
            `${publicFolder}/${tenantId}/${file.filename}`
          );
          await wbot.sendMessage(validNumber.numberId, mediaMessage, {
            sendAudioAsVoice: true
          });
        }
      } catch (error) {
        logger.error(`Error individual text: sendMessage error: ${error}`);
      }
    }
  }

  if (whatsappType === 'baileys') {
    let sentMessage;
    const wbot = await getWbotBaileys(parseInt(whatsappId, 10));
    const validNumber = await CheckIsValidBaileysContact(number, tenantId);

    if (validNumber) {
      try {
        if (message) {
          sentMessage = await wbot.sendMessage(validNumber, {
            text: message
          });
        }

        if (media) {
          try {
            downloadFileAndGetName(mediaUrl, tenantId.toString()).then(async filename => {
              if (filename) {
                const filePath = path.join(__dirname, '..', '..', '..', 'public', tenantId.toString(), filename);
                const messageOptions = await getMessageOptions(
                  filename,
                  filePath,
                  mediaDescription,
                  mediaDescription,
                  tenantId.toString()
                );

                try {
                  sentMessage = await wbot.sendMessage(
                    validNumber,
                    Object.assign({}, messageOptions)
                  );
                  logger.info('::: Z-PRO ::: Download concluído.');
                } catch (error) {
                  logger.info('::: ZDG ::: sendMessage error:', error);
                }
              } else {
                logger.error('Não foi possível baixar a imagem.');
              }
            });
          } catch (error) {}
        }

        if (voice) {
          try {
            downloadFileAndGetName(voiceUrl, tenantId.toString()).then(async filename => {
              if (filename) {
                const filePath = path.join(__dirname, '..', '..', '..', 'public', tenantId.toString(), filename);
                const messageOptions = await getMessageOptions(
                  filename,
                  filePath,
                  mediaDescription,
                  mediaDescription,
                  tenantId.toString()
                );

                try {
                  sentMessage = await wbot.sendMessage(
                    validNumber,
                    Object.assign({}, messageOptions)
                  );
                  logger.info('::: Z-PRO ::: Download concluído.');
                } catch (error) {
                  logger.info('::: ZDG ::: sendMessage error:', error);
                }
              } else {
                logger.error('Não foi possível baixar a imagem.');
              }
            });
          } catch (error) {}
        }

        if (mediaLocal === 'true') {
          const filePath = path.join(__dirname, '..', '..', '..', 'public', tenantId.toString(), file.filename);
          const messageOptions = await getMessageOptions(
            file.filename,
            filePath,
            mediaLocalDescription,
            mediaLocalDescription,
            tenantId.toString()
          );

          try {
            sentMessage = await wbot.sendMessage(
              validNumber,
              Object.assign({}, messageOptions)
            );
            logger.info('::: Z-PRO ::: Download concluído.');
          } catch (error) {
            logger.info('::: ZDG ::: sendMessage error:', error);
          }
        }

        if (voiceLocal === 'true') {
          const filePath = path.join(__dirname, '..', '..', '..', 'public', tenantId.toString(), file.filename);
          const messageOptions = await getMessageOptions(
            file.filename,
            filePath,
            mediaDescription,
            mediaDescription,
            tenantId.toString()
          );

          try {
            sentMessage = await wbot.sendMessage(
              validNumber,
              Object.assign({}, messageOptions)
            );
            logger.info('::: Z-PRO ::: Download concluído.');
          } catch (error) {
            logger.info('::: ZDG ::: sendMessage error:', error);
          }
        }

        const contactData = {
          name: validNumber.replace(/\D/g, ''),
          number: validNumber.replace(/\D/g, ''),
          profilePicUrl: undefined,
          isGroup: validNumber.includes('@g.us'),
          isUser: !validNumber.includes('@g.us'),
          isWAContact: false,
          tenantId,
          pushname: validNumber
        };

        if (contactData.isGroup) {
          contactData.name = validNumber.replace('@g.us', '');
        }

        const contact = await CreateOrUpdateContactService(contactData);

        const ticket = await FindOrCreateTicketService({
          contact,
          whatsappId: wbot.id,
          unreadMessages: 0,
          tenantId,
          groupContact: undefined,
          channel: 'baileys'
        });

        const messageData = {
          fromMe: true,
          read: true,
          body: message
        };

        const messageId = uuidv4();
        
        await CreateMessageSystemService({
          id: messageId,
          messageData,
          tenantId,
          ticket,
          sendType: 'individual',
          status: 'pending'
        });

        const dbMessage = await Message.findOne({
          where: { id: messageId, tenantId }
        });

        await dbMessage.update({
          ack: 1,
          messageId: sentMessage?.key.id
        });

        socketEmit({
          tenantId,
          channel: "chat:update",
          payload: dbMessage
        });
      } catch (error) {
        logger.error(`Error individual text: sendMessage error: ${error}`);
      }
    }
  }

  if (whatsappType === 'meow') {
    const contactData = {
      name: number.replace(/\D/g, ''),
      number: number.replace(/\D/g, ''),
      profilePicUrl: undefined,
      isGroup: number.includes('@g.us'),
      isUser: !number.includes('@g.us'),
      isWAContact: false,
      tenantId,
      pushname: number
    };

    if (contactData.isGroup) {
      contactData.name = number.replace('@g.us', '');
    }

    const contact = await CreateOrUpdateContactService(contactData);

    const ticket = await FindOrCreateTicketService({
      contact,
      whatsappId,
      unreadMessages: 0,
      tenantId,
      groupContact: undefined,
      channel: 'meow'
    });

    const whatsappInstance = await Whatsapp.findOne({
      where: { id: whatsappId }
    });

    await SendTextMessageService(
      message,
      undefined,
      ticket.id,
      ticket.contact,
      whatsappInstance
    );
  }
}; 