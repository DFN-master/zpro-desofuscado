import { Op } from "sequelize";
import { v4 as uuidv4 } from "uuid";
import { logger } from "../utils/loggerZPRO";
import Contact from "../models/ContactZPRO";
import { getWbot } from "../libs/wbotZPRO";
import CheckIsValidContactBulkZPRO from "../services/CheckIsValidContactBulkZPRO";
import { getWbotBaileys } from "../libs/wbot-baileysZPRO";
import CheckIsValidBaileysContactZPRO from "../services/CheckIsValidBaileysContactZPRO";
import SendWABAMetaTextServiceZPRO from "../services/WABAMetaTextServiceZPRO";
import FindOrCreateTicketServiceZPRO from "../services/TicketServiceZPRO";
import CreateMessageSystemServiceZPRO from "../services/MessageSystemServiceZPRO";
import { pupa } from "../utils/pupaZPRO";
import { SendTextMessageServiceNoCreate } from "../services/SendTextMessageServiceNoCreateZPRO";
import { SendTextMessageService } from "../services/SendTextMessageServiceZPRO";

interface JobData {
  id: number;
  birthdayMessage: string;
  tenantId: number;
  channel: string;
  tokenAPI?: string;
  type?: string;
}

interface ContactAttributes {
  id: number;
  name: string;
  number: string;
  email?: string;
  phoneNumber: string;
  firstName?: string;
  lastName?: string;
  businessName?: string;
  birthdayDate?: string;
}

const timer = (ms: number): Promise<void> => new Promise(resolve => setTimeout(resolve, ms));

const randomIntFromInterval = (min: number, max: number): number => {
  return Math.floor(Math.random() * (max - min + 1) + min);
};

const rndInt = randomIntFromInterval(3000, 5000);

const checkBirthday = (date: string): boolean => {
  const today = new Date();
  const [day, month] = date.split("/").map(Number);
  return today.getDate() === day && today.getMonth() + 1 === month;
};

let isProcessing = false;

export default {
  async handle(job: JobData): Promise<void> {
    if (isProcessing) {
      logger.info("Process already running, waiting for completion");
      return;
    }

    isProcessing = true;

    try {
      const contacts = await Contact.findAll({
        where: {
          tenantId: job.tenantId,
          birthdayDate: {
            [Op.ne]: null
          }
        },
        attributes: [
          "id",
          "name",
          "number",
          "email",
          "phoneNumber",
          "birthdayDate"
        ]
      });

      for (const contact of contacts) {
        if (contact.birthdayDate && checkBirthday(contact.birthdayDate)) {
          const message = pupa(job.birthdayMessage || "", {
            name: contact?.name || "",
            email: contact?.email || "",
            phoneNumber: contact?.phoneNumber || "",
            firstName: contact?.firstName || "",
            lastName: contact?.lastName || "",
            businessName: contact?.businessName || ""
          });

          if (job.channel === "whatsapp") {
            const wbot = getWbot(parseInt(job.id, 10));
            const validNumber = await CheckIsValidContactBulkZPRO(
              contact.phoneNumber,
              job.tenantId
            );
            await wbot.sendMessage(validNumber.number, message);
          }

          if (job.channel === "baileys") {
            const wbot = await getWbotBaileys(parseInt(job.id, 10));
            const validNumber = await CheckIsValidBaileysContactZPRO(
              contact.phoneNumber,
              job.tenantId
            );
            await wbot.sendMessage(validNumber, { text: message });

            const ticket = await FindOrCreateTicketServiceZPRO({
              contact,
              whatsappId: job.id,
              unreadMessages: 0,
              tenantId: job.tenantId,
              groupContact: undefined,
              channel: "baileys"
            });

            const messageData = {
              body: job.birthdayMessage,
              fromMe: true,
              read: true
            };

            await CreateMessageSystemServiceZPRO({
              msg: messageData,
              tenantId: job.tenantId,
              ticket,
              sendType: "birthday",
              status: "pending"
            });
          }

          // Adicione aqui o código para outros canais (waba, messenger etc)
          
          await timer(rndInt * 1000);
        }
      }
    } finally {
      isProcessing = false;
    }
  }
}; 