import { Request, Response } from 'express';
import { Op } from 'sequelize';
import AppError from '../errors/AppErrorZPRO';
import DeleteMessageSystem from '../helpers/DeleteMessageSystemZPRO';
import SetTicketMessagesAsRead from '../helpers/SetTicketMessagesAsReadZPRO';
import Message from '../models/MessageZPRO';
import CreateForwardMessageService from '../services/MessageServices/CreateForwardMessageServiceZPRO';
import CreateMessageSystemService from '../services/MessageServices/CreateMessageSystemServiceZPRO';
import UpdateMessageService from '../services/MessageServices/UpdateMessageServiceZPRO';
import ListMessagesService from '../services/MessageServices/ListMessagesServiceZPRO';
import ListScheduleMessagesService from '../services/MessageServices/ListScheduleMessagesServiceZPRO';
import ShowTicketService from '../services/TicketServices/ShowTicketServiceZPRO';
import { logger } from '../utils/loggerZPRO';
import SendWhatsAppGhostMessage from '../services/WbotServices/SendWhatsAppGhostMessageZPRO';
import SendWhatsAppMentionMessage from '../services/WbotServices/SendWhatsAppMentionMessageZPRO';
import SendWhatsAppMentionAllMessage from '../services/WbotServices/SendWhatsAppMentionAllMessageZPRO';
import ListWhatsAppParticipants from '../services/WbotServices/ListWhatsAppParticipantsZPRO';
import SyncOldMessagesWbot from '../services/WbotServices/SyncOldMessagesWbotZPRO';
import SyncOldMessagesByUserWbot from '../services/WbotServices/SyncOldMessagesByUserWbotZPRO';
import SendWhatsAppReaction from '../services/WbotServices/SendWhatsAppReactionZPRO';
import socketEmit from '../helpers/socketEmitZPRO';
import SendWhatsAppEdition from '../services/WbotServices/SendWhatsAppEditionZPRO';
import CreateTicketService from '../services/TicketServices/CreateTicketServiceZPRO';
import { convertMpegToMp4 } from '../helpers/ConvertMpegToMp4ZPRO';
import ListWhatsAppParticipantsBaileys from '../services/BaileysServices/ListWhatsAppParticipantsZPRO';
import SendWhatsAppMentionMessageBaileys from '../services/BaileysServices/SendWhatsAppMentionMessageZPRO';
import SendWhatsAppGhostMessageBaileys from '../services/BaileysServices/SendWhatsAppGhostMessageZPRO';
import SendMessageBirthday from '../services/WbotServices/SendMessageBirthdayZPRO';

interface StoreReactionRequest {
  user: {
    tenantId: number;
  };
  body: {
    messageId: string;
    ticketId: number;
    reaction: string;
  };
}

export const storeReaction = async (req: Request, res: Response): Promise<Response> => {
  const { tenantId } = req.user;
  const { messageId, ticketId, reaction } = req.body;

  const ticket = await ShowTicketService({ 
    id: ticketId,
    tenantId 
  });

  try {
    const message = await Message.findOne({
      where: {
        id: messageId,
        tenantId
      }
    });

    if (message) {
      await message.update({
        reactionFront: reaction
      });

      socketEmit({
        tenantId,
        type: "chat:ack",
        payload: message
      });
    }

  } catch (err) {
    console.error(err);
  }

  try {
    const messageReaction = await SendWhatsAppReaction({
      messageId,
      ticket: ticket,
      reaction
    });

    return res.json({
      status: "Reação enviada com sucesso",
      reaction: messageReaction
    });

  } catch (err) {
    logger.error(err);
    throw new AppError("ERR_SENDING_WAPP_REACTION_MSG");
  }
};

interface StoreEditionRequest {
  user: {
    tenantId: number;
    id: string;
  };
  body: {
    messageId: string;
    ticketId: number;
    body: string;
    newBody: string;
  };
}

