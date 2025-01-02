import { WAChat } from "whatsapp-web.js";
import AppErrorZPRO from "../../errors/AppErrorZPRO";
import GetTicketWbotByIdZPRO from "../../helpers/GetTicketWbotByIdZPRO";
import { logger } from "../../utils/loggerZPRO";
import GroupChat from "../../structures/GroupChat";

interface SetAdminsMessagesOnlyGroupData {
  whatsappId: number;
  adminsOnly: boolean;
}

const SetAdminsMessagesOnlyGroup = async ({
  whatsappId,
  adminsOnly
}: SetAdminsMessagesOnlyGroupData): Promise<void> => {
  const wbot = await GetTicketWbotByIdZPRO(whatsappId);

  try {
    const chats = await wbot.getChats();
    const groups = chats.filter((chat: WAChat) => chat.isGroup);

    if (groups.length === 0) {
      logger.info("WHATSAPP_GROUP::: ZDG ::: Comunidade ZDG - 0 groups.");
      return;
    }

    // Processa cada grupo com um delay aleatório para evitar sobrecarga
    groups.forEach(async (group, index) => {
      const delay = 2000 + Math.floor(Math.random() * 3) * (index + 1);

      setTimeout(async () => {
        try {
          if (group instanceof GroupChat) {
            await group.setAdminsOnly(adminsOnly);
          } else {
            throw new AppErrorZPRO("ERR_SET_ADMINS_ONLY_WAPP_GROUP");
          }
        } catch (err) {
          logger.info(`ERR_SET_ADMINS_ONLY_WAPP_GROUP::: ZDG ::: Comunidade ZDG - Error: ${err}`);
          throw new AppErrorZPRO("ERR_SET_ADMINS_ONLY_WAPP_GROUP");
        }
      }, delay);
    });

  } catch (err) {
    logger.info(`ERR_SET_ADMINS_ONLY_WAPP_GROUP::: Z-PRO Comunidade ZDG - Error ${err}`);
    throw new AppErrorZPRO("ERR_SET_ADMINS_ONLY_WAPP_GROUP");
  }
};

export default SetAdminsMessagesOnlyGroup; 