import { Baileys } from "../../models/Baileys";
import { logger } from "../../utils/loggerZPRO";

interface BaileysData {
  whatsappId: string;
  contacts?: any[];
  chats?: any[];
}

const createOrUpdateBaileysService = async ({
  whatsappId,
  contacts,
  chats
}: BaileysData): Promise<Baileys> => {
  try {
    const baileysExists = await Baileys.findOne({
      where: { whatsappId }
    });

    if (baileysExists) {
      if (chats) {
        const existingChats = baileysExists.chats ? JSON.parse(baileysExists.chats) : [];
        existingChats.push(...chats);
        existingChats.sort();

        // Remove duplicates based on id
        const uniqueChats = existingChats.filter(
          (chat: any, index: number, self: any[]) => 
            self.findIndex(c => c.id === chat.id) === index
        );

        return await baileysExists.update({
          chats: JSON.stringify(uniqueChats)
        });
      }

      if (contacts) {
        const existingContacts = baileysExists.contacts 
          ? JSON.parse(baileysExists.contacts) 
          : [];
        existingContacts.push(...contacts);
        existingContacts.sort();

        // Remove duplicates based on id
        const uniqueContacts = existingContacts.filter(
          (contact: any, index: number, self: any[]) =>
            self.findIndex(c => c.id === contact.id) === index
        );

        return await baileysExists.update({
          contacts: JSON.stringify(uniqueContacts)
        });
      }
    }

    // Create new record if doesn't exist
    const baileys = await Baileys.create({
      whatsappId,
      contacts: JSON.stringify(contacts),
      chats: JSON.stringify(chats)
    });

    // Add small delay after creation
    await new Promise(resolve => setTimeout(resolve, 100));
    
    return baileys;

  } catch (err) {
    logger.warn(
      "Z-PRO ::: error_create_or_update_baileys", 
      err,
      whatsappId,
      contacts
    );
    throw new Error(err as string);
  }
};

export { createOrUpdateBaileysService }; 