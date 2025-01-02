import { Request } from 'express';
import axios from 'axios';
import path from 'path';
import fs from 'fs';
import mime from 'mime-types';
import * as Sentry from '@sentry/node';
import { Readable } from 'stream';
import { v4 as uuidv4 } from 'uuid';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegStatic from 'ffmpeg-static';
import { MessageMedia } from 'whatsapp-web.js';

import Contact from '../../models/ContactZPRO';
import Message from '../../models/MessageZPRO';
import Ticket from '../../models/TicketZPRO';
import { logger } from '../../utils/loggerZPRO';
import socketEmit from '../../helpers/socketEmitZPRO';
import { getWbot } from '../WbotServiceZPRO';
import { getWbotBaileys } from '../WbotBaileysServiceZPRO';
import CheckIsValidContactBulk from '../CheckContactServices/CheckIsValidContactBulkZPRO';
import CheckIsValidBaileysContact from '../CheckContactServices/CheckIsValidBaileysContactZPRO';
import FindOrCreateTicketService from '../TicketServices/FindOrCreateTicketServiceZPRO';
import CreateMessageSystemService from '../MessageServices/CreateMessageSystemServiceZPRO';
import SendWABAMetaImageService from '../WABAMetaServices/SendWABAMetaImageServiceZPRO';
import SendWABAMetaAudioService from '../WABAMetaServices/SendWABAMetaAudioServiceZPRO';
import SendWABAMetaDocService from '../WABAMetaServices/SendWABAMetaDocServiceZPRO';
import SendWABAMetaVideoService from '../WABAMetaServices/SendWABAMetaVideoServiceZPRO';
import CreateOrUpdateContactService from '../ContactServices/CreateOrUpdateContactServiceZPRO';

interface MessageData {
  number: string;
  body?: string;
  mediaUrl?: string;
  tenantId: number;
  userId?: number;
  scheduleDate?: Date;
  sendType?: string;
  status?: string;
  idFront?: string;
}

interface MulterFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  buffer: Buffer;
  size: number;
  stream: Readable;
  destination: string;
  filename: string;
  path: string;
}

ffmpeg.setFfmpegPath(ffmpegStatic);

const publicFolder = path.join(__dirname, "..", "..", "..", "public");

