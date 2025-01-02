import { Op } from 'sequelize';
import WhatsappZPRO from '../models/WhatsappZPRO';
import { logger } from '../utils/loggerZPRO';
import MessageZPRO from '../models/MessageZPRO';
import TicketZPRO from '../models/TicketZPRO';
import SetTicketMessagesAsReadZPRO from '../helpers/SetTicketMessagesAsReadZPRO';
import socketEmitZPRO from '../helpers/socketEmitZPRO';

import SendWABAMetaTextServiceZPRO from '../services/WABAMeta/SendWABAMetaTextServiceZPRO';
import SendWABAMetaImageServiceZPRO from '../services/WABAMeta/SendWABAMetaImageServiceZPRO';
import SendWABAMetaVideoServiceZPRO from '../services/WABAMeta/SendWABAMetaVideoServiceZPRO';
import SendWABAMetaAudioServiceZPRO from '../services/WABAMeta/SendWABAMetaAudioServiceZPRO';
import SendWABAMetaDocServiceZPRO from '../services/WABAMeta/SendWABAMetaDocServiceZPRO';
import SendWABAMetaButtonServiceZPRO from '../services/WABAMeta/SendWABAMetaButtonServiceZPRO';
import SendWABAMetaTemplateTextServiceZPRO from '../services/WABAMeta/SendWABAMetaTemplateTextServiceZPRO';

interface MessageData {
  id: number;
  body: string;
  mediaUrl?: string;
  status: string;
  scheduleDate?: Date;
  isDeleted: boolean;
  ticket: any; // Definir interface apropriada para Ticket
  tenantId: number;
  quotedMsg?: any;
  contact: any; // Definir interface apropriada para Contact
  type: string;
  templateName?: string;
  templateLanguage?: string;
}

const sendMessageService = new SendWABAMetaTextServiceZPRO();
const sendImageService = new SendWABAMetaImageServiceZPRO();
const sendVideoService = new SendWABAMetaVideoServiceZPRO();
const sendAudioService = new SendWABAMetaAudioServiceZPRO();
const sendDocService = new SendWABAMetaDocServiceZPRO();
const sendButtonService = new SendWABAMetaButtonServiceZPRO();
const sendTemplateService = new SendWABAMetaTemplateTextServiceZPRO();

export default {
  async handle(): Promise<void> {
    try {
      logger.info(':::: Z-PRO :::: SendWabaMessages System: Messages Initiated');

      try {
        const whatsapps = await WhatsappZPRO.findAll({
          where: {
            [Op.or]: [{
              type: { [Op.in]: ['waba'] },
              status: { [Op.notIn]: ['DISCONNECTED'] }
            }]
          },
          isActive: true
        });

        const wabaInstances = whatsapps.filter(whatsapp => whatsapp.type === 'waba');

        for (const whatsapp of wabaInstances) {
          try {
            const messages = await MessageZPRO.findAll({
              where: {
                messageId: { [Op.is]: null },
                status: 'pending',
                isDeleted: { [Op.is]: false },
                [Op.or]: [
                  { scheduleDate: { [Op.lte]: new Date() } },
                  { scheduleDate: { [Op.is]: null } }
                ]
              },
              include: [
                'contact',
                {
                  model: TicketZPRO,
                  as: 'ticket',
                  where: {
                    tenantId: whatsapp.tenantId,
                    channel: 'waba'
                  },
                  include: [
                    'contact',
                    {
                      model: WhatsappZPRO,
                      as: 'whatsapp',
                      where: {
                        id: whatsapp.id,
                        type: 'waba',
                        wabaBSP: '360'
                      }
                    }
                  ]
                },
                {
                  model: MessageZPRO,
                  as: 'quotedMsg',
                  include: ['contact']
                }
              ],
              order: [['createdAt', 'ASC']]
            });

            for (const message of messages) {
              const { ticket } = message;

              try {
                // Processar mensagem baseado no tipo
                await this.processMessage(message, whatsapp, ticket);

                // Atualizar status da mensagem
                await this.updateMessageStatus(message);

                // Emitir evento de socket
                await this.emitSocketEvent(message, whatsapp);

                // Atualizar ticket se necessário
                if (message.ticket.status === 'closed') {
                  await this.updateTicketStatus(message.ticket);
                }

              } catch (err) {
                await message.update({ isDeleted: true });
                logger.info(`Error sending WABA Meta message: ${err}`);
              }

              logger.info(':::: ZDG :::: WABA Update ok');
              await SetTicketMessagesAsReadZPRO(ticket);
            }

          } catch (err) {
            logger.warn(':::: Z-PRO :::: Error executing SendWabaMessages:', err);
          }
        }

      } catch (err) {
        logger.error({
          message: 'Error send SendWabaMessages',
          error: err
        });
      }

      logger.info(':::: Z-PRO :::: Finalize SendWaba Messages');

    } catch (err) {
      logger.error({
        message: 'Error executing SendWabaMessages System:',
        error: err
      });
      throw new Error(err);
    }
  }
}; 