import { Op } from 'sequelize';
import Whatsapp from '../models/WhatsappZPRO';
import { logger } from '../utils/loggerZPRO';
import Message from '../models/MessageZPRO';
import Ticket from '../models/TicketZPRO';
import SetTicketMessagesAsRead from '../helpers/SetTicketMessagesAsReadZPRO';
import socketEmit from '../helpers/socketEmitZPRO';
import { SendTextMessageService } from '../services/WbotMeowServices/SendTextMessageServiceNoCreateZPRO';
import { SendMediaMessageService } from '../services/WbotMeowServices/SendMediaMessageServiceNoCreateZPRO';

interface QueueJobData {
  messageData: Message;
  ticketId: number;
  tenantId: number;
  whatsappId: number;
}

export default {
  async handle(): Promise<void> {
    try {
      logger.info(":::: ZDG :::: Z-PRO :::: Send Meow Messages Initiated");

      try {
        const whereCondition = {
          [Op.or]: [{
            [Op.and]: {
              type: { [Op.in]: ["whatsapp"] },
              status: { [Op.notIn]: ["DISCONNECTED"] }
            }
          }]
        };

        const findOptions = {
          where: {
            ...whereCondition,
            isActive: true
          }
        };

        const whatsapps = await Whatsapp.findAll(findOptions);
        const validWhatsapps = whatsapps.filter(wa => wa.status === "CONNECTED");

        for (const whatsapp of validWhatsapps) {
          try {
            const messageWhere = {
              messageId: { [Op.is]: null },
              status: "pending",
              isDeleted: { [Op.is]: false },
              [Op.or]: [
                { scheduleDate: { [Op.lte]: new Date() } },
                { scheduleDate: { [Op.is]: null } }
              ]
            };

            const messageInclude = [
              "contact",
              {
                model: Ticket,
                as: "ticket",
                where: {
                  tenantId: whatsapp.tenantId,
                  channel: "whatsapp"
                },
                include: [
                  "contact",
                  {
                    model: Whatsapp,
                    as: "whatsapp",
                    where: {
                      id: whatsapp.id,
                      type: "whatsapp"
                    }
                  }
                ]
              },
              {
                model: Message,
                as: "quotedMsg",
                include: ["contact"]
              }
            ];

            const messages = await Message.findAll({
              where: messageWhere,
              include: messageInclude,
              order: [["createdAt", "ASC"]]
            });

            // Process each message
            for (const message of messages) {
              const { ticket } = message;

              try {
                if (["chat", "text"].includes(message.mediaType) || !message.mediaUrl) {
                  await SendTextMessageService(
                    message.body,
                    ticket.id,
                    ticket.contact,
                    ticket.whatsapp
                  );
                } else {
                  await SendMediaMessageService(
                    message,
                    ticket.id,
                    ticket.contact,
                    ticket.whatsapp
                  );
                }

                // Update message status
                await this.handleMessageSuccess(message, whatsapp, ticket);

              } catch (error) {
                await message.update({ isDeleted: true });
                logger.info(`Error send message: ${error}`);
              }

              logger.info(":::: ZDG :::: Z-PRO :::: Meow Update ok");
              await SetTicketMessagesAsRead(ticket);
            }

          } catch (err) {
            logger.warn(
              ":::: ZDG :::: Z-PRO :::: Error executing SendMeowMessages System: " + err
            );
          }
        }

      } catch (err) {
        logger.error({
          message: "Error executing SendMeowMessages",
          error: err
        });
      }

      logger.info(":::: ZDG :::: Z-PRO :::: MeowMeta Messages ok");

    } catch (err) {
      logger.error({
        message: "Error executing SendMeowMessages",
        error: err
      });
      throw new Error(err);
    }
  },

  private async handleMessageSuccess(
    message: Message,
    whatsapp: Whatsapp,
    ticket: Ticket
  ): Promise<void> {
    try {
      const messageData = {
        ...message,
        id: message.id,
        status: "sended",
        ack: 2,
        contactId: message.contactId,
        sendType: message.sendType
      };

      await Message.update(messageData, {
        where: { id: message.id }
      });

      const updatedMessage = await Message.findOne({
        where: { id: message.id },
        include: [{
          model: Ticket,
          as: "ticket",
          include: ["contact", "whatsapp"],
          where: { tenantId: whatsapp.tenantId }
        }]
      });

      if (!updatedMessage) return;

      socketEmit({
        tenantId: whatsapp.tenantId,
        type: "chat:ack",
        payload: updatedMessage
      });

      if (ticket.status === "pending") {
        const ticketUpdate = await Ticket.findOne({
          where: { id: ticket.id }
        });

        if (!ticketUpdate) return;

        await ticketUpdate.update({ status: "closed" });
      }

    } catch (err) {
      logger.info("Error updating message status: " + err);
    }
  }
}; 