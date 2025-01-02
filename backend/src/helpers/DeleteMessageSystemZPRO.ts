import { differenceInHours, parseJSON } from "date-fns";
import Message from "../models/MessageZPRO";
import Ticket from "../models/TicketZPRO";
import { getTbot } from "../libs/tbotZPRO";
import GetWbotMessage from "./GetWbotMessageZPRO";
import AppError from "../errors/AppErrorZPRO";
import { getIO } from "../libs/socket";
import GetWbotMessageBaileys from "./GetWbotMessageBaileysZPRO";
import { getWbotBaileys } from "../libs/wbot-baileysZPRO";
import socketEmit from "../libs/socketEmitZPRO";
import { SendRevokeMessage } from "../services/WbotMeowServices/SendRevokeMessageServiceZPRO";

interface DeleteParams {
  messageId: string;
  messageToDelete?: string;
  tenantId: string | number;
}

const DeleteMessageSystem = async ({
  messageId,
  messageToDelete,
  tenantId
}: DeleteParams): Promise<void> => {
  const message = await Message.findOne({
    where: { id: messageId },
    include: [{
      model: Ticket,
      as: "ticket",
      include: ["contact", "whatsapp"],
      where: { tenantId }
    }]
  });

  if (!message) {
    throw new AppError("No message found with this ID.");
  }

  const hoursAfterCreation = differenceInHours(
    new Date(),
    parseJSON(message.createdAt)
  );

  if (hoursAfterCreation > 2 && !message.scheduleDate) {
    throw new AppError("No delete message after 2h sended");
  }

  const { ticket } = message;

  // Handle WhatsApp messages
  if (ticket.channel === "whatsapp" && messageToDelete) {
    const wbot = await GetWbotMessage(ticket, messageToDelete);
    if (!wbot) {
      throw new AppError("ERR_DELETE_WAPP_MSG");
    }
    await wbot.delete(true);

    if (message.ticket.contact.isGroup === "true") {
      await message.destroy();
    }
  }

  // Handle Baileys messages  
  if (ticket.channel === "baileys" && messageToDelete) {
    try {
      const wbot = await getWbotBaileys(ticket.whatsappId);
      const baileysMessage = await GetWbotMessageBaileys(messageToDelete, "delete");
      const { key } = baileysMessage;

      await wbot.sendMessage(key?.remoteJid || "", {
        delete: key
      });
    } catch (err) {
      console.log(err);
      throw new AppError("ERROR_NOT_DELETE_MESSAGE");
    }

    if (ticket.contact.isGroup === "true") {
      await message.destroy();
    }
    await message.update({ isDeleted: true });
  }

  // Handle Meow messages
  if (ticket.channel === "messenger" && messageToDelete) {
    await SendRevokeMessage(
      ticket.id,
      messageToDelete,
      ticket.contact,
      tenantId
    );

    if (ticket.contact.isGroup === "true") {
      await message.destroy();
    }
    await message.update({ isDeleted: true });
  }

  // Handle Telegram messages
  if (ticket.channel === "telegram") {
    const tbot = await getTbot(ticket.whatsappId);
    await tbot.telegram.deleteMessage(
      ticket.contact.telegramId,
      +message.messageId
    );
  }

  // Skip Instagram messages
  if (ticket.channel === "instagram") return;

  // Skip Facebook messages
  if (ticket.channel === "facebook") return;

  await message.update({ isDeleted: true });

  // Emit socket events
  socketEmit({
    tenantId,
    type: "chat:delete",
    payload: message
  });

  const io = getIO();
  io.to(`tenant:${tenantId}:${ticket.id}`).emit(
    `tenant:${tenantId}:appMessage`,
    {
      action: "delete",
      message,
      ticket,
      contact: ticket.contact
    }
  );
};

export default DeleteMessageSystem; 