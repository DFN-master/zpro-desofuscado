import { Request, Response } from 'express';
import Contact from '../models/ContactZPRO';
import Ticket from '../models/TicketZPRO';
import { sendTextMessage } from '../services/SendTextMessageServiceZPRO';
import Whatsapp from '../models/WhatsappZPRO';
import { sendMediaMessage } from '../services/SendMediaMessageServiceZPRO';
import { logger } from '../utils/loggerZPRO';
import createMessageSystem from '../services/CreateMessageSystemServiceZPRO';

interface MessageBody {
  body: string;
  scheduleDate?: Date;
  sendType?: string;
  status?: string;
  fromMe?: boolean;
  extraInfo?: any;
}

interface MessageRequest extends Request {
  params: {
    ticketId: number;
  };
  body: MessageBody;
  files?: Express.Multer.File[];
  user: {
    tenantId: number;
    id: number;
  };
}

export const send = async (req: MessageRequest, res: Response): Promise<Response> => {
  const { body } = req.body;
  const { tenantId, id: userId } = req.user;
  const { ticketId } = req.params;
  const files = req.files;

  logger.info(':::ZDG ::: Z-PRO Message Hub call');

  const ticket = await Ticket.findByPk(ticketId, {
    include: [
      {
        model: Contact,
        as: 'contact',
        include: [
          'extraInfo',
          'tags',
          {
            association: 'wallets',
            attributes: ['id', 'name']
          }
        ]
      },
      {
        model: Whatsapp,
        as: 'whatsapp',
        attributes: ['id', 'name', 'status']
      }
    ]
  });

  if (!ticket) {
    return res.status(404).json({ error: 'Ticket not found' });
  }

  try {
    if (!req.body.scheduleDate) {
      if (files) {
        await Promise.all(
          files.map(async file => {
            await sendMediaMessage(file, body, ticket.id, ticket.contact, ticket.whatsapp);
          })
        );
      } else {
        await sendTextMessage(body, ticket.id, ticket.contact, ticket.whatsapp);
      }

      return res.status(200).json({ message: 'Message sent' });
    } else {
      if (files) {
        await Promise.all(
          files.map(async file => {
            const messageData = {
              body: {
                fromMe: false,
                pending: true,
                message: file.filename
              },
              tenantId,
              medias: files,
              ticket,
              userId,
              scheduleDate: req.body.scheduleDate,
              sendType: req.body.sendType || 'text',
              status: 'pending',
              extraInfo: req.body.extraInfo,
              fromMe: req.body.fromMe || false
            };
            await createMessageSystem(messageData);
          })
        );
      } else {
        const messageData = {
          body: {
            fromMe: false,
            pending: true,
            message: body
          },
          tenantId,
          medias: files,
          ticket,
          userId,
          scheduleDate: req.body.scheduleDate,
          sendType: req.body.sendType || 'text',
          status: 'pending',
          extraInfo: req.body.extraInfo,
          fromMe: req.body.fromMe || false
        };
        await createMessageSystem(messageData);
      }

      return res.status(200).json({ message: 'Message sent' });
    }
  } catch (err) {
    logger.error(':::ZDG ::: Z-PRO hub message controller: e ' + err);
    return res.status(500).json({ error: err });
  }

  return res.status(200).json({ message: 'Message scheduled' });
}; 