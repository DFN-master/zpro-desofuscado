import { WAMessage } from '@whiskeysockets/baileys';
import AppError from '../../errors/AppError';
import GetTicketWbot from '../../helpers/GetTicketWbot';
import { getWbot } from '../../libs/wbot';
import Whatsapp from '../../models/Whatsapp';
import { logger } from '../../utils/logger';
import GroupChat from '../../models/GroupChat';

interface RemoveGroupParticipantRequest {
  participants: string[];
  whatsappId: number;
  groupId: string;
}

const RemoveGroupParticipant = async ({
  participants,
  whatsappId,
  groupId
}: RemoveGroupParticipantRequest): Promise<void> => {
  
  // Busca a conexão do WhatsApp
  const whatsapp = await Whatsapp.findOne({
    where: { id: whatsappId }
  });

  // Verifica se é uma conexão do tipo Baileys
  if (whatsapp?.type === 'baileys') {
    try {
      const wbot = await getWbot(whatsappId);
      
      // Formata os números dos participantes
      const formattedNumbers = participants.map(participant => 
        `${participant.replace(/\D/g, '')}@s.whatsapp.net`
      );

      // Remove os participantes do grupo
      await wbot.groupParticipantsUpdate(
        groupId,
        formattedNumbers,
        'remove'
      );

    } catch (error) {
      logger.error(`::: Z-PRO ::: ERR_REMOVE_GROUP_PARTICIPANT_WAPP_GROUP: ${error}`);
      throw new AppError('ERR_REMOVE_GROUP_PARTICIPANT_WAPP_GROUP');
    }
  } else {
    // Para outros tipos de conexão
    try {
      const wbot = await GetTicketWbot(whatsappId);
      
      // Formata os números dos participantes
      const formattedNumbers = participants.map(participant =>
        `${participant.replace(/\D/g, '')}@c.us`
      );

      const chat = await wbot.getChatById(groupId);

      if (chat instanceof GroupChat) {
        await chat.removeParticipants(formattedNumbers);
      } else {
        throw new AppError('ERR_REMOVE_PARTICIPANT_WAPP_GROUP');
      }

    } catch (error) {
      logger.error(`::: ZDG ::: ERR_REMOVE_PARTICIPANT_WAPP_GROUP: ${error}`);
      throw new AppError('ERR_REMOVE_PARTICIPANT_WAPP_GROUP');
    }
  }
};

export default RemoveGroupParticipant; 