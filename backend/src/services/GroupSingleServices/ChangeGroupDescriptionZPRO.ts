import AppError from "../../errors/AppError";
import GetTicketWbotById from "../../helpers/GetTicketWbotById";
import { getWbotBaileys } from "../../libs/wbot-baileys";
import Whatsapp from "../../models/Whatsapp";
import { logger } from "../../utils/logger";
import GroupChat from "../../models/structures/GroupChat";

interface ChangeGroupDescriptionRequest {
  description: string;
  whatsappId: number;
  groupId: string;
}

const ChangeGroupDescription = async ({
  description,
  whatsappId,
  groupId
}: ChangeGroupDescriptionRequest): Promise<void> => {
  const whatsapp = await Whatsapp.findOne({
    where: { id: whatsappId }
  });

  // Verifica se é uma conexão baileys
  if (whatsapp?.type === "baileys") {
    const wbot = await getWbotBaileys(whatsappId);

    try {
      await wbot.groupUpdateDescription(groupId, description);
    } catch (err) {
      logger.info(`::: ZDG ::: ERR_CHANGING_DESCRIPTION_WAPP_GROUP: ${err}`);
      throw new AppError("ERR_CHANGING_DESCRIPTION_WAPP_GROUP");
    }
  } else {
    // Caso não seja baileys, usa o ticket wbot
    const wbot = await GetTicketWbotById(whatsappId);

    try {
      const newDescription = description;
      const chat = await wbot.getChatById(groupId);

      if (chat instanceof GroupChat) {
        await chat.setDescription(newDescription);
      } else {
        throw new AppError("ERR_CHANGING_DESCRIPTION_WAPP_GROUP");
      }
    } catch (err) {
      logger.info(`::: ZDG ::: ERR_CHANGING_DESCRIPTION_WAPP_GROUP: ${err}`);
      throw new AppError("ERR_CHANGING_DESCRIPTION_WAPP_GROUP");
    }
  }
};

export default ChangeGroupDescription; 