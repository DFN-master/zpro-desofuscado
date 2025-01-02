import { join } from "path";
import { createReadStream, readFileSync, unlinkSync } from "fs";
import { v4 as uuidv4 } from "uuid";
import * as Sentry from "@sentry/node";
import ffmpeg from "fluent-ffmpeg";
import ffmpegStatic from "ffmpeg-static";
import sharp from "sharp";
import { Op } from "sequelize";
import path from "path";
import mime from "mime-types";

import Message from "../models/Message";
import Ticket from "../models/Ticket";
import Contact from "../models/Contact";
import Tenant from "../models/Tenant";

import ShowTicketService from "../services/TicketService";
import { getWbotBaileys } from "../libs/wbot-baileys";
import GetWbotMessage from "../services/GetWbotMessageBaileys";
import socketEmitter from "../services/socketEmitter";
import { logger } from "../utils/logger";
import { sleepRandomTime } from "../utils/sleepRandom";
import { convertWebmToMp4 } from "../services/ConvertWebmToMp4";
import AppError from "../errors/AppError";

interface MessageData {
  id: number;
  messageId: string | null;
  ticketId: number;
  contactId: number;
  body: string;
  fromMe: boolean;
  read: boolean;
  mediaType: string;
  mediaUrl: string;
  mediaName: string;
  status: string;
  quotedMsgId: string | null;
  ack: number;
  createdAt: Date;
  updatedAt: Date;
  dataJson: string;
  isDeleted: boolean;
  sendType: string;
  scheduleDate?: Date;
  ticket?: any;
  quotedMsg?: any;
  isSticker?: boolean;
}

interface ProcessMessageData {
  tenantId: number;
  sessionId: string;
  msg?: MessageData;
}

interface MessageOptions {
  video?: Buffer;
  audio?: Buffer;
  image?: Buffer;
  document?: Buffer;
  caption?: string;
  fileName?: string;
  mimetype?: string;
  ptt?: boolean;
}

interface QuotedMessage {
  key: {
    id: string;
  };
  message: any;
  contextInfo?: {
    quotedMessage?: any;
  };
}

const publicFolder = path.resolve(__dirname, "..", "..", "public");

ffmpeg.setFfmpegPath(ffmpegStatic);

const convertAudioToOgg = async (
  inputPath: string, 
  tenantId: string
): Promise<string> => {
  return new Promise((resolve, reject) => {
    try {
      const command = ffmpeg({ source: inputPath });
      const chunks: any[] = [];
      const outputPath = `${publicFolder}/${tenantId}/${new Date().getTime()}.ogg`;

      command
        .toFormat("ogg")
        .setAudioChannels(1)
        .audioCodec("libopus")
        .addOutputOptions(["-avoid_negative_ts make_zero"])
        .on("end", async () => {
          readFileSync(outputPath);
          resolve(outputPath);
        })
        .on("error", error => {
          reject(error);
        })
        .pipe()
        .on("data", chunk => {
          chunks.push(chunk);
        })
        .on("error", error => {
          reject(error);
        });
    } catch (error) {
      reject(error);
    }
  });
};

const getMessageOptions = async (
  fileName: string,
  filePath: string,
  messageBody: string,
  tenantId: string
): Promise<MessageOptions | null> => {
  const mimeType = mime.lookup(filePath);
  
  if (!mimeType) {
    throw new Error("Invalid mime type");
  }

  const fileType = mimeType.split("/")[0];

  try {
    let messageOptions: MessageOptions;

    if (fileType === "video") {
      messageOptions = {
        video: readFileSync(filePath),
        caption: undefined,
        fileName
      };
    } else if (fileType === "audio") {
      const audioPath = await convertAudioToOgg(filePath, tenantId);
      messageOptions = {
        audio: readFileSync(audioPath),
        mimetype: "audio/ogg",
        ptt: true
      };
    } else if (fileType === "document" || fileType === "text") {
      messageOptions = {
        document: readFileSync(filePath),
        caption: undefined,
        fileName,
        mimetype: mimeType
      };
    } else if (fileType === "application") {
      messageOptions = {
        document: readFileSync(filePath),
        caption: undefined,
        fileName,
        mimetype: mimeType
      };
    } else {
      messageOptions = {
        image: readFileSync(filePath),
        caption: undefined,
        fileName,
        mimetype: mimeType
      };
    }

    return messageOptions;
  } catch (err) {
    Sentry.captureException(err);
    logger.error(err);
    return null;
  }
};

let isProcessing = false;