const convertAudioToOgg = async (
  inputPath: string, 
  tenantId: number
): Promise<string> => {
  return new Promise((resolve, reject) => {
    try {
      const command = ffmpeg({ source: inputPath });
      const chunks: any[] = [];
      const outputFilename = new Date().getTime() + ".ogg";
      const outputPath = `${publicFolder}/${tenantId}/${outputFilename}`;

      command
        .toFormat("ogg")
        .noVideo()
        .audioCodec("libopus")
        .audioChannels(1)
        .audioBitrate(128000)
        .on("end", async () => {
          fs.writeFileSync(outputPath, Buffer.concat(chunks));
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
  filename: string,
  filePath: string, 
  caption: string | undefined,
  messageBody: string | undefined,
  tenantId: number
) => {
  const mimeType = mime.lookup(filePath);
  const messageCaption = caption || messageBody;

  if (!mimeType) {
    throw new Error("Invalid mimetype");
  }

  const fileType = mimeType.split("/")[0];

  try {
    let messageOptions: any;

    if (fileType === "video") {
      messageOptions = {
        video: fs.readFileSync(filePath),
        caption: undefined,
        fileName: filename
      };
    } else if (fileType === "audio") {
      const audioPath = await convertAudioToOgg(filePath, tenantId);
      messageOptions = {
        audio: fs.readFileSync(audioPath),
        mimetype: "ogg",
        ptt: true
      };
    } else if (fileType === "application" || fileType === "text") {
      messageOptions = {
        document: fs.readFileSync(filePath),
        caption: undefined,
        fileName: filename,
        mimetype: mimeType
      };
    } else {
      messageOptions = {
        image: fs.readFileSync(filePath),
        caption: undefined
      };
    }

    return messageOptions;
  } catch (err) {
    Sentry.captureException(err);
    logger.error(err);
    return null;
  }
};

interface WABAServiceMap {
  [key: string]: typeof SendWABAMetaVideoService | 
                 typeof SendWABAMetaImageService | 
                 typeof SendWABAMetaDocService |
                 typeof SendWABAMetaAudioService;
}

const mimetypeToService: WABAServiceMap = {
  "video/mp4": SendWABAMetaVideoService,
  "video/3gp": SendWABAMetaVideoService,
  "image/jpeg": SendWABAMetaImageService,
  "image/png": SendWABAMetaImageService,
  "application/pdf": SendWABAMetaDocService,
  "application/msword": SendWABAMetaDocService,
  "application/vnd.ms-excel": SendWABAMetaDocService,
  "application/vnd.ms-powerpoint": SendWABAMetaDocService,
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": SendWABAMetaDocService,
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": SendWABAMetaDocService,
  "application/vnd.openxmlformats-officedocument.presentationml.presentation": SendWABAMetaDocService,
  "audio/mp3": SendWABAMetaAudioService,
  "audio/mp4": SendWABAMetaAudioService,
  "audio/mpeg": SendWABAMetaAudioService,
  "audio/ogg": SendWABAMetaAudioService,
  "audio/amr": SendWABAMetaAudioService,
  "audio/aac": SendWABAMetaAudioService
};

async function downloadFileAndGetName(url: string, tenantId: number): Promise<string | null> {
  try {
    const response = await axios.get(url, { responseType: 'arraybuffer' });
    const buffer = Buffer.from(response.data);
    
    const { fileTypeFromBuffer } = await eval('import("file-type")');
    const fileType = await fileTypeFromBuffer(buffer);
    
    if (!fileType) {
      throw new Error("Não foi possível determinar o tipo do arquivo");
    }

    const extension = fileType.ext;
    const timestamp = Date.now();
    const filename = `bulk_${timestamp}.${extension}`;
    const filePath = path.join(__dirname, "..", "..", "..", "public", tenantId.toString(), filename);

    await fs.promises.writeFile(filePath, buffer);
    await new Promise(resolve => setTimeout(resolve, 1000));
    await fs.promises.access(filePath, fs.constants.F_OK | fs.constants.R_OK);

    logger.info(`::: ZDG ::: Z-PRO ::: Download concluído. Salvo como: ${filename}`);
    return filename;

  } catch (error) {
    logger.warn("Erro ao baixar o arquivo:", error);
    return null;
  }
}

function bufferToMulterFile(buffer: Buffer, filename: string, mimetype: string): MulterFile {
  return {
    fieldname: "file",
    originalname: filename,
    encoding: "7bit",
    mimetype,
    buffer,
    size: buffer.length,
    stream: Readable.from(buffer),
    destination: "",
    filename,
    path: ""
  };
}

async function readFileAndReturnMulterObject(
  filename: string, 
  tenantId: number,
  mimetype: string
): Promise<MulterFile | undefined> {
  try {
    const filePath = path.join(__dirname, "..", "..", "..", "public", tenantId.toString(), filename);
    const buffer = await fs.promises.readFile(filePath);
    return bufferToMulterFile(buffer, filename, mimetype);
  } catch (error) {
    logger.error("Erro ao ler o arquivo:", error);
    return undefined;
  }
}

export const sendMediaUrlService = async (
  messageData: MessageData,
  user: any,
  ticket?: Ticket,
  contact?: Contact
): Promise<{ status: string }> => {
  const { tenantId, number } = messageData;
  const cleanNumber = number.replace(/\D/g, "");

  try {
    if (contact?.whatsappId) {
      const wbot = getWbot(user.sessionId);
      const validContact = await CheckIsValidContactBulk(cleanNumber, tenantId);
      const messageMedia = await MessageMedia.fromUrl(messageData.mediaUrl!);
      await wbot.sendMessage(validContact.whatsappId || `${cleanNumber}@c.us`, messageMedia, {
        caption: messageData.body
      });
    }

    if (ticket?.whatsappId) {
      const wbot = await getWbotBaileys(user.sessionId);
      const validContact = await CheckIsValidBaileysContact(cleanNumber, tenantId);

      try {
        downloadFileAndGetName(messageData.mediaUrl!, tenantId).then(async filename => {
          if (filename) {
            const filePath = `${publicFolder}/${tenantId}/${filename}`;
            const messageOptions = await getMessageOptions(
              filename,
              filePath,
              messageData.body,
              messageData.body,
              tenantId.toString()
            );

            await wbot.sendMessage(
              validContact || `${cleanNumber}@s.whatsapp.net`,
              Object.assign({}, messageOptions)
            );

            try {
              const contact = await Contact.findOne({
                where: { number: cleanNumber, tenantId }
              });

              if (contact) {
                const ticket = await FindOrCreateTicketService({
                  contact,
                  userId: user.id,
                  unreadMessages: 0,
                  tenantId,
                  groupContact: undefined,
                  whatsappId: "baileys"
                });

                await CreateMessageSystemService({
                  msg: {
                    ...messageData,
                    fromMe: true
                  },
                  tenantId,
                  medias: undefined,
                  ticket,
                  userId: user.sessionId,
                  scheduleDate: undefined,
                  sendType: "baileys",
                  status: "sended",
                  idFront: uuidv4()
                });
              }
            } catch (error) {
              logger.error("Message sent error: ");
            }
          } else {
            logger.warn("Não foi possível baixar a imagem.");
          }
        });
      } catch (error) {
      }
    }

    if (contact?.waba) {
      downloadFileAndGetName(messageData.mediaUrl!, tenantId).then(async filename => {
        if (filename) {
          try {
            const contactData = {
              name: number,
              number: number,
              profilePicUrl: undefined,
              isGroup: false,
              isUser: false,
              isWAContact: false,
              tenantId,
              pushname: number
            };

            const contact = await CreateOrUpdateContactService(contactData);

            const idFront = uuidv4();

            const ticket = await FindOrCreateTicketService({
              contact,
              userId: user.id,
              unreadMessages: 0,
              tenantId,
              groupContact: undefined,
              whatsappId: "waba"
            });

            const mimeType = mime.lookup(publicFolder + "/" + filename);
            const multerFile = await readFileAndReturnMulterObject(
              filename,
              tenantId.toString(),
              mimeType!
            );

            await CreateMessageSystemService({
              msg: {
                ...messageData,
                fromMe: true
              },
              tenantId,
              medias: multerFile ? [multerFile] : undefined,
              ticket,
              userId: user.sessionId,
              scheduleDate: undefined,
              sendType: mimeType!.toString().split("/")[0],
              status: "pending",
              idFront
            });

            const ServiceClass = mimetypeToService[mimeType!];

            if (ServiceClass) {
              const service = new ServiceClass();
              let response;

              const mediaUrl = process.env.BACKEND_URL + "/public/" + tenantId + "/" + filename;

              switch (ServiceClass) {
                case SendWABAMetaImageService:
                  response = await service.sendImage({
                    number: cleanNumber,
                    apiKey: contact.tokenAPI!,
                    imageUrl: mediaUrl,
                    ticket,
                    tenantId,
                    idFront,
                    waba: contact,
                  });
                  break;

                case SendWABAMetaAudioService:
                  response = await service.sendAudio({
                    number: cleanNumber,
                    apiKey: contact.tokenAPI!,
                    audioUrl: mediaUrl,
                    ticket,
                    tenantId,
                    idFront,
                    waba: contact,
                  });
                  break;

                case SendWABAMetaDocService:
                  response = await service.sendDoc({
                    number: cleanNumber,
                    apiKey: contact.tokenAPI!,
                    docUrl: mediaUrl,
                    caption: filename,
                    ticket,
                    tenantId,
                    idFront,
                    waba: contact,
                  });
                  break;

                case SendWABAMetaVideoService:
                  response = await service.sendVideo({
                    number: cleanNumber,
                    apiKey: contact.tokenAPI!,
                    videoUrl: mediaUrl,
                    caption: filename,
                    ticket,
                    tenantId,
                    idFront,
                    waba: contact,
                  });
                  break;

                default:
                  throw new Error("Unsupported media type");
              }
            } else {
              logger.warn(`Unsupported mimetype: ${mimeType}`);
            }
          } catch (error) {
            logger.warn("Erro ao criar mensagem da API 5.", error);
          }
        } else {
          logger.warn("Não foi possível baixar a imagem.");
        }
      });
    }

    return { status: "Message sent successfully" };
  } catch (error) {
    return { status: "Message sent error: " + error };
  }
}; 