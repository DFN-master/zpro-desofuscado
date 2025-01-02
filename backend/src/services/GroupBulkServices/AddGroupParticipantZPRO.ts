import { WAMessage } from "whatsapp-web.js";
import AppError from "../../errors/AppError";
import GetTicketWbotById from "../../helpers/GetTicketWbotById";
import { logger } from "../../utils/logger";
import GroupChat from "../../structures/GroupChat";

interface AddGroupParticipantRequest {
  participants: string[];
  whatsappId: number;
}

const AddGroupParticipant = async ({
  participants,
  whatsappId
}: AddGroupParticipantRequest): Promise<void> => {
  const wbot = await GetTicketWbotById(whatsappId);

  try {
    // Formata os números dos participantes adicionando @c.us no final
    const formattedParticipants = participants.map(participant => {
      return participant.replace(/\D/g, "") + "@c.us";
    });

    // Obtém os chats e filtra apenas os grupos
    const chats = await wbot.getChats();
    const groups = chats.filter(chat => chat.isGroup);

    // Verifica se existem grupos
    if (groups.length === 0) {
      logger.info("ERR_ADD_PARTICIPANT_WHATSAPP_GROUP");
    } else {
      // Para cada grupo, adiciona os participantes com delay
      groups.forEach(async (group, index) => {
        setTimeout(async () => {
          try {
            if (group instanceof GroupChat) {
              await group.addParticipants(formattedParticipants);
            } else {
              throw new AppError("ERR_ADD_PARTICIPANT_WHATSAPP_GROUP");
            }
          } catch (err) {
            logger.error(`ERR_ADD_PARTICIPANT_WHATSAPP_GROUP: ${err}`);
            throw new AppError("ERR_ADD_PARTICIPANT_WHATSAPP_GROUP");
          }
        }, 
        // Adiciona delay crescente para cada grupo
        2000 * Math.floor(Math.random() * 10 * (index + 1))
        );
      });
    }

  } catch (err) {
    logger.error(`Comunidade ZDG - ERR_ADD_PARTICIPANT_WHATSAPP_GROUP: ${err}`);
    throw new AppError("ERR_ADD_PARTICIPANT_WHATSAPP_GROUP");
  }
};

export default AddGroupParticipant; 