import { Message } from "../models/Message";
import AppError from "../errors/AppErrorZPRO";
import GetMessagesService from "../services/MessageServices/GetMessagesServiceZPRO";

interface MessageKey {
  remoteJid: string;
  fromMe: boolean;
  id: string;
  participant?: string;
}

interface WbotMessage {
  key: MessageKey;
}

const GetWbotMessageBaileys = async (
  messageId: string, 
  messageType: string
): Promise<WbotMessage> => {
  const getMessage = async (): Promise<Message> => {
    const message = await GetMessagesService({ id: messageId });
    return message;
  };

  try {
    const message = await getMessage();

    if (!message) {
      throw new Error("Cannot found message within 100 last messages");
    }

    const { ticket } = message;
    let msgBaileysWA: WbotMessage;

    const privateTypes = ["reaction", "quoted", "delete"];
    const groupTypes = ["reaction", "quoted", "edit", "delete"];

    // Handle group messages
    if (ticket.isGroup) {
      if (message.fromMe) {
        msgBaileysWA = {
          key: {
            remoteJid: privateTypes.includes(messageType) 
              ? `${ticket.contact.number}@s.whatsapp.net`
              : `${ticket.whatsapp.number}@g.us`,
            fromMe: message.fromMe,
            id: message.messageId
          }
        };
      } else {
        msgBaileysWA = {
          key: {
            remoteJid: privateTypes.includes(messageType)
              ? `${ticket.contact.number}@s.whatsapp.net` 
              : `${ticket.whatsapp.number}@g.us`,
            fromMe: message.fromMe,
            id: message.messageId,
            participant: `${message.contact.number}@s.whatsapp.net`
          }
        };
      }
    // Handle private messages  
    } else {
      if (message.fromMe || ["edit"].includes(messageType)) {
        msgBaileysWA = {
          key: {
            remoteJid: groupTypes.includes(messageType)
              ? `${ticket.contact.number}@s.whatsapp.net`
              : `${ticket.whatsapp.number}@s.whatsapp.net`,
            fromMe: message.fromMe,
            id: message.messageId
          }
        };
      } else {
        msgBaileysWA = {
          key: {
            remoteJid: privateTypes.includes(messageType)
              ? `${ticket.contact.number}@s.whatsapp.net`
              : `${ticket.whatsapp.number}@s.whatsapp.net`, 
            fromMe: message.fromMe,
            id: message.messageId,
            participant: `${message.contact.number}@s.whatsapp.net`
          }
        };
      }
    }

    return msgBaileysWA;

  } catch (err) {
    console.error(err);
    throw new AppError("ERR_FETCH_WAPP_MSG");
  }
};

export { GetWbotMessageBaileys };
export default GetWbotMessageBaileys; 