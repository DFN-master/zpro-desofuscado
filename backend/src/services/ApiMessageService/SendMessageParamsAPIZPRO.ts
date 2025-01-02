import { getWbot } from '../WbotService';
import { getWbotBaileys } from '../WbotBaileysService';
import CheckIsValidContactBulkZPRO from '../CheckServices/CheckIsValidContactBulkZPRO';
import CheckIsValidBaileysContactZPRO from '../CheckServices/CheckIsValidBaileysContactZPRO';
import { logger } from '../../utils/loggerZPRO';
import Contact from '../../models/Contact';
import FindOrCreateTicketServiceZPRO from '../TicketServices/FindOrCreateTicketServiceZPRO';
import CreateMessageSystemServiceZPRO from '../MessageServices/CreateMessageSystemServiceZPRO';
import SendWABAMetaTextServiceZPRO from '../WABAMetaServices/SendWABAMetaTextServiceZPRO';
import CreateOrUpdateContactServiceZPRO from '../ContactServices/CreateOrUpdateContactServiceZPRO';
import { v4 as uuidv4 } from 'uuid';

interface SendMessageParams {
  tenantId: number;
  number: string;
  tokenAPI?: string;
  body?: string;
  fromMe?: boolean;
  read?: boolean;
}

interface MessageResponse {
  message: string;
}

interface User {
  id: number;
  sessionId: string;
}

interface Channel {
  type: 'waba' | 'baileys' | 'ZPRO';
  tokenAPI?: string;
}

interface ContactData {
  name: string;
  number: string;
  profilePicUrl?: string;
  isGroup: boolean;
  isUser: boolean;
  isWAContact: boolean;
  tenantId: number;
  pushname: string;
}

interface TicketData {
  contact: any;
  sessionId: string;
  unreadMessages: number;
  tenantId: number;
  isGroup: boolean;
  channel: string;
}

interface MessageData {
  msg: {
    body: string;
    fromMe: boolean;
    read?: boolean;
  };
  tenantId: number;
  ticket: any;
  userId: string | number;
  status?: string;
  medias?: any;
  scheduleDate?: Date;
  sendType?: string;
  idFront?: string;
}

interface WABAMessageData {
  number: string;
  tokenAPI?: string;
  message: string;
  ticket: any;
  tenantId: number;
  idFront: string;
  waba: Channel;
}

const sendMessageParamsService = async (
  params: SendMessageParams,
  user: User,
  channel: Channel,
  messageBody: string
): Promise<MessageResponse> => {
  const { tenantId, number } = params;
  const cleanNumber = number.replace(/\D/g, '');

  try {
    // Envio via API
    if (channel?.type === 'waba') {
      const wbot = getWbot(user.sessionId);
      const validContact = await CheckIsValidContactBulkZPRO(cleanNumber, tenantId);
      
      await wbot.sendMessage(
        validContact.number_id || `${cleanNumber}@c.us`,
        messageBody
      );
    }

    // Envio via Baileys
    if (channel?.type === 'baileys') {
      const wbot = await getWbotBaileys(user.sessionId);
      const validContact = await CheckIsValidBaileysContactZPRO(cleanNumber, tenantId);

      await wbot.sendMessage(
        validContact || `${cleanNumber}@s.whatsapp.net`, 
        { text: messageBody }
      );

      try {
        const contact = await Contact.findOne({
          where: { 
            number: cleanNumber,
            tenantId 
          }
        });

        if (contact) {
          const ticketData: TicketData = {
            contact,
            sessionId: user.sessionId,
            unreadMessages: 0,
            tenantId,
            isGroup: false,
            channel: 'baileys'
          };

          const ticket = await FindOrCreateTicketServiceZPRO(ticketData);

          const messageData: MessageData = {
            msg: {
              body: messageBody,
              fromMe: true,
              read: true
            },
            tenantId,
            ticket,
            userId: 'bot',
            status: 'pending'
          };

          await CreateMessageSystemServiceZPRO(messageData);
        }
      } catch (err) {
        logger.warn('Error creating contact: ' + err);
      }
    }

    // Envio via ZPRO
    if (channel?.type === 'ZPRO') {
      const contactData: ContactData = {
        name: number,
        number,
        profilePicUrl: undefined,
        isGroup: false,
        isUser: false,
        isWAContact: false,
        tenantId,
        pushname: number
      };

      const contact = await CreateOrUpdateContactServiceZPRO(contactData);
      const messageId = uuidv4();

      const ticketData: TicketData = {
        contact,
        sessionId: user.sessionId,
        unreadMessages: 0,
        tenantId,
        isGroup: false,
        channel: 'ZPRO'
      };

      const ticket = await FindOrCreateTicketServiceZPRO(ticketData);

      const messageData: MessageData = {
        msg: {
          ...params,
          body: messageBody,
          fromMe: true
        },
        tenantId,
        medias: undefined,
        ticket,
        userId: user.id,
        scheduleDate: undefined,
        sendType: 'API',
        status: 'pending',
        idFront: messageId
      };

      await CreateMessageSystemServiceZPRO(messageData);

      const wabaService = new SendWABAMetaTextServiceZPRO();
      
      const wabaMessageData: WABAMessageData = {
        number: cleanNumber,
        tokenAPI: channel.tokenAPI,
        message: messageBody,
        ticket,
        tenantId,
        idFront: messageId,
        waba: channel
      };

      await wabaService.sendMessage(wabaMessageData);
    }

    return { message: 'Message sent successfully' };

  } catch (err) {
    logger.error('Error sending message:', err);
    return { message: 'Message not sent: ' + err };
  }
};

export { 
  sendMessageParamsService,
  SendMessageParams,
  MessageResponse,
  User,
  Channel,
  ContactData,
  TicketData,
  MessageData,
  WABAMessageData
}; 