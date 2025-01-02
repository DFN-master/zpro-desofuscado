import { Request, Response } from 'express';
import { Op } from 'sequelize';
import { io } from '../libs/socket';
import Message from '../models/Message';
import CreateLogTicketService from '../services/TicketServices/CreateLogTicketService';
import CreateTicketService from '../services/TicketServices/CreateTicketService';
import DeleteTicketService from '../services/TicketServices/DeleteTicketService';
import ListTicketsService from '../services/TicketServices/ListTicketsService';
import ShowLogTicketService from '../services/TicketServices/ShowLogTicketService';
import ShowTicketService from '../services/TicketServices/ShowTicketService';
import UpdateTicketService from '../services/TicketServices/UpdateTicketService';
import CleanChatGptHistoryTicketService from '../services/TicketServices/CleanChatGptHistoryTicketService';
import SendWABAMetaTextService from '../services/WABAMetaServices/SendWABAMetaTextService';
import { v4 as uuidv4 } from 'uuid';
import Whatsapp from '../models/Whatsapp';
import CreateMessageSystemService from '../services/MessageServices/CreateMessageSystemService';
import { pupa } from '../utils/pupa';
import socketEmit from '../helpers/socketEmit';
import Ticket from '../models/Ticket';
import UpdateChannelTicketService from '../services/TicketServices/UpdateChannelTicketService';
import UpdateChatbotTicketService from '../services/TicketServices/UpdateChatbotTicketService';
import { SendTextMessageService } from '../services/WbotServices/SendTextMessageService';
import { SendTextMessageService as SendTextMessageServiceMeow } from '../services/WbotMeowServices/SendTextMessageService';
import UpdateChannelIdTicketService from '../services/TicketServices/UpdateChannelIdTicketService';

interface TicketData {
  contactId: number;
  status: string;
  userId: number;
  channel?: string;
  channelId?: number;
  tenantId: number;
}

interface TicketFilter {
  searchParam?: string;
  pageNumber?: number;
  status?: string;
  date?: string;
  showAll?: boolean;
  withUnreadMessages?: boolean;
  queuesIds?: number[];
  isNotAssignedUser?: boolean;
  includeNotQueueDefined?: boolean;
  tenantId: number;
  profile?: string;
}

export const index = async (req: Request, res: Response): Promise<Response> => {
  const { tenantId, profile } = req.user;
  const {
    searchParam,
    pageNumber,
    status,
    date,
    showAll,
    withUnreadMessages,
    queuesIds,
    isNotAssignedUser,
    includeNotQueueDefined
  } = req.query;

  const userId = req.user.id;

  const tickets = await ListTicketsService.execute({
    searchParam: searchParam as string,
    pageNumber: pageNumber as string,
    status: status as string,
    date: date as string,
    showAll: showAll as boolean,
    userId,
    withUnreadMessages: withUnreadMessages as boolean,
    queuesIds: queuesIds as number[],
    isNotAssignedUser: isNotAssignedUser as boolean,
    includeNotQueueDefined: includeNotQueueDefined as boolean,
    tenantId,
    profile
  });

  if (!tickets) {
    return res.status(200).json({ tickets: [], count: 0, hasMore: false });
  }

  const { tickets: ticketList, count, hasMore } = tickets;

  const ticketsMapped = ticketList.map(ticket => {
    const { chatGptHistory, chatgptPrompt, ...ticketData } = ticket;
    return ticketData;
  });

  return res.status(200).json({
    tickets: ticketsMapped,
    count,
    hasMore
  });
};

export const clear = async (req: Request, res: Response): Promise<Response> => {
  const { tenantId } = req.user;
  
  const cleanedTicket = await CleanChatGptHistoryTicketService.execute({
    tenantId
  });

  return res.status(200).json(cleanedTicket);
};

