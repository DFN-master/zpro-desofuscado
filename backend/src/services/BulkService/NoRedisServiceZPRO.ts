import { MessageMedia } from 'whatsapp-web.js';
import * as Sentry from '@sentry/node';
import path from 'path';
import fs from 'fs';
import sharp from 'sharp';
import ffmpeg from 'fluent-ffmpeg';
import mime from 'mime-types';

import { logger } from '../../utils/loggerZPRO';
import { Message as WbotMessage } from 'whatsapp-web.js';
import { getWbot } from '../WbotServiceZPRO';
import { getWbotBaileys } from '../WbotBaileysZPRO';
import AppError from '../../errors/AppError';
import Message from '../../models/MessageZPRO';
import Ticket from '../../models/TicketZPRO';
import { socketEmit } from '../SocketEmitZPRO';
import { Store } from '../../libs/store';
import { getMessageOptions } from '../WbotServicesZPRO/SendMessagesServiceZPRO';
import { getTypeMessage, getTimestampMessage } from '../WbotServicesZPRO/wbotMessageListener';
import CreateMessageService from '../MessageServices/CreateMessageServiceZPRO';
import ShowTicketService from '../TicketServices/ShowTicketServiceZPRO';
import { CheckIsValidContact } from '../WbotServices/CheckIsValidContactBulkZPRO';
import { CheckIsValidBaileysContact } from '../WbotServices/CheckIsValidBaileysContactZPRO';
import { ConvertMpegToMp4 } from '../WbotServices/ConvertMpegToMp4ZPRO';
import { ConvertWebmToMp4 } from '../WbotServices/ConvertWebmToMp4ZPRO';
import { pupa } from '../../utils/pupa';
import { GetWbotMessage } from '../WbotServices/GetWbotMessageZPRO';
import { GetWbotMessageBaileys } from '../WbotServices/GetWbotMessageBaileysZPRO';

interface Request {
  ticketData: {
    contact: {
      number: string;
    };
    whatsappId: number;
    tenantId: number;
    userId: number;
    status: string;
    isGroup: boolean;
    users: any[];
    promptId?: number;
    queueId?: number;
  };
  message: {
    body: string;
    fromMe: boolean;
    mediaUrl?: string;
    mediaType?: string;
    quotedMsg?: {
      id: string;
      body: string;
    };
  };
  medias?: {
    filename: string;
    path: string;
    mediaType: string;
  }[];
  userId: number;
  tenantId: number;
  type: string;
  isPrivate?: boolean;
}

interface MessageData {
  messageId: string;
  ticketId: number;
  contactId?: number;
  body: string;
  fromMe: boolean;
  mediaType?: string;
  read: boolean;
  quotedMsgId?: string | null;
  timestamp: number;
  status: string;
}

// Interface para o Store
interface StoreMessage {
  id: string;
  messageId: string;
  ticketId: number;
  contactId: number;
  body: string;
  fromMe: boolean;
  mediaType?: string;
  read: boolean;
  timestamp: number;
  status: string;
}

// Interface para MessageOptions
interface MessageOptions {
  media?: MessageMedia;
  options?: {
    sendMediaAsDocument?: boolean;
    caption?: string;
    quotedMessageId?: any;
    linkPreview?: boolean;
  };
}

// Interface para o Ticket
interface TicketData {
  id: number;
  contact: {
    id: number;
    number: string;
    name?: string;
    email?: string;
    protocol?: string;
    phoneNumber?: string;
    kanban?: string;
    firstName?: string;
    lastName?: string;
    businessName?: string;
    cpf?: string;
    birthdayDate?: string;
  };
  user?: {
    name?: string;
    email?: string;
  };
  whatsappId: number;
  tenantId: number;
  status: string;
}

// Função auxiliar para verificar tipo de mensagem
const getTypeMessage = (msg: any): string => {
  if (msg.hasMedia) {
    return msg.type.toLowerCase();
  }
  if (msg.message?.conversation) return "chat";
  if (msg.message?.imageMessage) return "image";
  if (msg.message?.videoMessage) return "video";
  if (msg.message?.documentMessage) return "document";
  if (msg.message?.audioMessage) return "audio";
  if (msg.message?.stickerMessage) return "sticker";
  return "chat";
};

// Função auxiliar para obter timestamp
const getTimestampMessage = (msgTimestamp: number): number => {
  return msgTimestamp * 1000;
};

