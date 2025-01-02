import { join } from 'path';
import { promises as fs } from 'fs';
import mime from 'mime-types';
import * as Sentry from '@sentry/node';
import { MessageMedia } from 'whatsapp-web.js';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegStatic from 'ffmpeg-static';
import axios from 'axios';

import AppError from '../../errors/AppErrorZPRO';
import { logger } from '../loggerZPRO';
import { getWbot } from '../wbotZPRO';
import { getWbotBaileys } from '../wbot-baileysZPRO';
import ListWhatsAppsService from './ListWhatsAppsServiceZPRO';
import CheckIsValidContactBulk from './CheckIsValidContactBulkZPRO';
import CheckIsValidBaileysContact from './CheckIsValidBaileysContactZPRO';
import Message from '../../models/MessageZPRO';
import Ticket from '../../models/TicketZPRO';
import Contact from '../../models/ContactZPRO';
import User from '../../models/UserZPRO';
import { socketEmit } from '../socketEmitZPRO';
import CreateMessageService from './CreateMessageServiceZPRO';

interface BulkMessageData {
  whatsappId: number;
  whatsappType: string;
  arrayNumbers: string[];
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
  min?: number;
  max?: number;
  ticketId?: number;
  tenantId: number;
}

interface MessageOptions {
  audio?: Buffer;
  video?: Buffer;
  document?: Buffer;
  image?: Buffer;
  caption?: string;
  fileName?: string;
  mimetype?: string;
  ptt?: boolean;
}

ffmpeg.setFfmpegPath(ffmpegStatic);

const publicFolder = join(__dirname, '..', '..', '..', 'public');