export const store = async (req: Request, res: Response): Promise<Response> => {
  const { tenantId } = req.user;
  const {
    contactId,
    status,
    userId,
    channel,
    channelId
  } = req.body;

  const ticket = await CreateTicketService.execute({
    contactId,
    status,
    userId,
    tenantId,
    channel,
    channelId
  });

  if (!userId) {
    const socket = io();
    socket.to(`${tenantId}:${ticket.status}`).emit(`${tenantId}:ticket`, {
      action: "create",
      ticket
    });
  }

  await socketEmit({
    tenantId,
    type: "ticket:update",
    payload: ticket,
    userId: req.user.id,
    sendType: "bot",
    status: "pending",
    isTransference: false,
    isFromMe: false
  });

  return res.status(200).json(ticket);
};

export const show = async (req: Request, res: Response): Promise<Response> => {
  const { ticketId } = req.params;
  const { tenantId } = req.user;
  const userId = req.user.id;

  const ticket = await ShowTicketService.execute({
    id: ticketId,
    tenantId
  });

  const unreadMessages = await Message.findAll({
    where: {
      contactId: ticket.contactId,
      fromMe: { [Op.not]: null },
      status: "pending"
    }
  });

  await ticket.update({ unreadMessages });

  await CreateLogTicketService.execute({
    tenantId,
    userId,
    ticketId,
    type: "access"
  });

  return res.status(200).json(ticket);
};

interface UpdateTicketData {
  ticketData: {
    status?: string;
    queueId?: number;
    userId?: number;
    whatsappId?: number;
    chatbot?: boolean;
    queueOptionId?: number;
    useIntegration?: boolean;
    integrationId?: number;
    promptId?: number;
    chatGptPrompt?: string;
    typebotStatus?: string;
    typebotSessionId?: string;
    typebotExpired?: boolean;
    typebotDelayMessage?: number;
    n8nStatus?: string;
    n8nExpired?: boolean;
    n8nSessionId?: string;
    n8nDelayMessage?: number;
    chatGptStatus?: string;
    chatGptExpired?: boolean;
    chatGptSessionId?: string;
    chatGptDelayMessage?: number;
    dialogflowStatus?: string;
    dialogflowExpired?: boolean;
    dialogflowSessionId?: string;
    dialogflowDelayMessage?: number;
  };
  ticketId: number | string;
  isTransference?: boolean;
  userIdRequest?: number;
}

export const updateForce = async (req: Request, res: Response): Promise<Response> => {
  const { ticketId } = req.params;
  const { tenantId } = req.user;
  const userId = req.user.id;
  const { isTransference } = req.body;

  const ticketData = {
    ...req.body,
    tenantId
  };

  const { ticket } = await UpdateTicketService.execute({
    ticketData,
    ticketId,
    isTransference,
    userIdRequest: userId
  });

  if (ticket.status === "closed") {
    const whatsapp = await Whatsapp.findOne({
      where: { id: ticket.whatsappId }
    });

    if (whatsapp?.farewellMessage && whatsapp.channel === "waba") {
      const farewell = pupa(whatsapp.farewellMessage || "", {
        protocol: ticket?.protocol || "",
        name: ticket?.contact?.name || "",
        email: ticket?.contact?.email || "",
        phoneNumber: ticket?.contact?.number || "",
        kanban: ticket?.contact?.kanban || "",
        firstName: ticket?.contact?.firstName || "",
        lastName: ticket?.contact?.lastName || "",
        businessName: ticket?.contact?.businessName || "",
        cpf: ticket?.contact?.cpf || "",
        birthdayDate: ticket?.contact?.birthdayDate || "",
        user: ticket?.user?.name || "",
        userEmail: ticket?.user?.email || ""
      });

      const messageId = uuidv4();

      const wabaMessage = await new SendWABAMetaTextService().execute({
        phoneNumber: ticket.contact.number,
        tokenAPI: whatsapp.tokenAPI,
        message: farewell,
        ticket,
        tenantId,
        messageId,
        whatsapp
      });

      await ticket.update({ isFarewellMessage: true });
    }
  }

  if (ticketData.promptId !== undefined) {
    await ticket.update({ promptId: ticketData.promptId });
  }

  if (ticketData.chatbot !== undefined) {
    await ticket.update({ chatbot: ticketData.chatbot });
  }

  if (ticketData.typebotDelayMessage !== undefined) {
    await ticket.update({ typebotDelayMessage: ticketData.typebotDelayMessage });
  }

  if (ticketData.chatGptDelayMessage !== undefined) {
    await ticket.update({ chatGptDelayMessage: ticketData.chatGptDelayMessage });
  }

  if (ticketData.n8nDelayMessage !== undefined) {
    await ticket.update({ n8nDelayMessage: ticketData.n8nDelayMessage });
  }

  if (ticketData.dialogflowDelayMessage !== undefined) {
    await ticket.update({ dialogflowDelayMessage: ticketData.dialogflowDelayMessage });
  }

  const updatedTicket = await ShowTicketService.execute({
    id: ticketId,
    tenantId
  });

  await socketEmit({
    tenantId,
    type: "ticket:update",
    payload: updatedTicket
  });

  return res.status(200).json(ticket);
};

