import { Op } from 'sequelize';
import fs from 'fs';
import path from 'path';
import mime from 'mime-types';

import WhatsappZPRO from '../models/WhatsappZPRO';
import { logger } from '../utils/loggerZPRO';
import MessageZPRO from '../models/MessageZPRO';
import TicketZPRO from '../models/TicketZPRO';
import SetTicketMessagesAsReadZPRO from '../services/WbotNotificameService/SetTicketMessagesAsReadZPRO';
import { SendTextMessageServiceNoCreateZPRO } from '../services/SendTextMessageServiceNoCreateZPRO';
import { SendMediaMessageServiceNoCreteZPRO } from '../services/SendMediaMessageServiceNoCreteZPRO';
import socketEmitZPRO from '../helpers/socketEmitZPRO';

interface MediaFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  destination: string;
  filename: string;
  path: string;
  size: number;
  buffer?: Buffer;
  stream?: fs.ReadStream;
}

function prepareMedia(filename: string, baseUrl: string, tenantId: string): MediaFile {
  const publicFolder = path.join(__dirname, '..', '..', 'public', tenantId);
  const filePath = path.join(publicFolder, filename);

  if (!fs.existsSync(filePath)) {
    throw new Error(`File not found: ${filePath}`);
  }

  const mimeType = mime.lookup(filePath);
  if (typeof mimeType !== 'string') {
    throw new Error(`Invalid mime type: ${mimeType}`);
  }

  const mediaType = mimeType.split('/')[0];

  const fileData: MediaFile = {
    fieldname: 'message',
    originalname: filename,
    encoding: '7bit',
    mimetype: mediaType,
    destination: `${baseUrl}/public/${tenantId}`,
    filename: filename,
    path: filePath,
    size: fs.statSync(filePath).size
  };

  return {
    ...fileData,
    buffer: Buffer.alloc(0),
    stream: fs.createReadStream(fileData.path)
  };
}

export default {
  async handle(): Promise<void> {
    try {
      logger.info('ZDG ::: Z-PRO ::: Executing SendHubMessages Initiated');

      try {
        const whatsapps = await WhatsappZPRO.findAll({
          where: {
            status: 'CONNECTED',
            isDefault: { [Op.like]: 'hub_%' }
          }
        });

        for (const whatsapp of whatsapps) {
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
                'medias',
                {
                  model: TicketZPRO,
                  as: 'ticket',
                  where: { tenantId: whatsapp.tenantId },
                  include: [
                    'contact',
                    {
                      model: WhatsappZPRO,
                      as: 'whatsapp',
                      where: { id: whatsapp.id }
                    }
                  ]
                },
                {
                  model: MessageZPRO,
                  as: 'quotedMsg',
                  include: ['medias']
                }
              ],
              order: [['createdAt', 'ASC']]
            });

            for (const message of messages) {
              const { ticket } = message;
              let sentMessage;

              try {
                if (message.mediaType === 'chat') {
                  sentMessage = await SendTextMessageServiceNoCreateZPRO(
                    message.body,
                    ticket.id,
                    ticket.status,
                    ticket.tenantId
                  );
                } else {
                  const baseUrl = `${process.env.BACKEND_URL}`;
                  const mediaPath = message.mediaUrl.split('/');
                  const filename = mediaPath[mediaPath.length - 1];
                  const media = prepareMedia(filename, baseUrl, ticket.tenantId.toString());

                  sentMessage = await SendMediaMessageServiceNoCreteZPRO(
                    media,
                    message.body,
                    ticket.id, 
                    ticket.status,
                    ticket.tenantId
                  );
                }

                await MessageZPRO.update(
                  {
                    messageId: sentMessage.id,
                    status: 'sended',
                    ack: 2,
                    mediaUrl: message.mediaUrl,
                    mediaType: message.mediaType
                  },
                  { where: { id: message.id } }
                );

                const messageToSocket = await MessageZPRO.findOne({
                  where: { id: message.id }
                });

                if (!messageToSocket) return;

                socketEmitZPRO({
                  tenantId: whatsapp.tenantId,
                  type: 'chat:ack',
                  payload: messageToSocket
                });

                if (message.ticket.status === 'closed') {
                  const ticketToUpdate = await TicketZPRO.findOne({
                    where: { id: message.ticket.id }
                  });

                  if (!ticketToUpdate) return;

                  await ticketToUpdate.update({ status: 'pending' });
                }

              } catch (error) {
                logger.info('Error send Message error: ' + error);
              }

              logger.info('ZDG ::: Z-PRO ::: HubMetaSystem: Message ok');
              await SetTicketMessagesAsReadZPRO(ticket);
            }

          } catch (err) {
            logger.error('ZDG ::: Z-PRO ::: Error executing SendHubMessages error ' + err);
          }
        }

      } catch (error) {
        logger.error({
          message: 'Error executing SendHubMessages',
          error: error
        });
      }

      logger.info('ZDG ::: Z-PRO ::: Finalized SendHubMessages');

    } catch (error) {
      logger.error({
        message: 'Error executing SendHubMessages',
        error: error
      });
      throw new Error(error);
    }
  }
}; 