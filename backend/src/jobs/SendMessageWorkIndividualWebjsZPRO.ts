import path from 'path';
import { MessageMedia } from 'whatsapp-web.js';
import { Op } from 'sequelize';
import Message from '../models/MessageZPRO';
import Ticket from '../models/TicketZPRO';
import Contact from '../models/ContactZPRO';
import { getWbot } from '../libs/wbotZPRO';
import GetWbotMessage from '../helpers/GetWbotMessageZPRO';
import socketEmit from '../helpers/socketEmitZPRO';
import logger from '../utils/loggerZPRO';

interface QueueProcessingData {
  messageId: string;
  status: string;
  ack: number;
}

const delay = (ms: number): Promise<void> => new Promise(resolve => setTimeout(resolve, ms));

const randomIntFromInterval = (min: number, max: number): number => {
  return Math.floor(Math.random() * (max - min + 1) + min);
};

const rndInt = randomIntFromInterval(1000, 3000);
let isProcessing = false;

export default {
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
              status: 'open'
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

      for (const message of messages) {
        // Validar ticket
        if (!message.ticket?.whatsappId) {
          await message.destroy();
          logger.info(`Mensagem ${message.id} removida: Ticket inválido`);
          continue;
        }

        // Validar contato
        if (!message.contact?.number) {
          await message.destroy();
          logger.info(`Mensagem ${message.id} removida: Contato inválido`);
          continue;
        }

        const wbot = getWbot(message.ticket.whatsappId);
        let quotedMsgId: string | undefined;

        // Processar mensagem citada
        if (message.quotedMsg) {
          const quotedMsg = await GetWbotMessage(message.ticket, message.quotedMsg.messageId);
          quotedMsgId = quotedMsg?.id?._serialized;
        }

        try {
          const chatId = `${message.contact.number}@${message.ticket.isGroup ? 'g' : 'c'}.us`;
          let sentMessage;

          // Enviar mídia
          if (message.mediaType === 'audio' && message.mediaName && !message.isSticker) {
            const filePath = path.join(__dirname, '..', '..', 'public', message.tenantId.toString());
            const mediaPath = path.join(filePath, message.mediaName);
            const media = MessageMedia.fromFilePath(mediaPath);
            
            sentMessage = await wbot.sendMessage(chatId, media, {
              quotedMessageId: quotedMsgId,
              sendAudioAsVoice: true,
              linkPreview: false
            });

            await delay(rndInt);
            logger.info('Mensagem de áudio enviada');

          } else if (message.mediaType === 'audio' && message.mediaName && message.isSticker) {
            const filePath = path.join(__dirname, '..', '..', 'public', message.tenantId.toString());
            const mediaPath = path.join(filePath, message.mediaName);
            const media = MessageMedia.fromFilePath(mediaPath);

            if (['image/jpeg', 'image/png', 'image/gif'].includes(media.mimetype)) {
              sentMessage = await wbot.sendMessage(chatId, media, {
                quotedMessageId: quotedMsgId,
                linkPreview: false,
                sendMediaAsSticker: true
              });

              await delay(rndInt);
              logger.info('Sticker enviado');
            } else {
              await Message.update(
                { isDeleted: true },
                { where: { id: message.id } }
              );
              logger.info('Formato de mídia inválido para sticker');
            }

          } else {
            // Enviar mensagem de texto
            sentMessage = await wbot.sendMessage(chatId, message.body, {
              quotedMessageId: quotedMsgId,
              linkPreview: false
            });

            await delay(rndInt);
            logger.info('Mensagem de texto enviada');
          }

          // Atualizar status da mensagem
          await Message.update(
            {
              messageId: sentMessage.id.id,
              status: 'sended',
              ack: 1
            },
            { where: { id: message.id } }
          );

          // Limpar mensagem duplicada se existir
          await Message.destroy({
            where: {
              messageId: sentMessage.id.id,
              id: { [Op.not]: message.id }
            }
          });

          // Emitir evento via socket
          socketEmit({
            tenantId: message.tenantId,
            type: 'chat:ack',
            payload: message
          });

          logger.info('Mensagem processada com sucesso');
          logger.info('MessageId: ', sentMessage.id.id);

          // Atualizar status do ticket se necessário
          if (message.ticket.status === 'pending') {
            await Ticket.update(
              { status: 'open' },
              { where: { id: message.ticket.id } }
            );
          }

        } catch (error) {
          console.error(error);
          
          if (error.code === 'ENOENT') {
            await message.destroy();
          }

          logger.error(`Error sending message (tenant: ${message.tenantId} | Ticket: ${message.ticket.id})`);
          logger.warn(`:::: ZDG :::: Z-PRO :::: Error send message id ${message.id}::`, error);

          await Message.update(
            { status: 'pending' },
            { where: { id: message.id } }
          );
        }
      }

    } finally {
      isProcessing = false;
    }
  }
}; 