export const remove = async (req: Request, res: Response): Promise<Response> => {
  const { ticketId } = req.params;
  const { tenantId } = req.user;
  const userId = req.user.id;

  const ticket = await DeleteTicketService.execute({
    id: ticketId,
    tenantId,
    userId
  });

  const socket = io();
  socket
    .to(`${tenantId}:${ticket.status}`)
    .to(`${tenantId}:${ticketId}`)
    .to(`${tenantId}:notification`)
    .emit(`${tenantId}:ticket`, {
      action: "delete",
      ticketId: +ticketId
    });

  return res.status(200).json({ message: "ticket deleted" });
};

export const showLogsTicket = async (req: Request, res: Response): Promise<Response> => {
  const { ticketId } = req.params;

  const ticketLogs = await ShowLogTicketService.execute({
    ticketId
  });

  return res.status(200).json(ticketLogs);
};

export const updateChannel = async (req: Request, res: Response): Promise<Response> => {
  const { tenantId } = req.user;

  const ticketData = {
    ...req.body,
    tenantId
  };

  const { tickets } = await UpdateChannelTicketService.execute({
    ticketData
  });

  return res.status(200).json(tickets);
};

export const updateChatbot = async (req: Request, res: Response): Promise<Response> => {
  const { tenantId } = req.user;
  const { ticketId } = req.params;

  const ticketData = {
    ...req.body,
    tenantId
  };

  const { ticket } = await UpdateChatbotTicketService.execute({
    ticketData,
    ticketId
  });

  return res.status(200).json(ticket);
};

export const updateTicketChannelId = async (req: Request, res: Response): Promise<Response> => {
  const { tenantId } = req.user;
  const { ticketId } = req.params;

  const ticketData = {
    ...req.body,
    tenantId
  };

  const { ticket } = await UpdateChannelIdTicketService.execute({
    ticketData,
    ticketId
  });

  return res.status(200).json(ticket);
};

export const updateNull = async (req: Request, res: Response): Promise<Response> => {
  const { ticketId } = req.params;
  const { tenantId } = req.user;

  const ticketData = {
    ...req.body,
    tenantId
  };

  const ticket = await Ticket.findOne({
    where: { id: ticketId }
  });

  if (ticket) {
    await ticket.update({ status: ticketData.status });
  }

  return res.status(200).json(ticket);
};

interface UpdateTicketStatusData {
  status: string;
  userId?: number;
  queueId?: number;
  whatsappId?: number;
  promptId?: number;
  useIntegration?: boolean;
  integrationId?: number;
  chatGptPrompt?: string;
}