export const storeEdition = async (req: Request, res: Response): Promise<Response> => {
  const { tenantId } = req.user;
  const { messageId, ticketId, body, newBody } = req.body;

  const ticket = await ShowTicketService({ 
    id: ticketId,
    tenantId 
  });

  try {
    const message = await Message.findOne({
      where: {
        id: messageId,
        tenantId
      }
    });

    if (message) {
      await message.update({
        body: req.body.newBody
      });

      socketEmit({
        tenantId,
        type: "chat:ack",
        payload: message
      });
    }

  } catch (err) {
    console.error(err);
  }

  try {
    const messageEdition = await SendWhatsAppEdition({
      messageId,
      ticket,
      body,
      newBody
    });

    return res.json({
      status: "Edição enviada com sucesso",
      edition: messageEdition
    });

  } catch (err) {
    logger.error(err);
    throw new AppError("ERR_SENDING_WAPP_EDITION_MSG");
  }
};

interface StoreMentionRequest {
  user: {
    tenantId: number;
  };
  body: {
    channel: string;
    body: string;
    ticket: any; // Definir interface do ticket
    whatsappId: string;
    participants: string[];
  };
}

export const storeMention = async (req: Request, res: Response): Promise<Response> => {
  const { channel, body, ticket, whatsappId, participants } = req.body;
  const { tenantId } = req.user;

  try {
    let mentionMessage;

    if (channel === "baileys") {
      mentionMessage = await SendWhatsAppMentionMessageBaileys({
        body,
        ticket,
        whatsappId,
        participants,
        tenantId: +tenantId
      });
    } else {
      mentionMessage = await SendWhatsAppMentionMessage({
        body,
        ticket,
        whatsappId,
        participants
      });
    }

    return res.json({
      status: "Mensagem enviada com sucesso",
      message: mentionMessage
    });

  } catch (err) {
    logger.error(err);
    throw new AppError("ERR_SENDING_MENTION_WAPP_MSG");
  }
};

interface StoreMentionAllRequest {
  user: {
    tenantId: number;
  };
  body: {
    body: string;
    ticket: any; // Definir interface do ticket
    whatsappId: string;
  };
}

export const storeMentionAll = async (req: Request, res: Response): Promise<Response> => {
  const { body, ticket, whatsappId } = req.body;

  try {
    const mentionAllMessage = await SendWhatsAppMentionAllMessage({
      body,
      ticket,
      whatsappId
    });

    return res.json({
      status: "Mensagem enviada com sucesso",
      message: mentionAllMessage
    });

  } catch (err) {
    logger.error(err);
    throw new AppError("ERR_SENDING_MENTION_ALL_WAPP_MSG");
  }
};

interface StoreGhostRequest {
  user: {
    tenantId: number;
  };
  body: {
    channel: string;
    body: string;
    ticket: any; // Definir interface do ticket
    whatsappId: string;
  };
}

export const storeGhost = async (req: Request, res: Response): Promise<Response> => {
  const { channel, body, ticket, whatsappId } = req.body;

  try {
    let ghostMessage;

    if (channel === "baileys") {
      ghostMessage = await SendWhatsAppGhostMessageBaileys({
        body,
        ticket,
        whatsappId
      });
    } else {
      ghostMessage = await SendWhatsAppGhostMessage({
        body,
        ticket,
        whatsappId
      });
    }

    return res.json({
      status: "Mensagem enviada com sucesso",
      message: ghostMessage
    });

  } catch (err) {
    logger.error(err);
    throw new AppError("ERR_SENDING_GHOST_WAPP_MSG");
  }
};

interface ListParticipantsRequest {
  user: {
    tenantId: number;
  };
  body: {
    channel: string;
    ticket: any; // Definir interface do ticket
    whatsappId: string;
  };
}

export const listParticipants = async (req: Request, res: Response): Promise<Response> => {
  const { channel, ticket, whatsappId } = req.body;
  const { tenantId } = req.user;

  try {
    let participants: any[] = [];

    if (channel === "baileys") {
      participants = await ListWhatsAppParticipantsBaileys({
        ticket,
        whatsappId
      });

      const formattedParticipants = [];
      for (const participant of participants) {
        if (participant.id.includes("c.us")) {
          formattedParticipants.push({
            number: participant.id,
            name: participant.id
          });
        }
      }

      return res.json({ participants: formattedParticipants });

    } else {
      participants = await ListWhatsAppParticipants({
        ticket,
        whatsappId
      });

      const formattedParticipants = [];
      for (const participant of participants) {
        if (participant.id.server.includes("c.us")) {
          formattedParticipants.push({
            number: participant.id.user,
            name: participant.id.user
          });
        }
      }

      return res.json({ participants: formattedParticipants });
    }

  } catch (err) {
    return res.status(500).json({
      error: "Permissão de listagem negada"
    });
  }
};