export default {
  async handle(data: ProcessMessageData, forceProcessing = false): Promise<void> {
    const tenant = await Tenant.findOne({
      where: { id: data.tenantId }
    });

    if (!tenant?.acceptTerms) {
      logger.warn(
        `:::ZDG:::Tenant ${data.tenantId} não aceitou os termos de uso ainda. Acesse a página do super administrador.`
      );
      throw new AppError(
        `Termos de uso ainda não foram aceitos. Acesse a página do super administrador e aceite os termos para o tenant ${data.tenantId}.`,
        400
      );
    }

    if (isProcessing && !forceProcessing) {
      logger.warn(":::ZDG:::Process already running, waiting for completion");
      return;
    }

    isProcessing = true;

    try {
      const messages = await Message.findAll({
        where: {
          fromMe: true,
          messageId: { [Op.is]: null },
          status: "pending",
          isDeleted: { [Op.is]: false },
          [Op.or]: [
            { scheduleDate: { [Op.lte]: new Date() } },
            { scheduleDate: { [Op.is]: null } }
          ]
        },
        include: [
          {
            model: Contact,
            as: "contact",
            where: {
              tenantId: data.tenantId,
              number: {
                [Op.notIn]: ["", "null"]
              }
            }
          },
          {
            model: Ticket,
            as: "ticket",
            where: {
              tenantId: data.tenantId,
              status: "open",
              channel: data.sessionId
            },
            include: ["contact"]
          },
          {
            model: Message,
            as: "quotedMsg",
            include: ["contact"]
          }
        ],
        order: [["createdAt", "ASC"]]
      });

      const wbotBaileys = await getWbotBaileys(data.sessionId);

      for (const message of messages) {
        const { ticket } = message;
        const contactNumber = ticket.contact.number;
        const isGroup = ticket?.isGroup;
        const chatId = `${contactNumber}@${isGroup ? "g" : "c"}.us`;

        let quotedMessage: QuotedMessage | undefined;

        if (message.quotedMsg) {
          const quotedMsg = await GetWbotMessage(message.quotedMsg.messageId, "baileys");
          if (quotedMsg) {
            quotedMessage = {
              key: {
                id: quotedMsg.key.id
              },
              message: {
                conversation: message.quotedMsg.body
              }
            };
          }
        }

        try {
          let sentMessage;

          if (message.mediaType !== "chat" && message.mediaName && !message.isSticker) {
            const filePath = path.resolve(__dirname, "..", "..", "public", data.tenantId.toString());
            const mediaPath = path.resolve(filePath, message.mediaName);

            let messageOptions = await getMessageOptions(
              message.mediaName,
              mediaPath,
              message.body,
              data.tenantId.toString()
            );

            if (message.mediaName.endsWith(".webm")) {
              const mp4Path = filePath + "/" + message.mediaName.split(".")[0] + ".mp4";
              await convertWebmToMp4(mediaPath, mp4Path);
              messageOptions = await getMessageOptions(
                message.mediaName,
                mp4Path,
                message.body,
                data.tenantId.toString()
              );
            }

            try {
              sentMessage = await wbotBaileys.sendMessage(
                chatId,
                {
                  ...messageOptions,
                  contextInfo: {
                    forwardingScore: forceProcessing ? 999999 : 0,
                    isForwarded: forceProcessing ? true : false
                  }
                },
                { quoted: quotedMessage }
              );
              logger.info("Mensagem enviada com sucesso");
            } catch (error) {
              logger.error(`Error sending message (id: ${message.id})`);
            }

          } else if (message.mediaType !== "chat" && message.mediaName && message.isSticker) {
            const filePath = path.resolve(__dirname, "..", "..", "public", data.tenantId.toString());
            const stickerPath = message.mediaName;
            const newStickerPath = new Date().getTime() + ".webp";
            const mediaPath = path.resolve(filePath, stickerPath);
            const newPath = path.resolve(filePath, newStickerPath);

            await sharp(mediaPath).webp().toFile(newPath);

            if (newStickerPath.endsWith(".webp")) {
              try {
                sentMessage = await wbotBaileys.sendMessage(
                  chatId,
                  { sticker: readFileSync(newPath) },
                  { quoted: quotedMessage }
                );
                unlinkSync(newPath);
                logger.info("Sticker enviado com sucesso");
              } catch (error) {
                logger.error(`Error sending message sticker (id: ${message.id}): ${error}`);
              }
            } else {
              await Message.update(
                { isDeleted: true },
                { where: { id: message.id }}
              );
              logger.error("Invalid media format");
            }

          } else {
            try {
              sentMessage = await wbotBaileys.sendMessage(
                chatId,
                {
                  text: message.body,
                  contextInfo: {
                    forwardingScore: forceProcessing ? 999999 : 0,
                    isForwarded: forceProcessing ? true : false
                  }
                },
                { quoted: quotedMessage }
              );
              logger.info("Mensagem de texto enviada com sucesso");
            } catch (error) {
              logger.error(`Error sending message (id: ${message.id})`);
            }
          }

          if (sentMessage) {
            await Message.update(
              {
                ...message,
                messageId: sentMessage.key.id || "keynotfound_" + uuidv4(),
                status: "sended",
                ack: 1,
                dataJson: JSON.stringify(sentMessage)
              },
              { where: { id: message.id }}
            );

            const updatedMessage = await Message.findOne({
              where: { id: message.id }
            });

            if (!updatedMessage) return;

            socketEmitter({
              tenantId: data.tenantId,
              type: "chat:ack",
              payload: updatedMessage
            });

            logger.info(`Message updated successfully (id: ${sentMessage.key.id})`);
          }

          await sleepRandomTime({
            minMilliseconds: Number(process.env.MIN_SLEEP_INTERVAL || 100),
            maxMilliseconds: Number(process.env.MAX_SLEEP_INTERVAL || 1000)
          });

          const ticketData = {
            id: ticket.id,
            tenantId: data.tenantId  
          };

          const ticketService = await ShowTicketService(ticketData);
          await ticketService.update({
            lastMessage: message.body || "🗸"
          });

          socketEmitter({
            tenantId: data.tenantId,
            type: "ticket:update",
            payload: ticketService
          });

        } catch (error) {
          const messageId = message.id;
          const ticketId = message.ticket.id;
          
          console.error(error);

          if (error.code === "ENOENT") {
            await Message.destroy({ where: { id: message.id }});
          }

          logger.error(
            `Error sending message ${messageId} to ticket ${ticketId} (tenant: ${data.tenantId})`
          );
        }

        if (message.ticket.status === "pending") {
          const ticket = await Ticket.findOne({
            where: { id: message.ticket.id }
          });

          if (ticket) {
            await ticket.update({ status: "open" });
          }
        }
      }

    } finally {
      isProcessing = false;
    }
  }
}; 