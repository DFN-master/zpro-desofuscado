import { Message as WbotMessage } from '@whiskeysockets/baileys';
import { getContentType } from '@whiskeysockets/baileys';
import path from 'path';
import fs from 'fs';
import mime from 'mime-types';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegPath from 'ffmpeg-static';
import * as Sentry from '@sentry/node';
import axios from 'axios';

import { logger } from '../../utils/loggerZPRO';
import { pupa } from '../../utils/pupaZPRO';
import socketEmit from '../helpers/socketEmitZPRO';
import UpdateContactTagsBotService from './UpdateContactTagsBotServiceZPRO';
import ShowTicketService from '../TicketServices/ShowTicketServiceZPRO';
import VerifyStepsChatFlowTicket from './VerifyStepsChatFlowTicketZPRO';
import HandleMessageTypebot from '../WbotServices/HandleMessageTypebotZPRO';
import HandleMessageChatGpt from '../WbotServices/HandleMessageChatGptZPRO';
import CheckIsValidBaileysContact from '../WbotServices/CheckIsValidBaileysContactZPRO';
import CreateMessageService from '../MessageServices/CreateMessageServiceZPRO';
import AppError from '../../errors/AppErrorZPRO';

import Contact from '../../models/ContactZPRO';
import Message from '../../models/MessageZPRO';
import Ticket from '../../models/TicketZPRO';

ffmpeg.setFfmpegPath(ffmpegPath);

interface MessageData {
  ticketId: number;
  body: string;
  contactId: number;
  fromMe: boolean;
  read: boolean;
  mediaType: string;
  mediaUrl?: string;
  timestamp: number;
  quotedMsgId?: string;
  userId: number;
  scheduleDate?: Date;
  sendType: string;
  status: string;
  tenantId: number;
}

interface Request {
  wbot: any;
  wbotMessage: WbotMessage;
  msg: {
    type: string;
    data: {
      typebotStatus?: boolean;
      typebotName?: string;
      typebotUrl?: string;
      typebotExpires?: number;
      typebotRetries?: number;
      chatgptStatus?: boolean;
      chatgptApiKey?: string;
      chatgptOrgId?: string;
      chatgptPrompt?: string;
      chatgptAssistantId?: string;
      stepChatFlow?: boolean;
      webhook?: string;
      tag?: number;
      kanban?: string;
      delay?: number;
      mediaPath?: string;
      body?: string;
    };
  };
  tenantId: number;
  ticket: any;
  userId: number;
}

const publicFolder = path.resolve(__dirname, '..', '..', '..', 'public');

const getTimestampMessage = (messageTimestamp: number): number => {
  return messageTimestamp * 1000;
};

const getTypeMessage = (msg: WbotMessage): string => {
  if (!msg.message) return '';

  const messageType = getContentType(msg.message);
  if (msg.message?.viewOnceMessage) return 'viewOnceMessage';

  return messageType || '';
};

const convertAudioToOgg = async (
  inputPath: string,
  tenantId: string
): Promise<string> => {
  return new Promise((resolve, reject) => {
    try {
      const outputPath = `${publicFolder}/${tenantId}/${new Date().getTime()}.ogg`;
      const command = ffmpeg({ source: inputPath });
      const chunks: Buffer[] = [];

      command
        .audioCodec('libopus')
        .format('ogg')
        .outputOptions('-avoid_negative_ts make_zero')
        .audioChannels(1)
        .on('end', async () => {
          fs.writeFileSync(outputPath, Buffer.concat(chunks));
          resolve(outputPath);
        })
        .on('error', error => {
          reject(error);
        })
        .pipe()
        .on('data', chunk => {
          chunks.push(chunk);
        })
        .on('error', error => {
          reject(error);
        });
    } catch (error) {
      reject(error);
    }
  });
};

