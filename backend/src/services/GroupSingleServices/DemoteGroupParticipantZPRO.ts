import { WAMessage } from "@whiskeysockets/baileys";
import AppError from "../../errors/AppError";
import GetTicketWbot from "../../helpers/GetTicketWbot";
import { getWbot } from "../../libs/wbot";
import Whatsapp from "../../models/Whatsapp";
import { logger } from "../../utils/logger";
import { GroupChat } from "../../models/GroupChat";

interface DemoteGroupParticipantRequest {
  participants: string[];
  whatsappId: number;
  groupId: string;
}

const DemoteGroupParticipant = async ({
  participants,
  whatsappId,
  groupId
}: DemoteGroupParticipantRequest): Promise<void> => {
  
  const whatsapp = await Whatsapp.findOne({
    where: { id: whatsappId }
  });

  if (whatsapp?.type === "baileys") {
    const wbot = await getWbot(whatsappId);

    const participantsList = participants.map(participant => {
      return `${participant.replace(/\D/g, "")}@s.whatsapp.net`;
    });

    try {
      await wbot.groupParticipantsUpdate(
        groupId,
        participantsList,
        "demote"
      );
    } catch (err) {
      logger.error(`Z-PRO ::: ZDG ::: ERR_DEMOTE_PARTICIPANT_WAPP_GROUP: ${err}`);
      throw new AppError("ERR_DEMOTE_PARTICIPANT_WAPP_GROUP");
    }

  } else {
    const wbot = await GetTicketWbot(whatsappId);

    try {
      const participantsList = participants.map(participant => {
        return `${participant.replace(/\D/g, "")}@c.us`;
      });

      const chat = await wbot.getChatById(groupId);

      if (chat instanceof GroupChat) {
        await chat.demoteParticipants(participantsList);
      } else {
        throw new AppError("ERR_DEMOTE_PARTICIPANT_WAPP_GROUP");
      }
    } catch (err) {
      logger.error(`Z-PRO ::: ZDG ::: ERR_DEMOTE_PARTICIPANT_WAPP_GROUP: ${err}`);
      throw new AppError("ERR_DEMOTE_PARTICIPANT_WAPP_GROUP");
    }
  }
};

export default DemoteGroupParticipant; 