export const update = async (req: Request, res: Response): Promise<Response> => {
  const { ticketId } = req.params;
  const { tenantId } = req.user;
  const userId = req.user.id;
  const { isTransference } = req.body;

  const ticketData = {
    ...req.body,
    tenantId
  };

  const { ticket } = await UpdateTicketService.execute({
    ticketData,
    ticketId,
    isTransference,
    userIdRequest: userId
  });

  if (ticket.status === "closed") {
    const whatsapp = await Whatsapp.findOne({
      where: { id: ticket.whatsappId }
    });

    if (whatsapp?.farewellMessage && whatsapp.channel === "waba") {
      const farewell = pupa(whatsapp.farewellMessage || "", {
        protocol: ticket?.protocol || "",
        name: ticket?.contact?.name || "",
        email: ticket?.contact?.email || "",
        phoneNumber: ticket?.contact?.number || "",
        kanban: ticket?.contact?.kanban || "",
        firstName: ticket?.contact?.firstName || "",
        lastName: ticket?.contact?.lastName || "",
        businessName: ticket?.contact?.businessName || "",
        cpf: ticket?.contact?.cpf || "",
        birthdayDate: ticket?.contact?.birthdayDate || "",
        user: ticket?.user?.name || "",
        userEmail: ticket?.user?.email || ""
      });

      const messageId = uuidv4();

      await new SendWABAMetaTextService().execute({
        phoneNumber: ticket.contact.number,
        tokenAPI: whatsapp.tokenAPI,
        message: farewell,
        ticket,
        tenantId,
        messageId,
        whatsapp
      });

      await ticket.update({ isFarewellMessage: true });
    }

    if (whatsapp?.farewellMessage && whatsapp.channel === "meow") {
      const farewell = pupa(whatsapp.farewellMessage || "", {
        protocol: ticket?.protocol || "",
        name: ticket?.contact?.name || "",
        email: ticket?.contact?.email || "",
        phoneNumber: ticket?.contact?.number || "",
        kanban: ticket?.contact?.kanban || "",
        firstName: ticket?.contact?.firstName || "",
        lastName: ticket?.contact?.lastName || "",
        businessName: ticket?.contact?.businessName || "",
        cpf: ticket?.contact?.cpf || "",
        birthdayDate: ticket?.contact?.birthdayDate || "",
        user: ticket?.user?.name || "",
        userEmail: ticket?.user?.email || ""
      });

      await SendTextMessageServiceMeow.execute({
        message: farewell,
        ticket,
        tenantId,
        whatsapp
      });

      await ticket.update({ isFarewellMessage: true });
    }

    if (whatsapp?.farewellMessage && !whatsapp.channel.includes("mock") && whatsapp.channel !== "waba" && whatsapp.channel !== "meow") {
      const farewell = pupa(whatsapp.farewellMessage || "", {
        protocol: ticket?.protocol || "",
        name: ticket?.contact?.name || "",
        email: ticket?.contact?.email || "",
        phoneNumber: ticket?.contact?.number || "",
        kanban: ticket?.contact?.kanban || "",
        firstName: ticket?.contact?.firstName || "",
        lastName: ticket?.contact?.lastName || "",
        businessName: ticket?.contact?.businessName || "",
        cpf: ticket?.contact?.cpf || "",
        birthdayDate: ticket?.contact?.birthdayDate || "",
        user: ticket?.user?.name || "",
        userEmail: ticket?.user?.email || ""
      });

      await SendTextMessageService.execute({
        message: farewell,
        ticket,
        tenantId,
        whatsapp
      });

      await ticket.update({ isFarewellMessage: true });
    }
  }

  if (ticketData.promptId !== undefined) {
    await ticket.update({ promptId: ticketData.promptId });
  }

  if (ticketData.chatbot !== undefined) {
    await ticket.update({ chatbot: ticketData.chatbot });
  }

  if (ticketData.typebotDelayMessage !== undefined) {
    await ticket.update({ typebotDelayMessage: ticketData.typebotDelayMessage });
  }

  if (ticketData.chatGptDelayMessage !== undefined) {
    await ticket.update({ chatGptDelayMessage: ticketData.chatGptDelayMessage });
  }

  if (ticketData.n8nDelayMessage !== undefined) {
    await ticket.update({ n8nDelayMessage: ticketData.n8nDelayMessage });
  }

  if (ticketData.dialogflowDelayMessage !== undefined) {
    await ticket.update({ dialogflowDelayMessage: ticketData.dialogflowDelayMessage });
  }

  const updatedTicket = await ShowTicketService.execute({
    id: ticketId,
    tenantId
  });

  await socketEmit({
    tenantId,
    type: "ticket:update",
    payload: updatedTicket
  });

  return res.status(200).json(ticket);
}; 