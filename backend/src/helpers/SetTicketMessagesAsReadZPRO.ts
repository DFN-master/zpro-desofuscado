import { Message } from "../models/Message";
import { Ticket } from "../models/Ticket";
import { getMessengerBot } from "../libs/messengerBot";
import { getWbotBaileys } from "../libs/wbot-baileys";
import ShowTicketService from "../services/ShowTicketService";
import { logger } from "../utils/logger";
import GetTicketWbot from "./GetTicketWbot";
import socketEmit from "./socketEmit";
import GetWbotMessageBaileys from "./GetWbotMessageBaileys";
import axios from "axios";
import Whatsapp from "../models/Whatsapp";
import { showWuzapiHost } from "./ShowWuzapiHost";

interface MessageData {
  id: string;
  messageId: string;
  read: boolean;
}

interface TicketData {
  id: number;
  tenantId: number;
  channel: string;
  whatsappId: number;
  contact: {
    number: string;
  };
  isGroup: boolean;
  messengerId?: string;
}

const SetTicketMessagesAsRead = async (ticket: TicketData): Promise<void> => {
  // Buscar mensagens não lidas do ticket
  const messages = await Message.findAll({
    where: {
      ticketId: ticket.id,
      read: false
    }
  });

  // Marcar cada mensagem como lida
  messages.forEach(async (message: MessageData) => {
    await message.update({ read: true });
    
    // Atualizar contador de mensagens não lidas do ticket
    await ticket.update({ unreadMessages: 0 });

    try {
      // Whatsapp
      if (ticket.channel === "whatsapp") {
        const wbot = await GetTicketWbot(ticket);
        try {
          wbot.sendSeen(
            `${ticket.contact.number}@${ticket.isGroup ? "g" : "c"}.us`
          );
        } catch (err) {
          // Ignora erro de envio do seen
        }
      }

      // Messenger
      if (ticket.channel === "messenger") {
        const messenger = getMessengerBot(ticket.whatsappId);
        messenger.markSeen(ticket.contact.messengerId);
      }

      // Baileys
      if (ticket.channel === "whatsapp-bot-baileys") {
        const wbot = await getWbotBaileys(ticket.whatsappId);
        const msgBaileys = await GetWbotMessageBaileys(
          message.messageId, 
          "read"
        );
        await wbot.readMessages([msgBaileys.key]);
      }

      // API Externa
      if (ticket.channel === "waba") {
        const whatsapp = await Whatsapp.findOne({
          where: { id: ticket.whatsappId }
        });

        const apiHost = await showWuzapiHost(whatsapp.tenantId);
        const url = `${apiHost}/chat/markread`;

        const payload = {
          Id: [`${message.messageId}`],
          Chat: `${ticket.contact.number}@s.whatsapp.net`,
          Sender: `${ticket.contact.number}@s.whatsapp.net`
        };

        await axios.post(url, payload, {
          headers: {
            "Content-Type": "application/json",
            token: whatsapp?.wabaId
          }
        });
      }

    } catch (err) {
      logger.warn(
        `Could not mark messages as read. Maybe whatsapp session disconnected? Err: ${err}`
      );
    }

    // Emitir evento de atualização do ticket
    const ticketReloaded = await ShowTicketService({
      id: ticket.id,
      tenantId: ticket.tenantId
    });

    socketEmit({
      tenantId: ticket.tenantId,
      type: "ticket:update",
      payload: ticketReloaded
    });
  });
};

export default SetTicketMessagesAsRead; 