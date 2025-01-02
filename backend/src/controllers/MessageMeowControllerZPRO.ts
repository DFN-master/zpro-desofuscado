import { Request, Response } from 'express';
import Contact from '../models/ContactZPRO';
import Ticket from '../models/TicketZPRO';
import { SendTextMessageService } from '../services/MessageServices/SendTextMessageServiceZPRO';
import Whatsapp from '../models/WhatsappZPRO';
import { SendMediaMessageService } from '../services/MessageServices/SendMediaMessageServiceZPRO';
import { logger } from '../utils/loggerZPRO';
import CreateMessageSystemService from '../services/CreateMessageSystemServiceZPRO';
import { SendReactionMessageService } from '../services/MessageServices/SendReactionMessageServiceZPRO';
import { SendEditionMessageService } from '../services/MessageServices/SendEditionMessageServiceZPRO';

interface SendMessageRequest {
  body: {
    scheduleDate?: string;
    body: string;
    quotedMsg: string;
    mediaUrl?: string;
    status?: string;
    sendType?: string;
    userId?: number;
    fromMe?: boolean;
  };
  files: any[];
  user: {
    tenantId: number;
    id: number;
  };
  params: {
    ticketId: number;
  };
}

interface ReactionRequest {
  body: {
    reaction: string;
    messageId: string;
    whatsapp: string;
  };
  user: {
    tenantId: number;
  };
  params: {
    ticketId: number;
  };
}

interface EditionRequest {
  body: {
    newText: string;
    messageId: string;
    whatsapp: string;
  };
  user: {
    tenantId: number;
  };
  params: {
    ticketId: number;
  };
}

export const send = async (req: SendMessageRequest, res: Response): Promise<Response> => {
  const { body: messageBody } = req.body;
  const { tenantId, id: userId } = req.user;
  const { ticketId } = req.params;
  const files = req.files;

  logger.info(':::ZDG ::: Z-PRO ::: Meow call message controller');

  const ticket = await Ticket.findByPk(ticketId, {
    include: [
      {
        model: Contact.default,
        as: "contact",
        include: [
          "extraInfo",
          "tags",
          {
            association: "wallets",
            attributes: ["id", "name"]
          }
        ]
      },
      {
        model: Whatsapp.default,
        as: "whatsapp",
        attributes: ["id", "name", "status"]
      }
    ]
  });

  if (!ticket) {
    return res.status(404).json({ message: "Ticket not found" });
  }

  if (!req.body.scheduleDate) {
    try {
      if (files) {
        await Promise.all(
          files.map(async file => {
            await SendMediaMessageService.execute(
              file,
              req.body.quotedMsg,
              req.body.fromMe,
              ticket.id,
              ticket.contact,
              ticket.whatsapp,
              tenantId,
              false
            );
          })
        );
      } else if (req.body.mediaUrl !== '') {
        await SendMediaMessageService.execute(
          req.body.mediaUrl,
          req.body.quotedMsg,
          req.body.fromMe,
          ticket.id,
          ticket.contact,
          ticket.whatsapp,
          tenantId,
          true
        );
      } else {
        await SendTextMessageService.execute(
          messageBody,
          req.body.quotedMsg,
          ticket.id,
          ticket.contact,
          ticket.whatsapp
        );
      }
      return res.status(200).json({ message: "Message sent" });
    } catch (err) {
      logger.error(`:::ZDG ::: Z-PRO ::: meow message: ${err}`);
      return res.status(500).json({ message: err });
    }
  } else {
    if (req.body.scheduleDate) {
      try {
        if (files) {
          await Promise.all(
            files.map(async file => {
              const messageData = {
                read: false,
                fromMe: true,
                body: file.filename
              };
              
              await CreateMessageSystemService.default({
                msg: messageData,
                tenantId,
                medias: files,
                ticket,
                userId,
                scheduleDate: req.body.scheduleDate,
                sendType: req.body.sendType || "text",
                status: "pending",
                isSticker: req.body.isSticker,
                fromMe: req.body.fromMe || false
              });
            })
          );
        } else {
          const messageData = {
            read: false,
            fromMe: true,
            body: messageBody
          };

          await CreateMessageSystemService.default({
            msg: messageData,
            tenantId,
            medias: files,
            ticket,
            userId,
            scheduleDate: req.body.scheduleDate,
            sendType: req.body.sendType || "text",
            status: "pending",
            isSticker: req.body.isSticker,
            fromMe: req.body.fromMe || false
          });
        }
        return res.status(200).json({ message: "Message sent" });
      } catch (err) {
        logger.error(`:::ZDG ::: Z-PRO ::: meow message: ${err}`);
        return res.status(500).json({ message: err });
      }
    }
  }
  return res.status(400).json({ message: "Brewx" });
};

export const reaction = async (req: ReactionRequest, res: Response): Promise<Response> => {
  const { tenantId } = req.user;
  const { reaction, messageId, whatsapp } = req.body;
  const { ticketId } = req.params;

  logger.info(':::ZDG ::: Z-PRO ::: Meow call reaction message controller');

  await SendReactionMessageService.execute(
    reaction,
    ticketId.toString(),
    messageId,
    whatsapp,
    tenantId
  );

  return res.status(200).json({ message: `Message: ${messageId}` });
};

export const edition = async (req: EditionRequest, res: Response): Promise<Response> => {
  const { tenantId } = req.user;
  const { newText, messageId, whatsapp } = req.body;
  const { ticketId } = req.params;

  logger.info(':::ZDG ::: Z-PRO ::: Meow call edition message controller');

  await SendEditionMessageService.execute(
    ticketId.toString(),
    messageId,
    newText,
    whatsapp,
    tenantId
  );

  return res.status(200).json({ message: `Message: ${messageId}` });
}; 