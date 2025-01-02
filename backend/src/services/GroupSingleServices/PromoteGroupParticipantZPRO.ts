import { delay } from "@whiskeysockets/baileys";
import AppError from "../../errors/AppError";
import GetTicketWbotById from "../../helpers/GetTicketWbotById";
import { getWbotBaileys } from "../../libs/wbot-baileys";
import Whatsapp from "../../models/Whatsapp";
import { logger } from "../../utils/logger";
import GroupChat from "../../structures/GroupChat";

interface PromoteGroupParticipantRequest {
  participants: string[];
  whatsappId: number;
  groupId: string;
}

const PromoteGroupParticipant = async ({
  participants,
  whatsappId,
  groupId
}: PromoteGroupParticipantRequest): Promise<void> => {
  const whatsapp = await Whatsapp.findOne({
    where: { id: whatsappId }
  });

  if (whatsapp?.type === "baileys") {
    const wbot = await getWbotBaileys(whatsappId);

    const participantsList = participants.map(participant => {
      return `${participant.replace(/\D/g, "")}@c.us`;
    });

    try {
      await delay(1000);
      await wbot.groupParticipantsUpdate(groupId, participantsList, "promote");
    } catch (err) {
      logger.error(`:::ZDG :::ERR_PROMOTE_SINGLE_BAILEYS_PARTICIPANT_WAPP_GROUP: ${err}`);
      throw new AppError("ERR_PROMOTE_SINGLE_BAILEYS_PARTICIPANT_WAPP_GROUP");
    }
  } else {
    const wbot = await GetTicketWbotById(whatsappId);

    try {
      const participantsList = participants.map(participant => {
        return `${participant.replace(/\D/g, "")}@s.whatsapp.net`;
      });

      const chat = await wbot.getChatById(groupId);

      if (chat instanceof GroupChat) {
        await chat.promote(participantsList);
      } else {
        throw new AppError("ERR_PROMOTE_SINGLE_WWP_PARTICIPANT_WAPP_GROUP");
      }
    } catch (err) {
      logger.error(`:::Z-PRO :::ERR_PROMOTE_SINGLE_WP_PARTICIPANT_WAPP_GROUP: ${err}`);
      throw new AppError("ERR_PROMOTE_SINGLE_WWP_PARTICIPANT_WAPP_GROUP");
    }
  }
};

export default PromoteGroupParticipant; 