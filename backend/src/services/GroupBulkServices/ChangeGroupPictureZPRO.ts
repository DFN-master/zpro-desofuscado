import AppError from '../../errors/AppErrorZPRO';
import GetTicketWbot from '../../helpers/GetTicketWbotByIdZPRO';
import { logger } from '../../utils/loggerZPRO';
import GroupChat from '../../helpers/GroupChat';
import { MessageMedia } from 'whatsapp-web.js';

interface ChangeGroupPictureRequest {
  picture: string;
  whatsappId: number;
}

const ChangeGroupPicture = async ({
  picture,
  whatsappId
}: ChangeGroupPictureRequest): Promise<void> => {
  const wbot = await GetTicketWbot(whatsappId);

  try {
    const media = await MessageMedia.fromUrl(picture);

    const chats = await wbot.getChats();
    const groups = chats.filter(chat => chat.isGroup);

    if (groups.length === 0) {
      logger.info("Z-PRO ::: ZDG ::: Comunidade ZDG - 0 groups.");
      return;
    }

    // Processa cada grupo com delay aleatório para evitar bloqueios
    groups.forEach(async (chat, index) => {
      const delay = 3000 * (Math.floor(Math.random() * 10) + index * 1);
      
      setTimeout(async function() {
        try {
          if (chat instanceof GroupChat) {
            await chat.setPicture(media);
          } else {
            throw new AppError("ERR_CHANGING_PICTURE_WAPP_GROUP");
          }
        } catch (err) {
          logger.error(`ERR_CHANGING_PICTURE_WAPP_GROUP: ${err}`);
          throw new AppError("ERR_CHANGING_PICTURE_WAPP_GROUP");
        }
      }, delay);
    });

  } catch (err) {
    logger.error(`Z-PRO ::: ZDG ::: Comunidade ZDG - ERR_CHANGING_PICTURE_WAPP_GROUP: ${err}`);
    throw new AppError("ERR_CHANGING_PICTURE_WAPP_GROUP");
  }
};

export default ChangeGroupPicture; 