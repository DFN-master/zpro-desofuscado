"use strict";

import { Message } from "../models/Message";
import { Ticket } from "../models/Ticket";
import { WAMessage } from "@whiskeysockets/baileys";
import { getIO } from "../libs/socket";
import { Store } from "../libs/store";
import { logger } from "../utils/logger";

interface TicketUpdate {
  ticketId: number;
  status?: string;
  lastMessage?: string;
  updatedAt?: Date;
}

interface MessageUpdate {
  messageId: number;
  status: string;
  timestamp: Date;
  editedBody?: string;
}

const syncLatestTicketWbotMessageZPRO = async (
  message: WAMessage,
  ticket: Ticket
): Promise<void> => {
  const io = getIO();

  try {
    const store = await Store.getInstance();
    
    // Extrair informações relevantes da mensagem
    const messageBody = message.message?.conversation || 
                       message.message?.extendedTextMessage?.text || 
                       "";
    
    const messageTimestamp = new Date(
      (message.messageTimestamp as number) * 1000
    );

    // Atualizar último status do ticket
    const ticketUpdate: TicketUpdate = {
      ticketId: ticket.id,
      lastMessage: messageBody,
      updatedAt: messageTimestamp
    };

    await updateTicketLastMessage(ticketUpdate);

    // Criar/Atualizar mensagem no banco
    const messageUpdate: MessageUpdate = {
      messageId: message.key.id as number,
      status: "RECEIVED",
      timestamp: messageTimestamp,
      editedBody: messageBody
    };

    await updateMessageStatus(messageUpdate);

    // Emitir evento via socket
    io.to(ticket.status).emit("ticket:update", {
      ticketId: ticket.id,
      message: messageBody
    });

    logger.info(
      `Message ${message.key.id} synchronized for ticket ${ticket.id}`
    );

  } catch (error) {
    logger.error(
      `Error syncing WhatsApp message: ${error}`
    );
    throw error;
  }
};

const updateTicketLastMessage = async (
  update: TicketUpdate
): Promise<void> => {
  try {
    const store = await Store.getInstance();
    
    await store.ticket.update(
      { 
        lastMessage: update.lastMessage,
        updatedAt: update.updatedAt
      },
      { where: { id: update.ticketId } }
    );

  } catch (error) {
    logger.error(
      `Error updating ticket ${update.ticketId}: ${error}`
    );
    throw error;
  }
};

const updateMessageStatus = async (
  update: MessageUpdate
): Promise<void> => {
  try {
    const store = await Store.getInstance();

    await store.message.update(
      {
        status: update.status,
        timestamp: update.timestamp,
        body: update.editedBody
      },
      { where: { id: update.messageId } }
    );

  } catch (error) {
    logger.error(
      `Error updating message ${update.messageId}: ${error}`
    );
    throw error;
  }
};

export default syncLatestTicketWbotMessageZPRO; 