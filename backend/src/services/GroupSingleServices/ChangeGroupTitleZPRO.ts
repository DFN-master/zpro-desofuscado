import AppError from '../../errors/AppError';
import GetTicketWbotById from '../../helpers/GetTicketWbotById';
import { logger } from '../../utils/logger';
import GroupChat from '../../models/GroupChat';
import Contact from '../../models/Contact';
import Whatsapp from '../../models/Whatsapp';
import { getWbotBaileys } from '../../libs/wbot-baileys';

interface ChangeGroupTitleRequest {
  title: string;
  whatsappId: number;
  groupId: string;
}

const ChangeGroupTitle = async ({
  title,
  whatsappId,
  groupId
}: ChangeGroupTitleRequest): Promise<void> => {
  // Busca a conexão do WhatsApp
  const whatsapp = await Whatsapp.findOne({
    where: { id: whatsappId }
  });

  // Verifica se é uma conexão do tipo baileys
  if (whatsapp?.type === "baileys") {
    const wbot = await getWbotBaileys(whatsappId);

    try {
      // Atualiza o título do grupo
      await wbot.groupUpdateSubject(groupId, title);

      // Atualiza o contato no banco de dados
      const contact = await Contact.findOne({
        where: { number: groupId.replace(/\D/g, '') }
      });

      if (contact) {
        await contact.update({ name: title });
      }

    } catch (err) {
      logger.error(`::: Z-PRO ::: ERR_CHANGING_TITLE_WAPP_GROUP: ${err}`);
      throw new AppError("ERR_CHANGING_TITLE_WAPP_GROUP");
    }

  } else {
    // Para outros tipos de conexão
    const wbot = await GetTicketWbotById(whatsappId);

    try {
      const newTitle = title;
      const chat = await wbot.getChatById(groupId);

      if (chat instanceof GroupChat) {
        await chat.setSubject(newTitle);

        const contact = await Contact.findOne({
          where: { number: groupId }
        });

        if (contact) {
          await contact.update({ name: newTitle });
        }
      } else {
        throw new AppError("ERR_CHANGING_TITLE_WAPP_GROUP");
      }

    } catch (err) {
      logger.error(`::: Z-PRO ::: ERR_CHANGING_TITLE_WAPP_GROUP: ${err}`);
      throw new AppError("ERR_CHANGING_TITLE_WAPP_GROUP");
    }
  }
};

export default ChangeGroupTitle; 