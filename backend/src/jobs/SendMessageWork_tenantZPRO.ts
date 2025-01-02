import path from 'path';
import { MessageMedia } from 'whatsapp-web.js';
import { Op } from 'sequelize';
import Message from '../models/MessageZPRO';
import Ticket from '../models/TicketZPRO';
import Contact from '../models/ContactZPRO';
import { logger } from '../utils/loggerZPRO';
import GetWbotMessage from '../helpers/GetWbotMessageZPRO';
import socketEmit from '../helpers/socketEmitZPRO';
import { getWbot } from '../libs/wbotZPRO';

interface QueueMessage {
  messageId: string;
  status: string;
  ack: number;
}

let isProcessing = false;

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const randomIntFromInterval = (min: number, max: number): number => {
  return Math.floor(Math.random() * (max - min + 1) + min);
};

const rndInt = randomIntFromInterval(1000, 3000);

export const SendMessageWorker = {
  async handle(): Promise<void> {
    if (isProcessing) {
      logger.info('Job já está em execução. Aguardando finalização...');
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
          ]
        },
        include: [
          {
            model: Ticket,
            as: 'ticket',
            where: {
              status: { [Op.ne]: 'closed' }
            }
          },
          {
            model: Message,
            as: 'quotedMsg'
          },
          {
            model: Contact
          }
        ],
        order: [['createdAt', 'ASC']]
      });

      // Agrupa mensagens por tenantId
      const messagesByTenant = messages.reduce((acc: any, message: any) => {
        if (!acc[message.tenantId]) {
          acc[message.tenantId] = [];
        }
        acc[message.tenantId].push(message);
        return acc;
      }, {});

      for (const tenantId in messagesByTenant) {
        const tenantMessages = messagesByTenant[tenantId];

        for (const message of tenantMessages) {
          // Verifica se o ticket ainda existe
          if (!message.ticket.whatsappId) {
            await Message.destroy({ where: { id: message.id } });
            logger.info(`Mensagem ${message.id} destruída por falta de whatsappId`);
            continue;
          }

          // Verifica se o contato existe
          if (!message.contact.number) {
            await Message.destroy({ where: { id: message.id } });
            logger.info(`Mensagem ${message.id} destruída por falta de contato`);
            continue;
          }

          const wbot = getWbot(message.ticket.whatsappId);
          let quotedMsgSerializedId: string | undefined;

          const chatType = message.ticket.isGroup ? 'g' : 'c';
          const number = `${message.contact.number}@${chatType}.us`;

          // Processa mensagem quotada se existir
          if (message.quotedMsg) {
            const quotedMsg = await GetWbotMessage(message.ticket, message.quotedMsg.messageId);
            quotedMsgSerializedId = quotedMsg?.id?._serialized;
          }

          try {
            let sentMessage;

            // Envia mídia
            if (message.mediaType && message.mediaName && !message.isSticker) {
              const filePath = path.join(__dirname, '..', '..', 'public', tenantId);
              const mediaPath = path.join(filePath, message.mediaName);
              const media = MessageMedia.fromFilePath(mediaPath);
              
              sentMessage = await wbot.sendMessage(number, media, {
                quotedMessageId: quotedMsgSerializedId,
                linkPreview: false,
                sendAudioAsVoice: true
              });

            // Envia sticker  
            } else if (message.mediaType && message.mediaName && message.isSticker) {
              const filePath = path.join(__dirname, '..', '..', 'public', tenantId);
              const mediaPath = path.join(filePath, message.mediaName);
              const media = MessageMedia.fromFilePath(mediaPath);

              if (media.mimetype === 'image/jpeg' || 
                  media.mimetype === 'image/png' || 
                  media.mimetype === 'image/gif') {
                sentMessage = await wbot.sendMessage(number, media, {
                  quotedMessageId: quotedMsgSerializedId, 
                  linkPreview: false,
                  sendMediaAsSticker: true
                });
              } else {
                await Message.update(
                  { isDeleted: true },
                  { where: { id: message.id } }
                );
                logger.info('Arquivo inválido para sticker');
              }

            // Envia texto
            } else {
              sentMessage = await wbot.sendMessage(number, message.body, {
                quotedMessageId: quotedMsgSerializedId,
                linkPreview: false
              });
            }

            // Atualiza status da mensagem
            await Message.update(
              {
                messageId: sentMessage.id.id,
                status: 'sended',
                ack: 1
              },
              { where: { id: message.id } }
            );

            // Remove mensagem duplicada se existir
            await Message.destroy({
              where: { 
                messageId: sentMessage.id.id,
                id: { [Op.ne]: message.id }
              }
            });

            // Emite evento de mensagem enviada
            socketEmit({
              tenantId: message.tenantId,
              type: 'chat:ack',
              payload: message
            });

            logger.info('Mensagem enviada');
            logger.info('Message ID: ', sentMessage.id.id);

            // Fecha ticket se necessário
            if (message.ticket.status === 'pending') {
              const ticket = await Ticket.findOne({
                where: { id: message.ticket.id }
              });
              
              if (ticket) {
                await ticket.update({ status: 'closed' });
              }
            }

            await sleep(rndInt);

          } catch (error) {
            console.error(error);
            
            if (error.code === 'ENOENT') {
              await Message.destroy({ where: { id: message.id } });
            }

            logger.error(
              `Error ao enviar mensagem para ${message.contact.number} (Ticket: ${message.ticket.id})`
            );

            logger.error(
              `Mensagem: ${message.id} - Erro: ${error}`  
            );

            await Message.update(
              { status: 'pending' },
              { where: { id: message.id } }
            );
          }
        }
      }

    } finally {
      isProcessing = false;
    }
  }
}; 