interface IndexRequest {
  params: {
    ticketId: number;
  };
  query: {
    pageNumber: number;
  };
  user: {
    tenantId: number;
  };
}

export const index = async (req: Request, res: Response): Promise<Response> => {
  const { ticketId } = req.params;
  const { pageNumber } = req.query;
  const { tenantId } = req.user;

  const { count, messages, messagesOffLine, ticket, hasMore } = await ListMessagesService({
    pageNumber: pageNumber as number,
    ticketId,
    tenantId
  });

  SetTicketMessagesAsRead(ticket);

  return res.json({
    count,
    messages,
    messagesOffLine,
    ticket,
    hasMore
  });
};

interface IndexScheduleRequest {
  user: {
    tenantId: number;
  };
}

export const indexSchedule = async (req: Request, res: Response): Promise<Response> => {
  const { tenantId } = req.user;

  const scheduleMessages = await ListScheduleMessagesService({
    tenantId
  });

  return res.json(scheduleMessages);
};

interface StoreBirthdayRequest {
  body: {
    whatsapp: any; // Definir interface do whatsapp
  };
}

export const storeBirthday = async (req: Request, res: Response): Promise<Response> => {
  const { whatsapp } = req.body;

  await SendMessageBirthday(whatsapp);
  return res.send();
};

interface Store0Request {
  body: {
    whatsappId: string;
    limit: number;
    tenantId: number;
  };
}

export const store0 = async (req: Request, res: Response): Promise<Response> => {
  const { whatsappId, limit, tenantId } = req.body;

  await SyncOldMessagesWbot(whatsappId, tenantId, limit);
  return res.send();
};

interface Store1Request {
  body: {
    whatsappId: string;
    limit: number;
    tenantId: number;
    contactId: string;
  };
}

export const store1 = async (req: Request, res: Response): Promise<Response> => {
  const { whatsappId, limit, tenantId, contactId } = req.body;

  await SyncOldMessagesByUserWbot(whatsappId, tenantId, limit, contactId);
  return res.send();
};

interface StoreScheduleRequest {
  user: {
    tenantId: number;
    id: string;
  };
  body: any;
  files: any[];
}

export const storeSchedule = async (req: Request, res: Response): Promise<Response> => {
  const { tenantId, id } = req.user;
  const payload = req.body;
  const { contactId, channel, channelId } = req.body;
  const files = req.files;

  const ticket = await CreateTicketService({
    contactId,
    status: "pending",
    userId: parseInt(id),
    tenantId,
    channel,
    channelId
  });

  try {
    await CreateMessageSystemService({
      msg: payload,
      tenantId,
      medias: files,
      ticket,
      userId: id,
      scheduleDate: payload.scheduleDate,
      sendType: payload.sendType || "text",
      status: "pending",
      isScheduled: payload.isScheduled,
      isDeleted: payload.isDeleted || false
    });
  } catch (err) {
    logger.error(":::: Z-PRO :::: try Create Message System Service", err);
  }

  return res.send();
};

interface StoreRequest {
  params: {
    ticketId: number;
  };
  user: {
    tenantId: number;
    id: string;
  };
  body: any;
  files: any[];
}