const convertAudioToOgg = async (inputFile: string, tenantId: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    try {
      const chunks: Buffer[] = [];
      const timestamp = new Date().getTime() + '.ogg';
      const outputPath = `${publicFolder}/${tenantId}/${timestamp}`;

      ffmpeg(inputFile)
        .audioCodec('libopus')
        .toFormat('ogg')
        .addOutputOptions('-avoid_negative_ts make_zero')
        .audioChannels(1)
        .on('end', async () => {
          await fs.writeFile(outputPath, Buffer.from(chunks));
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
  caption: string | undefined,
  mediaDescription: string | undefined,
  tenantId: string
): Promise<MessageOptions> => {
  const mimeType = mime.lookup(filePath);
  
  if (!mimeType) {
    throw new Error('Invalid mime type');
  }

  const fileType = mimeType.split('/')[0];

  try {
    let messageOptions: MessageOptions = {};

    if (fileType === 'video') {
      messageOptions = {
        video: await fs.readFile(filePath),
        caption: undefined,
        fileName
      };
    } else if (fileType === 'audio') {
      const audioPath = await convertAudioToOgg(filePath, tenantId);
      messageOptions = {
        audio: await fs.readFile(audioPath),
        mimetype: 'audio/ogg',
        ptt: true
      };
    } else if (fileType === 'document' || fileType === 'text') {
      messageOptions = {
        document: await fs.readFile(filePath),
        caption: undefined,
        fileName,
        mimetype: mimeType
      };
    } else if (fileType === 'application') {
      messageOptions = {
        document: await fs.readFile(filePath),
        caption: undefined,
        fileName,
        mimetype: mimeType
      };
    } else {
      messageOptions = {
        image: await fs.readFile(filePath),
        caption: undefined
      };
    }

    return messageOptions;
  } catch (err) {
    Sentry.captureException(err);
    console.log(err);
    return {} as MessageOptions;
  }
};

const bulkFastMessageService = async (data: BulkMessageData): Promise<void> => {
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
    ticketId,
    tenantId
  } = data;

  const whatsapps = await ListWhatsAppsService(tenantId);
  const whatsapp = whatsapps.find(w => w.id === parseInt(whatsappId.toString()));

  if (!whatsapp) {
    throw new AppError('ERR_WAPP_NOT_FOUND', 404);
  }

  let sentMessage: any;

  if (whatsappType === 'web') {
    const wbot = getWbot(parseInt(whatsappId.toString()));

    if (!groups && typeof groups === 'boolean') {
      for (const number of arrayNumbers) {
        try {
          let validNumber;
          try {
            validNumber = await CheckIsValidContactBulk(number, tenantId);
          } catch (err) {
            // ignore error
          }

          const delay = Math.floor(
            Math.random() * (parseInt(max.toString()) - parseInt(min.toString()) + 1) +
              min
          ) * 1000;

          if (message) {
            sentMessage = await wbot.sendMessage(validNumber.number, message);
          }

          if (media) {
            const media = await MessageMedia.fromUrl(mediaUrl);
            sentMessage = await wbot.sendMessage(validNumber.number, media, {
              caption: mediaDescription
            });
          }

          if (voice) {
            const media = await MessageMedia.fromUrl(voiceUrl);
            sentMessage = await wbot.sendMessage(validNumber.number, media, {
              sendAudioAsVoice: true
            });
          }

          await new Promise(resolve => setTimeout(resolve, delay));

        } catch (err) {
          logger.error(`Error bulk message: ${err}`);
        }
      }
    } else if (groups === 'true') {
      for (const number of arrayNumbers.split(',')) {
        try {
          let validNumber;
          try {
            validNumber = await CheckIsValidContactBulk(number, tenantId);
          } catch (err) {
            // ignore error
          }

          const delay = Math.floor(
            Math.random() * (parseInt(max.toString()) - parseInt(min.toString()) + 1) +
              min
          ) * 1000;

          if (mediaLocal === 'true') {
            const media = MessageMedia.fromFilePath(
              `${publicFolder}/${tenantId}/${file.filename}`
            );
            sentMessage = await wbot.sendMessage(validNumber.number, media, {
              caption: mediaLocalDescription
            });
          }

          if (voiceLocal === 'true') {
            const media = MessageMedia.fromFilePath(
              `${publicFolder}/${tenantId}/${file.filename}`
            );
            sentMessage = await wbot.sendMessage(validNumber.number, media, {
              sendAudioAsVoice: true
            });
          }

          await new Promise(resolve => setTimeout(resolve, delay));

        } catch (err) {
          logger.error(`Error bulk message: ${err}`);
        }
      }
    } else if (groups && typeof groups === 'boolean') {
      for (const number of arrayNumbers) {
        try {
          const delay = Math.floor(
            Math.random() * (parseInt(max.toString()) - parseInt(min.toString()) + 1) +
              min
          ) * 1000;

          if (message) {
            await wbot.sendMessage(`${number}@g.us`, message);
          }

          if (media) {
            const media = await MessageMedia.fromUrl(mediaUrl);
            await wbot.sendMessage(`${number}@g.us`, media, {
              caption: mediaDescription
            });
          }

          if (voice) {
            const media = await MessageMedia.fromUrl(voiceUrl);
            await wbot.sendMessage(`${number}@g.us`, media, {
              sendAudioAsVoice: true
            });
          }

          await new Promise(resolve => setTimeout(resolve, delay));

        } catch (err) {
          logger.error(`Error bulk message: ${err}`);
        }
      }
    } else if (groups === 'true') {
      for (const number of arrayNumbers.split(',')) {
        try {
          const delay = Math.floor(
            Math.random() * (parseInt(max.toString()) - parseInt(min.toString()) + 1) +
              min
          ) * 1000;

          if (mediaLocal === 'true') {
            const media = MessageMedia.fromFilePath(
              `${publicFolder}/${tenantId}/${file.filename}`
            );
            await wbot.sendMessage(`${number}@g.us`, media, {
              caption: mediaLocalDescription
            });
          }

          await new Promise(resolve => setTimeout(resolve, delay));

        } catch (err) {
          logger.error(`Error bulk message: ${err}`);
        }
      }
    }
  }

  if (whatsappType === 'baileys') {
    const wbot = await getWbotBaileys(parseInt(whatsappId.toString()));

    if (!groups && typeof groups === 'boolean') {
      for (const number of arrayNumbers) {
        try {
          let validNumber;
          try {
            validNumber = await CheckIsValidBaileysContact(number, tenantId);
          } catch (err) {
            // ignore error
          }

          const delay = Math.floor(
            Math.random() * (parseInt(max.toString()) - parseInt(min.toString()) + 1) +
              min
          ) * 1000;

          if (message) {
            sentMessage = await wbot.sendMessage(validNumber, { text: message });
          }

          if (media) {
            try {
              downloadFileAndGetName(mediaUrl, tenantId.toString()).then(
                async fileName => {
                  if (fileName) {
                    const filePath = join(
                      __dirname,
                      '..',
                      '..',
                      '..',
                      'public',
                      tenantId.toString(),
                      fileName
                    );

                    const messageOptions = await getMessageOptions(
                      fileName,
                      filePath,
                      mediaDescription,
                      mediaDescription,
                      tenantId.toString()
                    );

                    try {
                      sentMessage = await wbot.sendMessage(
                        validNumber,
                        { ...messageOptions }
                      );
                      logger.info(':::: Z-PRO :::: Download concluído');

                      if (ticketId) {
                        await handleSentMessage(sentMessage, ticketId, tenantId);
                      }
                    } catch (error) {
                      logger.info(`:::: ZDG :::: Error: ${error}`);
                    }
                  } else {
                    logger.error('ERR_DOWNLOAD_MESSAGE_MEDIA');
                  }
                }
              );
            } catch (error) {
              // ignore error
            }
          }

          if (voice) {
            try {
              downloadFileAndGetName(voiceUrl, tenantId.toString()).then(
                async fileName => {
                  if (fileName) {
                    const filePath = join(
                      __dirname,
                      '..',
                      '..',
                      '..',
                      'public',
                      tenantId.toString(),
                      fileName
                    );

                    const messageOptions = await getMessageOptions(
                      fileName,
                      filePath,
                      mediaDescription,
                      mediaDescription,
                      tenantId.toString()
                    );

                    try {
                      sentMessage = await wbot.sendMessage(
                        validNumber,
                        {
                          audio: filePath,
                          ptt: true
                        }
                      );
                      logger.info(':::: Z-PRO :::: Download concluído');

                      if (ticketId) {
                        await handleSentMessage(sentMessage, ticketId, tenantId);
                      }
                    } catch (error) {
                      logger.info(`:::: ZDG :::: Error: ${error}`);
                    }
                  } else {
                    logger.error('ERR_DOWNLOAD_MESSAGE_MEDIA');
                  }
                }
              );
            } catch (error) {
              // ignore error
            }
          }

          await new Promise(resolve => setTimeout(resolve, delay));

        } catch (err) {
          logger.error(`Error bulk message: ${err}`);
        }
      }
    }
  }
};

// Função para obter o timestamp da mensagem
const getTimestampMessage = (messageTimestamp: number): number => {
  return messageTimestamp * 1000;
};

// Função para obter o tipo de mensagem
const getTypeMessage = (msg: any): string => {
  const types = {
    conversation: "text",
    imageMessage: "image",
    videoMessage: "video",
    documentMessage: "document",
    audioMessage: "audio",
    stickerMessage: "sticker"
  };

  const msgType = msg.type || msg.messageType || "text";
  return types[msgType] || msgType;
};

// Função para lidar com mensagens enviadas
const handleSentMessage = async (
  sentMessage: any,
  ticketId: number,
  tenantId: number
): Promise<void> => {
  try {
    const ticket = await Ticket.findOne({
      where: { id: ticketId },
      include: [
        {
          model: Contact,
          as: "contact"
        },
        {
          model: User,
          as: "user"
        }
      ]
    });

    if (!ticket) {
      throw new Error("Ticket not found");
    }

    const messageData = {
      messageId: sentMessage.key.id || "",
      ticketId: ticketId,
      contactId: undefined,
      body: sentMessage.message?.conversation || "",
      fromMe: sentMessage.key.fromMe || false,
      mediaType: getTypeMessage(sentMessage),
      read: sentMessage.key.fromMe || false,
      quotedMsgId: null,
      timestamp: getTimestampMessage(sentMessage.messageTimestamp) - 3 * 3600,
      status: "sended"
    };

    await CreateMessageService({
      messageData,
      tenantId
    });

    // Aguarda a mensagem ser salva e atualiza o status
    const maxRetries = 5;
    const retryInterval = 3000;

    const findSavedMessage = async (retries: number): Promise<any> => {
      for (let i = 0; i < retries; i++) {
        const message = await Message.findOne({
          where: { messageId: sentMessage.key.id, tenantId },
          include: [
            {
              model: Ticket,
              as: "ticket",
              where: { tenantId },
              include: ["contact"]
            },
            {
              model: Message,
              as: "quotedMsg",
              include: ["contact"]
            }
          ]
        });

        if (message) {
          return message;
        }

        await new Promise(resolve => setTimeout(resolve, retryInterval));
      }

      throw new AppError("ERR_MESSAGE_NOT_FOUND", 404);
    };

    const savedMessage = await findSavedMessage(maxRetries);

    const messageToUpdate = {
      status: "sended",
      ack: 2,
      contactId: savedMessage.ticket.contact.id,
      timestamp: savedMessage.ticket.updatedAt,
      tenantId: savedMessage.ticket.tenantId
    };

    await savedMessage.update({ ...messageToUpdate });

    socketEmit({
      tenantId,
      type: "chat:create",
      payload: savedMessage
    });

  } catch (err) {
    logger.error(`Error handling sent message: ${err}`);
  }
};

// Função para baixar arquivo e obter nome
const downloadFileAndGetName = async (url: string, tenantId: string): Promise<string | null> => {
  try {
    const response = await axios.get(url, { responseType: 'arraybuffer' });
    const mimeType = response.headers['content-type'];
    const fileExtension = mime.extension(mimeType);
    
    if (!fileExtension) {
      throw new Error('Invalid mime type');
    }

    const fileName = `${new Date().getTime()}.${fileExtension}`;
    const filePath = join(publicFolder, tenantId, fileName);

    await fs.writeFile(filePath, response.data);
    return fileName;

  } catch (err) {
    logger.error(`Error downloading file: ${err}`);
    return null;
  }
};

export default bulkFastMessageService; 