const BuildSendMessageService = async ({
  wbot,
  wbotMessage,
  msg,
  tenantId,
  ticket,
  userId
}: Request): Promise<void> => {
  const messageData: MessageData = {
    ticketId: ticket.id,
    body: '',
    contactId: ticket.contactId,
    fromMe: true,
    read: true,
    mediaType: 'chat',
    mediaUrl: undefined,
    timestamp: new Date().getTime(),
    quotedMsgId: undefined,
    userId,
    scheduleDate: undefined,
    sendType: 'message',
    status: 'pending',
    tenantId
  };

  try {
    // Handle typebot flow
    if (msg.type === 'typebot' && msg.data.typebotStatus) {
      try {
        await ticket.update({
          typebotStatus: msg.data.typebotStatus,
          typebotName: msg.data.typebotName,
          typebotUrl: msg.data.typebotUrl,
          typebotExpires: msg.data.typebotExpires,
          typebotRetries: true,
          chatFlow: null,
          stepChatFlow: null
        });

        const updatedTicket = await ShowTicketService({ 
          id: ticket.id,
          tenantId: ticket.tenantId 
        });

        socketEmit({
          tenantId: ticket.tenantId,
          type: "ticket:update",
          payload: updatedTicket
        });

        if (!wbot) return;

        if (ticket.channel === 'whatsapp') {
          await HandleMessageTypebot(wbot, wbotMessage, updatedTicket);
        }
      } catch (err) {
        logger.error('BuildSendMessageService error:', err);
      }
    }

    // Handle chatgpt flow  
    if (msg.type === 'chatgpt' && msg.data.chatgptStatus) {
      try {
        await ticket.update({
          chatgptApiKey: msg.data.chatgptApiKey || null,
          chatgptOrgId: msg.data.chatgptOrgId || null,
          chatgptStatus: msg.data.chatgptStatus,
          chatgptAssistantId: msg.data.chatgptAssistantId,
          chatgptPrompt: msg.data.chatgptPrompt,
          chatgptOffStatus: true,
          chatFlow: null,
          stepChatFlow: null
        });

        const updatedTicket = await ShowTicketService({
          id: ticket.id,
          tenantId: ticket.tenantId
        });

        socketEmit({
          tenantId: ticket.tenantId,
          type: "ticket:update",
          payload: updatedTicket
        });

        if (!wbot) return;

        if (ticket.channel === 'whatsapp') {
          await HandleMessageChatGpt(wbot, wbotMessage, updatedTicket);
        }
      } catch (err) {
        logger.error('BuildSendMessageService error:', err);
      }
    }

    // Handle chat flow
    if (msg.type === 'chatflow' && msg.data.stepChatFlow) {
      try {
        await ticket.update({
          chatFlow: msg.data.stepChatFlow,
          stepChatFlow: 'INICIO',
          answered: false,
          queueId: null
        });

        const updatedTicket = await ShowTicketService({
          id: ticket.id,
          tenantId: ticket.tenantId
        });

        socketEmit({
          tenantId: ticket.tenantId,
          type: "ticket:update",
          payload: updatedTicket
        });

        const messageBody = {
          body: ticket.lastMessage,
          fromMe: false,
          read: false
        };

        if (!wbot) return;

        await VerifyStepsChatFlowTicket(wbot, messageBody, ticket);
      } catch (err) {
        logger.error('BuildSendMessageService error:', err);
      }
    }

    // Handle webhook
    if (msg.type === 'webhook' && msg.data.webhook) {
      if (msg.data.webhook === '') return;

      try {
        msg.data.webhook = pupa(msg.data.webhook || '', {
          protocol: ticket?.protocol || '',
          name: ticket?.contact?.name?.replace(/[^a-zA-Z0-9\u00C0-\u00FF ]+/g, '') || '',
          email: ticket?.contact?.email || '',
          phoneNumber: ticket?.contact?.number || '',
          kanban: ticket?.contact?.kanban || '',
          firstName: ticket?.contact?.firstName || '',
          lastName: ticket?.contact?.lastName || '',
          businessName: ticket?.contact?.businessName || '',
          cpf: ticket?.contact?.cpf || '',
          birthdayDate: ticket?.contact?.birthdayDate || '',
          user: ticket?.user?.name || '',
          userEmail: ticket?.user?.email || ''
        });

        if (typeof msg.data.webhook === 'string') {
          await axios.get(msg.data.webhook);
        }
      } catch (err) {
        logger.error('BuildSendMessageService error:', err);
      }
    }

    // Handle tags
    if (msg.type === 'tag' && msg.data.tag) {
      if (msg.data.tag === null) return;

      await UpdateContactTagsBotService({
        tagId: msg.data.tag,
        contactId: ticket.contactId.toString(),
        tenantId
      });
    }

    // Handle kanban
    if (msg.type === 'kanban' && msg.data.kanban) {
      if (msg.data.tag === null) return;

      const contact = await Contact.findByPk(ticket.contactId);
      if (!contact) {
        throw new Error('Contato não encontrado');
      }

      await contact.update({
        kanban: msg.data.kanban
      });
    }

    // Handle delay
    if (msg.type === 'delay' && msg.data.delay) {
      const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
      const delayMs = msg.data.delay * 1000;
      
      async function timeout() {
        await sleep(delayMs);
      }
      
      await timeout();
    }

    // Handle media
    if (msg.type === 'media' && msg.data.mediaPath) {
      const mediaPath = msg.data.mediaPath.split('/');

      if (ticket.channel === 'whatsapp') {
        let sentMessage;
        let validContact;
        const wbotInstance = wbot;
        const fileName = msg.data.mediaPath.substring(
          msg.data.mediaPath.lastIndexOf('/') + 1
        );

        validContact = await CheckIsValidBaileysContact(
          ticket.contact.number,
          tenantId
        );

        const pathMedia = path.resolve(
          __dirname,
          '..',
          '..',
          '..',
          'public',
          tenantId.toString()
        );
        const mediaPath = path.resolve(pathMedia, fileName);
        const messageOptions = await getMessageOptions(
          fileName,
          mediaPath,
          fileName,
          fileName,
          tenantId.toString()
        );

        try {
          sentMessage = await wbotInstance.sendMessage(
            validContact,
            Object.assign({}, messageOptions)
          );
          logger.info('Z-PRO ::: BuildSendMessageService');
        } catch (error) {
          logger.error('Z-PRO ::: sendMessage error:', error);
        }

        const getMessage = async (
          retries: number,
          intervalMs: number
        ): Promise<Message> => {
          const messageData = {
            messageId: sentMessage.key.id || '',
            ticketId: ticket.id,
            contactId: undefined,
            body: fileName || '',
            fromMe: sentMessage.key.fromMe || false,
            mediaType: getTypeMessage(sentMessage),
            read: sentMessage.key.fromMe || false,
            quotedMsgId: null,
            timestamp: getTimestampMessage(sentMessage.messageTimestamp) - 3600,
            status: 'pending'
          };

          await CreateMessageService({
            messageData,
            tenantId: ticket.tenantId
          });

          for (let i = 0; i < retries; i++) {
            const message = await Message.findOne({
              where: { messageId: sentMessage.key.id, tenantId: tenantId },
              include: [
                {
                  model: Ticket,
                  as: 'ticket',
                  where: { tenantId },
                  include: ['contact']
                },
                {
                  model: Message,
                  as: 'quotedMsg',
                  include: ['contact']
                }
              ]
            });

            if (message) {
              return message;
            }

            await new Promise(resolve => setTimeout(resolve, intervalMs));
          }

          throw new AppError('ERR_CREATING_MESSAGE', 404);
        };

        const message = await getMessage(5, 2000);
        const messageToUpdate = {
          status: 'pending',
          ack: 1,
          contactId: ticket.contact.id,
          sendType: 'chat',
          userId: ticket.userId,
          tenantId: ticket.tenantId
        };

        await message.update(Object.assign({}, messageToUpdate), {
          where: { id: message.id }
        });

        socketEmit({
          tenantId: ticket.tenantId,
          type: 'chat:create',
          payload: message
        });

      } else {
        const messageToCreate = Object.assign(Object.assign({}, messageData), {
          body: msg.data.name,
          mediaUrl: mediaPath[mediaPath.length - 1],
          mediaType: msg.data.type
            ? msg.data.type.substr(0, msg.data.type.indexOf('/'))
            : 'chat'
        });

        const newMessage = await Message.create(messageToCreate);

        const messageCreated = await Message.findByPk(newMessage.id, {
          include: [
            {
              model: Ticket,
              as: 'ticket',
              where: { tenantId },
              include: ['contact']
            },
            {
              model: Message,
              as: 'quotedMsg',
              include: ['contact']
            }
          ]
        });

        if (!messageCreated) {
          throw new Error('ERR_MESSAGE_NOT_EXISTS');
        }

        await ticket.update({
          lastMessage: messageCreated.body,
          lastMessageAt: new Date().getTime(),
          answered: true
        });

        socketEmit({
          tenantId,
          type: 'chat:create',
          payload: messageCreated
        });
      }
    }

    // Handle regular messages
    if (!['delay', 'media', 'tag', 'webhook', 'chatflow', 'typebot', 'kanban', 'chatgpt'].includes(msg.type)) {
      msg.data.body = pupa(msg.data.body || '', {
        protocol: ticket?.protocol || '',
        name: ticket?.contact?.name || '',
        email: ticket?.contact?.email || '',
        phoneNumber: ticket?.contact?.number || '',
        kanban: ticket?.contact?.kanban || '',
        firstName: ticket?.contact?.firstName || '',
        lastName: ticket?.contact?.lastName || '',
        businessName: ticket?.contact?.businessName || '',
        cpf: ticket?.contact?.cpf || '',
        birthdayDate: ticket?.contact?.birthdayDate || '',
        user: ticket?.user?.name || '',
        userEmail: ticket?.user?.email || ''
      });

      if (ticket.channel === 'whatsapp') {
        let sentMessage;
        let validContact;
        const wbotInstance = wbot;

        validContact = await CheckIsValidBaileysContact(
          ticket.contact.number,
          tenantId
        );

        const messageOptions = {
          text: msg.data.body
        };

        try {
          sentMessage = await wbotInstance.sendMessage(
            validContact,
            Object.assign({}, messageOptions)
          );
          logger.info('Z-PRO ::: BuildSendMessageService');
        } catch (error) {
          logger.error('Z-PRO ::: sendMessage error:', error);
        }

        const getMessage = async (
          retries: number,
          intervalMs: number
        ): Promise<Message> => {
          const messageData = {
            messageId: sentMessage.key.id || '',
            ticketId: ticket.id,
            contactId: undefined,
            body: msg.data.body || '',
            fromMe: sentMessage.key.fromMe || false,
            mediaType: getTypeMessage(sentMessage),
            read: sentMessage.key.fromMe || false,
            quotedMsgId: null,
            timestamp: getTimestampMessage(sentMessage.messageTimestamp) - 3600,
            status: 'pending'
          };

          await CreateMessageService({
            messageData,
            tenantId: ticket.tenantId
          });

          for (let i = 0; i < retries; i++) {
            const message = await Message.findOne({
              where: { messageId: sentMessage.key.id, tenantId },
              include: [
                {
                  model: Ticket,
                  as: 'ticket',
                  where: { tenantId },
                  include: ['contact']
                },
                {
                  model: Message,
                  as: 'quotedMsg',
                  include: ['contact']
                }
              ]
            });

            if (message) {
              return message;
            }

            await new Promise(resolve => setTimeout(resolve, intervalMs));
          }

          throw new AppError('ERR_CREATING_MESSAGE', 404);
        };

        const message = await getMessage(5, 2000);
        const messageToUpdate = {
          status: 'pending',
          ack: 1,
          contactId: ticket.contact.id,
          sendType: 'chat',
          userId: ticket.userId,
          tenantId: ticket.tenantId
        };

        await message.update(Object.assign({}, messageToUpdate), {
          where: { id: message.id }
        });

        socketEmit({
          tenantId: ticket.tenantId,
          type: 'chat:create',
          payload: message
        });

      } else {
        const messageToCreate = Object.assign(Object.assign({}, messageData), {
          body: msg.data.body,
          mediaType: 'chat'
        });

        const newMessage = await Message.create(messageToCreate);

        const messageCreated = await Message.findByPk(newMessage.id, {
          include: [
            {
              model: Ticket,
              as: 'ticket',
              where: { tenantId },
              include: ['contact']
            },
            {
              model: Message,
              as: 'quotedMsg',
              include: ['contact']
            }
          ]
        });

        if (!messageCreated) {
          throw new Error('ERR_MESSAGE_NOT_EXISTS');
        }

        await ticket.update({
          lastMessage: messageCreated.body,
          lastMessageAt: new Date().getTime(),
          answered: true
        });

        socketEmit({
          tenantId,
          type: 'chat:create',
          payload: messageCreated
        });
      }
    }

  } catch (error) {
    logger.error('BuildSendMessageService error:', error);
  }
};

export { getTimestampMessage, getTypeMessage };
export default BuildSendMessageService; 