// Função para obter opções de mensagem
const getMessageOptions = async (
  mediaUrl: string,
  mediaType: string,
  fileName: string,
  tenantId: number
): Promise<MessageOptions> => {
  if (!mediaUrl) {
    return {};
  }

  const media = await MessageMedia.fromFilePath(
    path.join(__dirname, "..", "..", "..", "public", tenantId.toString(), fileName)
  );

  const options: MessageOptions = {
    media,
    options: {
      sendMediaAsDocument: ["application/pdf", "application/msword"].includes(mediaType),
      caption: fileName,
      linkPreview: false
    }
  };

  return options;
};

// Classe Store para gerenciar mensagens
class Store {
  private static instance: Store;
  private messages: Map<string, StoreMessage>;

  private constructor() {
    this.messages = new Map();
  }

  public static getInstance(): Store {
    if (!Store.instance) {
      Store.instance = new Store();
    }
    return Store.instance;
  }

  public async setMessage(message: StoreMessage): Promise<void> {
    this.messages.set(message.id, message);
  }

  public getMessage(id: string): StoreMessage | undefined {
    return this.messages.get(id);
  }

  public deleteMessage(id: string): boolean {
    return this.messages.delete(id);
  }
}

const noRedisService = async ({
  message,
  ticketData,
  medias,
  tenantId,
  type,
  userId,
  isPrivate
}: Request): Promise<void> => {
  const { contact } = ticketData;
  const { number } = contact;

  try {
    let msgData: WbotMessage;
    let validContact;
    let responseMessage;

    if (type === "wapp") {
      const wbot = await getWbot(parseInt(ticketData.whatsappId.toString()));

      if (!isPrivate || isPrivate === "false") {
        validContact = await CheckIsValidContact(number, tenantId);
      } else {
        validContact = number + "@c.us";
      }

      if (validContact) {
        try {
          if (message && message !== "null") {
            responseMessage = pupa(message.body || "", {
              protocol: ticketData?.contact?.protocol || "",
              name: ticketData?.contact?.name || "",
              email: ticketData?.contact?.email || "",
              phoneNumber: ticketData?.contact?.phoneNumber || "",
              kanban: ticketData?.contact?.kanban || "",
              firstName: ticketData?.contact?.firstName || "",
              lastName: ticketData?.contact?.lastName || "",
              businessName: ticketData?.contact?.businessName || "",
              cpf: ticketData?.contact?.cpf || "",
              birthdayDate: ticketData?.contact?.birthdayDate || "",
              user: ticketData?.user?.name || "",
              userEmail: ticketData?.user?.email || ""
            });

            let quotedMsgId;
            if (message.quotedMsg) {
              const quotedMsg = await GetWbotMessage(message.quotedMsg.id, "wapp");
              if (quotedMsg) {
                quotedMsgId = {
                  message: {
                    conversation: message.quotedMsg.body
                  }
                };
              }
            }

            const messageOptions = await getMessageOptions(
              message.mediaUrl || "",
              message.mediaType || "",
              message.fileName || "",
              ticketData.tenantId
            );

            const store = Store.getInstance();

            if (message.mediaUrl) {
              msgData = await wbot.sendMessage(
                validContact.number + "@c.us",
                messageOptions.media,
                {
                  ...messageOptions.options,
                  quotedMessageId: quotedMsgId,
                  linkPreview: false
                }
              );
            } else {
              msgData = await wbot.sendMessage(
                validContact.number + "@c.us",
                responseMessage,
                {
              quotedMessageId: quotedMsgId,
              linkPreview: false
                }
              );
            }

            await store.setMessage({
              id: msgData.id.id,
              messageId: msgData.id.id,
              ticketId: ticketData.id,
              contactId: ticketData.contact.id,
              body: message.body,
              fromMe: true,
              mediaType: message.mediaType,
              read: true,
              timestamp: getTimestampMessage(msgData.timestamp),
              status: "sended"
            });

            const messageData = {
              messageId: msgData.id.id,
              ticketId: ticketData.id,
              body: message.body,
              contactId: ticketData.contact.id,
              fromMe: true,
              read: true,
              mediaType: message.mediaType,
              mediaUrl: message.mediaUrl,
              timestamp: getTimestampMessage(msgData.timestamp),
              status: "sended",
              quotedMsgId: message.quotedMsg?.id || null
            };

            await CreateMessageService({
              messageData,
              tenantId: ticketData.tenantId
            });

            socketEmit({
              tenantId,
              type: "chat:create",
              payload: msgData
            });

          }

          // Handle media messages
          if (message !== "null" && medias && medias.length > 0) {
            for (const media of medias) {
              if (media.mediaType === "audio/mpeg") {
                const mediaPath = media.path;
                const newPath = media.destination + "/" + media.filename.split(".")[0] + ".mp4";

                try {
                  await ConvertMpegToMp4(mediaPath, newPath);
                  media.path = newPath;
                  media.filename = newPath.split("/").pop() || "default.mp4";
                  media.mediaType = "video/mp4";

                  const mediaMessage = MessageMedia.fromFilePath(
                    `./public/${tenantId}/${media.filename}`
                  );

                  msgData = await wbot.sendMessage(validContact.number + "@c.us", mediaMessage, {
                    quotedMessageId: quotedMsgId,
                    linkPreview: false
                  });

                  // Similar message handling code as above
                  // ...

                } catch (err) {
                  logger.error("Error converting MPEG to MP4", err);
                }
              }

              // Handle other media types (webm, images etc)
              // Similar pattern as above
              // ...
            }
          }

          // Completando o tratamento de mídia para mensagens WhatsApp (wapp)
          if (message !== "null" && medias && medias.length > 0) {
            for (const media of medias) {
              // Tratamento de áudio/mpeg (já implementado)
              if (media.mediaType === "audio/mpeg") {
                // ... código existente ...
              }

              // Tratamento de vídeo WebM
              if (media.mediaType === "video/webm") {
                const mediaPath = media.path;
                const newPath = media.destination + "/" + media.filename.split(".")[0] + ".mp4";

                try {
                  await ConvertWebmToMp4(mediaPath, newPath);
                  media.path = newPath;
                  media.filename = newPath.split("/").pop() || "default.mp4";
                  media.mediaType = "video/mp4";

                  const mediaMessage = MessageMedia.fromFilePath(
                    `./public/${tenantId}/${media.filename}`
                  );

                  msgData = await wbot.sendMessage(validContact.number + "@c.us", mediaMessage, {
                    sendMediaAsDocument: true,
                    quotedMessageId: quotedMsgId,
                    linkPreview: false
                  });

                  const messageData = {
                    messageId: msgData.id.id,
                    ticketId: userId,
                    contactId: ticketData.contact.id,
                    body: media.filename,
                    fromMe: true,
                    read: true,
                    mediaType: "video",
                    mediaUrl: media.filename,
                    timestamp: getTimestampMessage(msgData.timestamp),
                    status: "sended"
                  };

                  await CreateMessageService({
                    messageData,
                    tenantId: ticketData.tenantId
                  });

                  socketEmit({
                    tenantId,
                    type: "chat:create",
                    payload: msgData
                  });

                } catch (err) {
                  logger.error("Error converting WebM to MP4:", err);
                }
              }

              // Tratamento de imagens
              if (["image/png", "image/jpeg", "image/gif"].includes(media.mediaType)) {
                try {
                  const mediaMessage = MessageMedia.fromFilePath(
                    `./public/${tenantId}/${media.filename}`
                  );

                  msgData = await wbot.sendMessage(validContact.number + "@c.us", mediaMessage, {
                    quotedMessageId: quotedMsgId,
                    linkPreview: false
                  });

                  const messageData = {
                    messageId: msgData.id.id,
                    ticketId: userId,
                    contactId: ticketData.contact.id,
                    body: media.filename,
                    fromMe: true,
                    read: true,
                    mediaType: "image",
                    mediaUrl: media.filename,
                    timestamp: getTimestampMessage(msgData.timestamp),
                    status: "sended"
                  };

                  await CreateMessageService({
                    messageData,
                    tenantId: ticketData.tenantId
                  });

                  socketEmit({
                    tenantId,
                    type: "chat:create",
                    payload: msgData
                  });

                } catch (err) {
                  logger.error("Error creating image message record:", err);
                }
              }

              // Tratamento de documentos
              if (media.mediaType === "application/pdf" || media.mediaType === "application/msword") {
                try {
                  const mediaMessage = MessageMedia.fromFilePath(
                    `./public/${tenantId}/${media.filename}`
                  );

                  msgData = await wbot.sendMessage(validContact.number + "@c.us", mediaMessage, {
                    sendMediaAsDocument: true,
                    quotedMessageId: quotedMsgId,
                    linkPreview: false
                  });

                  const messageData = {
                    messageId: msgData.id.id,
                    ticketId: userId,
                    contactId: ticketData.contact.id,
                    body: media.filename,
                    fromMe: true,
                    read: true,
                    mediaType: "document",
                    mediaUrl: media.filename,
                    timestamp: getTimestampMessage(msgData.timestamp),
                    status: "sended"
                  };

                  await CreateMessageService({
                    messageData,
                    tenantId: ticketData.tenantId
                  });

                  socketEmit({
                    tenantId,
                    type: "chat:create",
                    payload: msgData
                  });

                } catch (err) {
                  logger.error("Error creating document message record:", err);
                }
              }
            }
          }

        } catch (err) {
          logger.error(`Error sending message: ${JSON.stringify(err)}`);
        }
      }
    }

    // Handle baileys messages
    if (type === "baileys") {
      const wbot = await getWbotBaileys(parseInt(ticketData.whatsappId.toString()));

      if (!isPrivate || isPrivate === "false") {
        validContact = await CheckIsValidBaileysContact(number, tenantId);
      } else {
        validContact = number + "@g.us";
      }

      let contextInfo = {};
      if (message.quotedMsg) {
        const quotedMsg = await GetWbotMessageBaileys(message.quotedMsg.id, "baileys");
        if (quotedMsg) {
          contextInfo = {
            quotedMessage: {
              conversation: message.quotedMsg.body
            }
          };
        }
      }

      if (validContact) {
        try {
          if (message && message !== "null") {
            responseMessage = pupa(message.body || "", {
              protocol: ticketData?.contact?.protocol || "",
              name: ticketData?.contact?.name || "",
              email: ticketData?.contact?.email || "",
              phoneNumber: ticketData?.contact?.phoneNumber || "",
              kanban: ticketData?.contact?.kanban || "",
              firstName: ticketData?.contact?.firstName || "",
              lastName: ticketData?.contact?.lastName || "",
              businessName: ticketData?.contact?.businessName || "",
              cpf: ticketData?.contact?.cpf || "",
              birthdayDate: ticketData?.contact?.birthdayDate || "",
              user: ticketData?.user?.name || "",
              userEmail: ticketData?.user?.email || ""
            });

            const options = {
              quoted: contextInfo,
              linkPreview: false
            };

            msgData = await wbot.sendMessage(validContact, responseMessage, options);
            
            // Implementação do getMessageData para Baileys
            const getMessageData = async (retries: number, delay: number): Promise<Message> => {
              for (let i = 0; i < retries; i++) {
                const messageData = await Message.findOne({
                  where: { 
                    messageId: msgData.key.id,
                    tenantId 
                  },
                  include: [
                    {
                      model: Ticket,
                      as: "ticket",
                      where: { tenantId },
                      include: ["contact"]
                    },
                    {
                      model: Message,
                      as: "quotedMsg",
                      include: ["contact"]
                    }
                  ]
                });

                if (messageData) return messageData;
                await new Promise(resolve => setTimeout(resolve, delay));
              }
              throw new AppError("ERR_MESSAGE_NOT_EXISTS", 404);
            };

            try {
              const msgCreated = await getMessageData(5, 1000);
              const messageData: MessageData = {
                status: "sended",
                messageId: msgData.key.id,
                ticketId: userId,
                contactId: ticketData.contact.id,
                body: message.body,
                fromMe: true,
                read: true,
                mediaType: getTypeMessage(msgData),
                timestamp: getTimestampMessage(msgData.messageTimestamp),
              };

              await msgCreated.update(messageData);

              socketEmit({
                tenantId,
                type: "chat:create",
                payload: msgCreated
              });

            } catch (err) {
              logger.error("Error creating message record:", err);
            }
          }

          // Tratamento de mídia para Baileys
          if (message !== "null" && medias && medias.length > 0) {
            for (const media of medias) {
              const mediaPath = path.join(__dirname, "..", "..", "..", "public", tenantId.toString());
              
              // Tratamento de áudio
              if (media.mediaType === "audio/mpeg") {
                const newPath = path.join(mediaPath, `${Date.now()}.mp4`);
                
                try {
                  await ConvertMpegToMp4(media.path, newPath);
                  media.path = newPath;
                  media.filename = path.basename(newPath);
                  media.mediaType = "video/mp4";

                  const mediaMessage = {
                    audio: {
                      url: newPath
                    }
                  };

                  msgData = await wbot.sendMessage(validContact, mediaMessage, {
                    quoted: contextInfo
                  });

                  // Processo de criação da mensagem similar ao anterior
                  // ...

                } catch (err) {
                  logger.error("Error processing audio:", err);
                }
              }

              // Tratamento de vídeo WebM
              if (media.mediaType === "video/webm") {
                const newPath = path.join(mediaPath, `${Date.now()}.mp4`);
                
                try {
                  await ConvertWebmToMp4(media.path, newPath);
                  media.path = newPath;
                  media.filename = path.basename(newPath);
                  media.mediaType = "video/mp4";

                  const mediaMessage = {
                    video: {
                      url: newPath
                    }
                  };

                  msgData = await wbot.sendMessage(validContact, mediaMessage, {
                    quoted: contextInfo
                  });

                  // Processo de criação da mensagem similar ao anterior
                  // ...

                } catch (err) {
                  logger.error("Error processing video:", err);
                }
              }

              // Tratamento de imagens
              if (["image/png", "image/jpeg", "image/gif"].includes(media.mediaType)) {
                const timestamp = Date.now();
                const newPath = path.join(mediaPath, `${timestamp}.webp`);

                try {
                  await sharp(media.path)
                    .webp()
                    .toFile(newPath);

                  const mediaMessage = {
                    sticker: {
                      url: newPath
                    }
                  };

                  msgData = await wbot.sendMessage(validContact, mediaMessage, {
                    quoted: contextInfo
                  });

                  // Processo de criação da mensagem similar ao anterior
      // ...

                  fs.unlinkSync(newPath);

                } catch (err) {
                  logger.error("Error processing image:", err);
                }
              }
            }
          }

          if (message.mediaUrl) {
            const baileysMessageOptions = await getMessageOptions(
              message.mediaUrl,
              message.mediaType || "",
              message.fileName || "",
              ticketData.tenantId
            );

            msgData = await wbot.sendMessage(
              validContact,
              baileysMessageOptions.media,
              {
                ...baileysMessageOptions.options,
                quoted: contextInfo
              }
            );
          }

          // Armazenar mensagem Baileys no Store
          await store.setMessage({
            id: msgData.key.id,
            messageId: msgData.key.id,
            ticketId: ticketData.id,
            contactId: ticketData.contact.id,
            body: message.body,
            fromMe: true,
            mediaType: message.mediaType,
            read: true,
            timestamp: getTimestampMessage(msgData.messageTimestamp),
            status: "sended"
          });

        } catch (err) {
          logger.error(`Error sending Baileys message: ${JSON.stringify(err)}`);
        }
      }
    }

    // Update ticket status
    if (message && message !== "null") {
      const ticket = await Ticket.findOne({
        where: { id: ticketData.id }
      });

      await ticket.update({
        lastMessage: responseMessage || "📝",
        answered: true
      });

      const ticketReturned = await ShowTicketService({
        id: ticketData.id,
        tenantId
      });

      socketEmit({
        tenantId,
        type: "ticket:update",
        payload: ticketReturned
      });

    } else if (message !== "null" && medias && medias.length > 0) {
      // Handle media message updates
      // ...
    }

    // Atualização do status do ticket para mensagens de mídia
    if (message === "null" && medias && medias.length > 0) {
      const ticket = await Ticket.findOne({
        where: { id: ticketData.id }
      });

      if (ticket) {
        const mediaTypes = medias.map(m => m.mediaType);
        let lastMessage = "📷 Media";

        if (mediaTypes.includes("audio/mpeg")) {
          lastMessage = "🎵 Audio";
        } else if (mediaTypes.includes("video/webm") || mediaTypes.includes("video/mp4")) {
          lastMessage = "🎥 Video";
        } else if (mediaTypes.includes("application/pdf") || mediaTypes.includes("application/msword")) {
          lastMessage = "📎 Document";
        }

        await ticket.update({
          lastMessage,
          answered: true
        });

        const ticketReturned = await ShowTicketService({
          id: ticketData.id,
          tenantId
        });

        socketEmit({
          tenantId,
          type: "ticket:update",
          payload: ticketReturned
        });
      }
    }

  } catch (err) {
    Sentry.captureException(err);
    logger.error(`Error sending message: ${err}`);
  }
};

export { noRedisService }; 