import { WASocket } from "@whiskeysockets/baileys";
import AppError from "../../errors/AppErrorZPRO";
import GetTicketWbot from "../../helpers/GetTicketWbotByIdZPRO";
import Whatsapp from "../../models/WhatsappZPRO";
import { logger } from "../../utils/loggerZPRO";
import GroupChat from "../../libs/whatsapp-web.js/src/structures/GroupChat";

interface SetAdminsMessagesOnlyGroupRequest {
  whatsappId: number;
  adminsOnly: boolean;
  groupId: string;
}

const SetAdminsMessagesOnlyGroup = async ({
  whatsappId,
  adminsOnly,
  groupId
}: SetAdminsMessagesOnlyGroupRequest): Promise<void> => {
  
  const whatsapp = await Whatsapp.findOne({
    where: { id: whatsappId }
  });

  if (whatsapp?.type === "baileys") {
    const wbot = await GetTicketWbot(whatsappId) as WASocket;

    try {
      await wbot.groupSettingUpdate(
        groupId,
        adminsOnly ? "announcement" : "not_announcement"
      );
    } catch (err) {
      logger.error(`:::: ZDG :::: Z-PRO :::: ERR_SET_ADMINS_ONLY_WAPP_GROUP: ${err}`);
      throw new AppError("ERR_SET_ADMINS_ONLY_WAPP_GROUP");
    }
  } else {
    const wbot = await GetTicketWbot(whatsappId);

    try {
      const chat = await wbot.getChatById(groupId);

      if (chat instanceof GroupChat) {
        await chat.setMessagesAdminsOnly(adminsOnly);
      } else {
        throw new AppError("ERR_SET_ADMINS_ONLY_WAPP_GROUP");
      }
    } catch (err) {
      logger.error(`:::: ZDG :::: Z-PRO :::: ERR_SET_ADMINS_ONLY_WAPP_GROUP: ${err}`);
      throw new AppError("ERR_SET_ADMINS_ONLY_WAPP_GROUP");
    }
  }
};

export default SetAdminsMessagesOnlyGroup; 