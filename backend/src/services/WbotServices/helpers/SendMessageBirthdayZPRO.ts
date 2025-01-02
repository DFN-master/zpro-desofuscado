import { Op } from "sequelize";
import { v4 as uuid } from "uuid";
import Contact from "../../../models/ContactZPRO";
import Whatsapp from "../../../models/WhatsappZPRO";
import { getWbot } from "../../WbotZPRO";
import { logger } from "../../../utils/loggerZPRO";
import CheckIsValidContactBulk from "../CheckIsValidContactBulkZPRO";
import { getBaileyswbot } from "../../WbotBaileysZPRO";
import CheckIsValidBaileysContact from "../CheckIsValidBaileysContactZPRO";
import SendWABAMetaTextService from "../../WABAMetaTextServiceZPRO";
import FindOrCreateTicketService from "../../TicketServices/FindOrCreateTicketServiceZPRO";
import CreateMessageSystemService from "../../MessageServices/CreateMessageSystemServiceZPRO";
import { pupa } from "../../../utils/pupaZPRO";

interface SendBirthdayData {
  value: number;
}

interface WhatsappData {
  id: number;
  tenantId: number;
  type: string;
  tokenAPI?: string;
  birthdayMessage?: string;
}

const timer = (ms: number): Promise<void> => new Promise(resolve => setTimeout(resolve, ms));

const randomIntFromInterval = (min: number, max: number): number => {
  return Math.floor(Math.random() * (max - min + 1) + min);
};

const rndInt = randomIntFromInterval(1000, 3000);

const checkBirthday = (date: string): boolean => {
  const today = new Date();
  const [day, month] = date.split("/").map(Number);
  return today.getDate() === day && today.getMonth() + 1 === month;
};

let isProcessing = false;

const SendMessageBirthday = async (data: SendBirthdayData): Promise<void> => {
  if (isProcessing) {
    logger.info("Process already running, waiting for completion");
    return;
  }

  isProcessing = true;

  try {
    const whatsapp = await Whatsapp.findOne({
      where: { id: data.value }
    });

    if (!whatsapp) return;

    const contacts = await Contact.findAll({
      where: {
        tenantId: whatsapp.tenantId,
        birthdayDate: { [Op.ne]: null }
      },
      attributes: [
        "id",
        "name",
        "number",
        "email",
        "birthdayDate",
        "createdAt"
      ]
    });

    for (const contact of contacts) {
      if (contact.birthdayDate && checkBirthday(contact.birthdayDate)) {
        const message = pupa(whatsapp.birthdayMessage || "", {
          name: contact?.name || "",
          email: contact?.email || "",
          phoneNumber: contact?.number || "",
          firstName: contact?.firstName || "",
          lastName: contact?.lastName || "",
          businessName: contact?.businessName || ""
        });

        if (whatsapp.type === "waba") {
          const wbot = getWbot(whatsapp.id);
          const validContact = await CheckIsValidContactBulk(contact.number, whatsapp.tenantId);
          await wbot.sendMessage(validContact.jid, message);
        }

        if (whatsapp.type === "baileys") {
          const wbot = await getBaileyswbot(whatsapp.id);
          const validContact = await CheckIsValidBaileysContact(contact.number, whatsapp.tenantId);
          await wbot.sendMessage(validContact, { text: message });

          const ticket = await FindOrCreateTicketService({
            contact,
            whatsappId: whatsapp.id,
            unreadMessages: 0,
            tenantId: whatsapp.tenantId,
            groupContact: undefined,
            channel: "baileys"
          });

          await CreateMessageSystemService({
            msg: {
              body: whatsapp.birthdayMessage,
              fromMe: true,
              read: true
            },
            tenantId: whatsapp.tenantId,
            ticket,
            sendType: "ZDG",
            status: "pending"
          });
        }

        if (whatsapp.type === "waba") {
          const ticket = await FindOrCreateTicketService({
            contact,
            whatsappId: whatsapp.id,
            unreadMessages: 0,
            tenantId: whatsapp.tenantId,
            groupContact: undefined,
            channel: "waba"
          });

          const messageId = uuid();
          const wabaService = new SendWABAMetaTextService();

          await wabaService.sendMessage({
            number: contact.number,
            externalApiId: whatsapp.tokenAPI,
            ticket,
            message,
            tenantId: whatsapp.tenantId,
            messageId,
            whatsapp
          });
        }

        await timer(rndInt * 1000);
      }
    }
  } finally {
    isProcessing = false;
  }
};

export default SendMessageBirthday; 