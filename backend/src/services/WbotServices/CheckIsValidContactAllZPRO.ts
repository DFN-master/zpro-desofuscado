import { Contact as WhatsappContact } from "whatsapp-web.js";
import { WAChat } from "@whiskeysockets/baileys";
import GetDefaultWhatsApp from "../GetDefaultWhatsAppZPRO";
import GetBaileysDefaultWhatsApp from "../GetBaileysDefaultWhatsAppZPRO";
import Contact from "../../models/ContactZPRO";
import { getWbot } from "../../libs/wbotZPRO";
import { getWbotBaileys } from "../../libs/wbot-baileysZPRO";
import logger from "../../utils/loggerZPRO";

const timer = (ms: number): Promise<void> => new Promise(resolve => setTimeout(resolve, ms));

const randomIntFromInterval = (min: number, max: number): number => {
  return Math.floor(Math.random() * (max - min + 1) + min);
};

const rndInt = randomIntFromInterval(1, 3);

interface ContactAttributes {
  number: string;
  isGroup: boolean;
  tenantId: number | string;
}

const CheckIsValidContactAll = async (tenantId: number | string): Promise<void> => {
  const defaultWhatsapp = await GetDefaultWhatsApp(tenantId);

  if (defaultWhatsapp.type === "baileys") {
    const whatsapp = await GetBaileysDefaultWhatsApp(tenantId);
    const wbot = await getWbotBaileys(whatsapp.id);

    const contacts = await Contact.default.findAll({
      where: { tenantId }
    });

    for (const contact of contacts) {
      try {
        if (!contact.isGroup) {
          const [phoneContact] = await wbot.onWhatsApp(
            `${contact.number}@s.whatsapp.net`
          );

          if (!phoneContact) {
            logger.info(
              `:::: Z-PRO :::: CheckIsValidContact | Update: Invalid number ${contact.number}`
            );
          } else {
            await contact.update({
              number: phoneContact.jid.split("@")[0]
            });
            
            await timer(rndInt * 1000);
            
            logger.info(
              `:::: Z-PRO :::: CheckIsValidContact | Update: Valid number updated: ${phoneContact.jid}`
            );
          }
        }
      } catch (err: any) {
        logger.warn(
          `:::: Z-PRO :::: CheckIsValidContact | Error with contact ${contact.number}: ${err}`
        );
        
        if (err.message !== "ERR_WAPP_CHECK_CONTACT") {
          logger.warn("ERR_WAPP_CHECK_CONTACT");
        }
      }
    }
  } else {
    const wbot = getWbot(defaultWhatsapp.id);
    
    const contacts = await Contact.default.findAll({
      where: { tenantId }
    });

    for (const contact of contacts) {
      try {
        if (!contact.isGroup) {
          const phoneContact = await wbot.getNumberId(contact.number);

          if (!phoneContact) {
            logger.info(
              `:::: Z-PRO :::: CheckIsValidContact | Update: Invalid number ${contact.number}`
            );
          } else {
            await contact.update({
              number: phoneContact.user
            });
            
            await timer(rndInt * 1000);
            
            logger.info(
              `:::: Z-PRO :::: CheckIsValidContact | Update: Valid number updated: ${phoneContact.user}`
            );
          }
        }
      } catch (err: any) {
        logger.warn(
          `:::: Z-PRO :::: CheckIsValidContact | Error with contact ${contact.number}: ${err}`
        );
        
        if (err.message !== "ERR_WAPP_CHECK_CONTACT") {
          logger.warn("ERR_WAPP_CHECK_CONTACT"); 
        }
      }
    }
  }
};

export default CheckIsValidContactAll; 