import { delay } from "@whiskeysockets/baileys";
import AppError from "../../errors/AppErrorZPRO";
import GetTicketWbotById from "../../helpers/GetTicketWbotByIdZPRO";
import { getWbotBaileys } from "../../libs/wbot-baileysZPRO";
import Whatsapp from "../../models/WhatsappZPRO";
import { logger } from "../../utils/loggerZPRO";
import GroupChat from "../../structures/GroupChat";

interface AddGroupParticipantRequest {
  participants: string[];
  whatsappId: number;
  groupId: string;
}

const AddGroupParticipant = async ({
  participants,
  whatsappId,
  groupId
}: AddGroupParticipantRequest): Promise<void> => {
  
  // Busca o WhatsApp conectado
  const whatsapp = await Whatsapp.findOne({
    where: { id: whatsappId }
  });

  // Verifica se é uma conexão ZPRO
  if (whatsapp?.type === "ZPRO") {
    const wbot = await getWbotBaileys(whatsappId);

    // Formata os números dos participantes
    const formattedParticipants = participants.map(
      participant => `${participant.replace(/\D/g, "")}@s.whatsapp.net`
    );

    try {
      logger.info(`ADD_PARTICIPANT_WAPP_GROUP: ${groupId}`, formattedParticipants);

      // Adiciona os participantes com delay entre cada um
      for (const participant of formattedParticipants) {
        await delay(1000);
        await wbot.groupParticipantsUpdate(
          groupId,
          [participant],
          "add"
        );
      }

    } catch (err) {
      logger.info(`ERR_ADD_PARTICIPANT_WAPP_GROUP: ${err}`);
      throw new AppError("ERR_ADD_PARTICIPANT_WAPP_GROUP");
    }

  } else {
    // Conexão não ZPRO
    const wbot = await GetTicketWbotById(whatsappId);

    try {
      const formattedParticipants = participants.map(
        participant => `${participant.replace(/\D/g, "")}@c.us`
      );

      const chat = await wbot.getChatById(groupId);

      if (chat instanceof GroupChat) {
        await chat.addParticipants(formattedParticipants);
      } else {
        throw new AppError("ERR_ADD_PARTICIPANT_WAPP_GROUP");
      }

    } catch (err) {
      logger.info(`ERR_ADD_PARTICIPANT_WAPP_GROUP: ${err}`);
      throw new AppError("ERR_ADD_PARTICIPANT_WAPP_GROUP");
    }
  }
};

export default AddGroupParticipant; 