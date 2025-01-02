import { Message as WbotMessage } from 'whatsapp-web.js';
import { Op } from 'sequelize';
import * as path from 'path';
import * as fs from 'fs';
import mime from 'mime-types';
import * as Sentry from '@sentry/node';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegStatic from 'ffmpeg-static';
import sharp from 'sharp';

import Message from '../models/Message';
import Ticket from '../models/Ticket';
import Contact from '../models/Contact';
import { logger } from '../utils/logger';
import GetWbotMessage from '../helpers/GetWbotMessageBaileysZPRO';
import socketEmit from '../helpers/socketEmitZPRO';

interface MessageData {
  id: number;
  messageId: string | null;
  ticketId: number;
  body: string;
  contactId: number;
  fromMe: boolean;
  mediaType: string;
  mediaName: string;
  status: string;
  isDeleted: boolean;
  quotedMsgId: string | null;
  scheduleDate: Date | null;
  ticket?: any;
  quotedMsg?: {
    body?: string;
    messageId?: string;
  };
  update?: (data: any) => Promise<any>;
}

interface QueueData {
  whatsapp: any;
  tenantId: number | string;
  id?: string | number;
}

const publicFolder = path.join(__dirname, '..', '..', 'public');

ffmpeg.setFfmpegPath(ffmpegStatic);

