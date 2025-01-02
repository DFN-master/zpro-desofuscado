import { logger } from '../../util/logger';
import AppError from '../../errors/AppError';
import GetTicketWbot from '../../helpers/GetTicketWbot';
import { GroupChat } from 'whatsapp-web.js/src/structures';
import { Chat } from 'whatsapp-web.js';

interface PromoteGroupParticipantRequest {
  participants: string[];
  whatsappId: number;
}

const PromoteGroupParticipant = async ({
  participants,
  whatsappId
}: PromoteGroupParticipantRequest): Promise<void> => {
  const wbot = await GetTicketWbot(whatsappId);

  try {
    // Formata os números dos participantes adicionando @c.us no final
    const formattedParticipants = participants.map(
      participant => participant.replace(/\D/g, '') + '@c.us'
    );

    // Obtém todos os chats
    const chats = await wbot.getChats();
    
    // Filtra apenas os grupos
    const groups = chats.filter((chat: Chat) => chat.isGroup);

    if (groups.length === 0) {
      logger.info('APP_GROUP: Comunidade ZDG - 0 groups.');
      return;
    }

    // Para cada grupo, promove os participantes com delay
    groups.forEach((group, index) => {
      setTimeout(async () => {
        try {
          if (group instanceof GroupChat) {
            await group.promoteParticipants(formattedParticipants);
          } else {
            throw new AppError('ERR_PROMOTE_BULK_PARTICIPANT_WAPP_GROUP');
          }
        } catch (err) {
          logger.error(`ERR_PROMOTE_BULK_PARTICIPANT_WAPP_GROUP: ${err}`);
          throw new AppError('ERR_PROMOTE_BULK_PARTICIPANT_WAPP_GROUP');
        }
      }, 2000 * Math.floor(Math.random() * (index + 1))); // Delay aleatório entre as promoções
    });

  } catch (err) {
    logger.error(`ERR_PROMOTE_BULK_PARTICIPANT_WAPP_GROUP: ZDG ::: Z-PRO ::: ${err}`);
    throw new AppError('ERR_PROMOTE_BULK_PARTICIPANT_WAPP_GROUP');
  }
};

export default PromoteGroupParticipant; 