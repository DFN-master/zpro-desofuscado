import { Request } from 'express';
import AppError from '../../errors/AppErrorZPRO';
import GetTicketWbotById from '../../helpers/GetTicketWbotByIdZPRO';
import { logger } from '../../utils/loggerZPRO';
import GroupChat from 'whatsapp-web.js/src/structures/GroupChat';

interface ChangeGroupDescriptionRequest {
  description: string;
  whatsappId: number;
}

const ChangeGroupDescription = async ({
  description,
  whatsappId
}: ChangeGroupDescriptionRequest): Promise<void> => {
  const wbot = await GetTicketWbotById(whatsappId);

  try {
    const newDescription = description;

    wbot.getChats().then(chats => {
      const groups = chats.filter(chat => chat.isGroup);

      if (groups.length === 0) {
        logger.info("ERR_CHANGING_DESCRIPTION_WAPP_GROUP");
        return;
      }

      groups.forEach(async (group, index) => {
        setTimeout(async () => {
          try {
            if (group instanceof GroupChat) {
              await group.setDescription(newDescription);
            } else {
              throw new AppError("ERR_CHANGING_DESCRIPTION_WAPP_GROUP");
            }
          } catch (err) {
            logger.error(`ERR_CHANGING_DESCRIPTION_WAPP_GROUP: ${err}`);
            throw new AppError("ERR_CHANGING_DESCRIPTION_WAPP_GROUP");
          }
        }, 1000 * Math.floor(Math.random() * 5) * (index + 1));
      });
    });

  } catch (err) {
    logger.error(`ERR_CHANGING_DESCRIPTION_WAPP_GROUP: ${err}`);
    throw new AppError("ERR_CHANGING_DESCRIPTION_WAPP_GROUP");
  }
};

export default ChangeGroupDescription; 