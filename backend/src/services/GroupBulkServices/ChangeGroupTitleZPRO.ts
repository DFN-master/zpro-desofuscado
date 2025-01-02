import { Request } from 'express';
import AppError from '../../errors/AppError';
import GetTicketWbot from '../../helpers/GetTicketWbotById';
import { logger } from '../../utils/logger';
import GroupChat from '../../models/GroupChat';
import Contact from '../../models/Contact';

interface ChangeGroupTitleData {
  title: string;
  whatsappId: number;
}

const ChangeGroupTitle = async ({
  title,
  whatsappId
}: ChangeGroupTitleData): Promise<void> => {
  const wbot = await GetTicketWbot(whatsappId);

  try {
    const newTitle = title;

    const chats = await wbot.getChats();
    const groups = chats.filter(chat => chat.isGroup);

    if (groups.length === 0) {
      logger.info("ERR_CHANGING_GROUP_TITLE_WAPP_GROUP: No groups found");
      return;
    }

    // Processa cada grupo encontrado
    for (let i = 0; i < groups.length; i++) {
      const group = groups[i];
      
      // Adiciona um delay aleatório para evitar bloqueio do WhatsApp
      const delay = 3000 + Math.floor(Math.random() * 7000) * (i + 1);
      
      await new Promise(resolve => setTimeout(resolve, delay));

      try {
        if (group instanceof GroupChat) {
          await group.setSubject(newTitle);

          // Atualiza o título do grupo no banco de dados
          const contact = await Contact.findOne({
            where: {
              number: group.id._serialized.replace(/\D/g, '')
            }
          });

          if (contact) {
            await contact.update({
              name: newTitle
            });
          }
        } else {
          throw new AppError("ERR_CHANGING_GROUP_TITLE_WAPP_GROUP");
        }
      } catch (err) {
        logger.error(`ERR_CHANGING_GROUP_TITLE_WAPP_GROUP: ${err}`);
        throw new AppError("ERR_CHANGING_GROUP_TITLE_WAPP_GROUP");
      }
    }

  } catch (err) {
    logger.error(`ERR_CHANGING_GROUP_TITLE_WAPP_GROUP: ${err}`);
    throw new AppError("ERR_CHANGING_GROUP_TITLE_WAPP_GROUP");
  }
};

export default ChangeGroupTitle; 