export const store = async (req: Request, res: Response): Promise<Response> => {
  const { ticketId } = req.params;
  const { tenantId, id } = req.user;
  const payload = req.body;
  const files = req.files;

  const ticket = await ShowTicketService({
    id: ticketId,
    tenantId
  });

  try {
    SetTicketMessagesAsRead(ticket);
  } catch (err) {
    logger.error(":::: Z-PRO :::: try SetTicketMessagesAsRead", err);
  }

  if (files && files.length > 0) {
    for (const file of files) {
      if (file.mimetype === "video/mpeg") {
        const originalFilePath = file.path;
        const newFilePath = file.destination + "/" + file.filename.split(".")[0] + ".mp4";

        try {
          await convertMpegToMp4(originalFilePath, newFilePath);
          file.path = newFilePath;
          file.filename = newFilePath.split("/").pop() ?? "default.mp4";
          file.mimetype = "video/mp4";
        } catch (err) {
          logger.error(":::: Z-PRO :::: Error converting MPEG to MP4", err);
        }
      }
    }
  }

  try {
    await CreateMessageSystemService({
      msg: payload,
      tenantId,
      medias: files,
      ticket,
      userId: id,
      scheduleDate: payload.scheduleDate,
      sendType: payload.sendType || "text",
      status: "pending",
      isScheduled: payload.isScheduled,
      isDeleted: payload.isDeleted || false
    });
  } catch (err) {
    logger.error(":::: Z-PRO :::: try Create Message System Service", err);
  }

  return res.send();
};

interface RemoveRequest {
  user: {
    tenantId: number;
  };
  body: {
    id: number;
    messageId: string;
  };
}

export const remove = async (req: Request, res: Response): Promise<Response> => {
  const { tenantId } = req.user;

  try {
    await DeleteMessageSystem(req.body.id, req.body.messageId, tenantId);
  } catch (err) {
    logger.error(":::: Z-PRO :::: try Delete Message System :::", err);
    throw new AppError("ERR_DELETE_SYSTEM_MSG");
  }

  return res.send();
};

interface ForwardRequest {
  user: {
    id: string;
    tenantId: number;
  };
  body: {
    messages: any[];
    forward: any;
  };
}

export const forward = async (req: Request, res: Response): Promise<Response> => {
  const payload = req.body;
  const { user } = req;

  for (const message of payload.messages) {
    await CreateForwardMessageService({
      userId: user.id,
      tenantId: user.tenantId,
      message: message,
      forward: payload.forward,
      ticketIdOrigin: message.ticketId,
      contact: payload.messages[0].ticket.contact
    });
  }

  return res.send();
};

interface UpdateRequest {
  params: {
    id: string;
  };
  user: {
    tenantId: number;
  };
  files: any[];
  body: any;
}

export const update = async (req: Request, res: Response): Promise<Response> => {
  const { id } = req.params;
  const { tenantId } = req.user;
  const files = req.files;
  const messageData = req.body;

  try {
    const message = await UpdateMessageService({
      msg: messageData,
      tenantId,
      medias: files,
      sendType: messageData.sendType || "text",
      messageId: id
    });

    return res.json(message);
  } catch (err) {
    logger.error(":::: Z-PRO :::: try Create Message System Service", err);
  }

  return res.send();
};

interface ResolvePendingRequest {
  user: {
    tenantId: number;
  };
}

export const resolvePending = async (req: Request, res: Response): Promise<Response> => {
  const { tenantId } = req.user;

  try {
    if (!tenantId || typeof tenantId !== "number") {
      logger.error(":::: Z-PRO :::: Invalid tenantId:", tenantId);
      return res.status(400).json({
        error: ":::: Z-PRO :::: Invalid tenantId"
      });
    }

    const messages = await Message.findAll({
      where: {
        tenantId,
        status: "pending",
        [Op.or]: [
          { scheduleDate: { [Op.lte]: new Date() } },
          { scheduleDate: { [Op.is]: null } }
        ]
      }
    });

    for (const message of messages) {
      await message.update({
        status: "scheduled",
        isDeleted: true
      });

      const updatedMessage = await Message.findOne({
        where: { id: message.id }
      });

      if (updatedMessage) {
        socketEmit({
          tenantId: message.tenantId,
          type: "chat:ack",
          payload: updatedMessage
        });
      }
    }

    return res.json(messages);

  } catch (err) {
    logger.error(":::: Z-PRO :::: try Resolve Pending Messages", err);
    return res.status(500).json({
      error: "Internal Server Error"
    });
  }
}; 