const convertAudioToOgg = async (
  inputFile: string,
  ticket: any,
  tenantId: string | number
): Promise<string> => {
  return new Promise((resolve, reject) => {
    try {
      const output: Buffer[] = [];
      const outputFile = `${new Date().getTime()}.ogg`;
      const outputPath = `${publicFolder}/${tenantId}/${outputFile}`;

      ffmpeg(inputFile)
        .toFormat('ogg')
        .audioCodec('libopus')
        .audioChannels(1)
        .audioFrequency(48000)
        .on('end', async () => {
          fs.writeFileSync(outputPath, Buffer.concat(output));
          resolve(outputPath);
        })
        .on('error', error => {
          reject(error);
        })
        .pipe()
        .on('data', chunk => {
          output.push(chunk);
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
  message: MessageData,
  body?: string,
  tenantId?: number | string
): Promise<any> => {
  const mimeType = mime.lookup(filePath);
  const messageBody = message?.quotedMsg?.body || body;

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
        fileName
      };
    } else if (fileType === 'audio') {
      const audioPath = await convertAudioToOgg(filePath, message, tenantId);
      messageOptions = {
        audio: fs.readFileSync(audioPath),
        mimetype: 'audio/ogg',
        ptt: true
      };
    } else if (fileType === 'document' || fileType === 'text') {
      messageOptions = {
        document: fs.readFileSync(filePath),
        caption: undefined,
        fileName,
        mimetype: mimeType
      };
    } else if (fileType === 'application') {
      messageOptions = {
        document: fs.readFileSync(filePath),
        caption: undefined,
        fileName,
        mimetype: mimeType
      };
    } else {
      messageOptions = {
        image: fs.readFileSync(filePath),
        caption: undefined,
        fileName,
        mimetype: mimeType
      };
    }

    return messageOptions;
  } catch (err) {
    Sentry.captureException(err);
    console.log(err);
    return null;
  }
};

let isProcessing = false;

export default {
  async handle(queueData: QueueData, forceProcessing = false): Promise<void> {
    if (isProcessing) {
      logger.info('Already processing messages. Skipping...');
      return;
    }
    
    isProcessing = true;

    try {
      const messages = await Message.findAll({
        where: {
          fromMe: true,
          messageId: { [Op.is]: null },
          status: { [Op.in]: ['pending'] },
          isDeleted: { [Op.is]: false },
          [Op.or]: [
            { scheduleDate: { [Op.lte]: new Date() } },
            { scheduleDate: { [Op.is]: null } }
          ],
          createdAt: { 
            [Op.lte]: new Date(Date.now() - 1000 * 60 * 5) 
          }
        },
        include: [
          {
            model: Contact,
            as: 'contact',
            where: { 
              tenantId: queueData.tenantId,
              number: {
                [Op.notIn]: ['', 'null']
              }
            }
          },
          {
            model: Ticket,
            as: 'ticket',
            where: { 
              tenantId: queueData.tenantId,
              status: 'open',
              whatsappId: queueData.id 
            },
            include: ['contact']
          },
          {
            model: Message,
            as: 'quotedMsg',
            include: ['contact']
          }
        ],
        order: [['createdAt', 'ASC']]
      });

      // Processa cada mensagem
      for (const message of messages) {
        const { ticket } = message;
        const contactNumber = ticket.contact.number;
        const senderType = ticket.isGroup ? 'g' : 'c';
        const chatId = `${contactNumber}@${senderType}.us`;

        let quotedMsgOptions = {};

        if (message.quotedMsg) {
          const quotedMessage = await GetWbotMessage(
            message.quotedMsg.messageId,
            'baileys'
          );

          if (quotedMessage) {
            quotedMsgOptions = {
              quoted: {
                key: quotedMessage.key,
                message: {
                  conversation: message.quotedMsg.body
                }
              }
            };
          }
        }

        try {
          let sentMessage;

          if (message.mediaType !== 'chat' && message.mediaName && !message.isDeleted) {
            const filePath = path.join(__dirname, '..', '..', '..', 'public', queueData.tenantId);
            const mediaPath = path.join(filePath, message.mediaName);

            if (message.mediaType !== 'chat' && message.mediaName && message.isSticker) {
              const newName = `${new Date().getTime()}.webp`;
              const stickerPath = path.join(filePath, newName);

              await sharp(mediaPath)
                .webp()
                .toFile(stickerPath);

              if (newName.endsWith('.webp')) {
                try {
                  sentMessage = await queueData.whatsapp.sendMessage(
                    chatId,
                    { 
                      sticker: fs.readFileSync(stickerPath)
                    },
                    { ...quotedMsgOptions }
                  );
                  fs.unlinkSync(stickerPath);
                  logger.info('Sticker message sent');
                } catch (error) {
                  logger.error(`Error sending message (id: ${message.id}): ${error}`);
                }
              }
            } else {
              try {
                const options = await getMessageOptions(
                  message.mediaName,
                  mediaPath,
                  message,
                  message.body,
                  queueData.tenantId
                );

                const sendOptions = {
                  sendAudioAsVoice: forceProcessing ? 1 : 0,
                  isForwarded: forceProcessing ? true : false
                };

                sentMessage = await queueData.whatsapp.sendMessage(
                  chatId,
                  { ...options },
                  { ...quotedMsgOptions, ...{ messageInfo: sendOptions } }
                );
                logger.info('Media message sent');
              } catch (error) {
                logger.error(`Error sending message (id: ${message.id})`);
              }
            }
          } else {
            try {
              const sendOptions = {
                sendAudioAsVoice: forceProcessing ? 1 : 0,
                isForwarded: forceProcessing ? true : false
              };

              sentMessage = await queueData.whatsapp.sendMessage(
                chatId,
                { text: message.body },
                { ...quotedMsgOptions, ...{ messageInfo: sendOptions } }
              );
              logger.info('Text message sent');
            } catch (error) {
              logger.error(`Error sending message (id: ${message.id})`);
            }
          }

          // Atualiza o status da mensagem
          const messageToUpdate = {
            ...message,
            ...sentMessage,
            id: message.id,
            messageId: sentMessage.key.id,
            status: 'sended',
            ack: 1
          };

          await Message.update(
            { ...messageToUpdate },
            { where: { id: message.id } }
          );

          const updatedMessage = await Message.findOne({
            where: { id: message.id }
          });

          if (!updatedMessage) return;

          socketEmit({
            tenantId: queueData.tenantId,
            type: 'chat:ack',
            payload: updatedMessage
          });

          logger.info('Message updated');
          logger.info('Process finished for message:', sentMessage.key.id);

        } catch (error) {
          const messageId = message.id;
          const ticketId = message.ticket.id;
          console.log(error);
          
          if (error.code === 'ENOENT') {
            await Message.destroy({ where: { id: message.id } });
          }

          await message.update({ isDeleted: true, status: 'pending' });

          logger.error(`Error processing message. Tenant: ${queueData.tenantId} | Ticket: ${ticketId}`);
          logger.error(':::: Z-PRO :::: Error sending message error:', messageId, ':::', error);
        }

        if (message.ticket.status === 'closed') {
          const ticket = await Ticket.findOne({
            where: { id: message.ticket.id }
          });

          if (!ticket) return;

          await ticket.update({ status: 'pending' });
        }
      }

    } finally {
      isProcessing = false;
    }
  }
};

export { convertAudioToOgg, getMessageOptions }; 