import AppError from '../../errors/AppErrorZPRO';
import GetTicketWbot from '../../helpers/GetTicketWbotByIdZPRO';
import { logger } from '../../utils/loggerZPRO';
import { MessageMedia } from 'whatsapp-web.js';
import GroupChat from 'whatsapp-web.js/src/structures/GroupChat';

interface SendGroupMediaRequest {
  media: string;
  whatsappId: number;
  caption?: string;
}

const SendGroupMedia = async ({
  media,
  whatsappId,
  caption
}: SendGroupMediaRequest): Promise<void> => {
  const wbot = await GetTicketWbot(whatsappId);

  try {
    const mediaMessage = await MessageMedia.fromUrl(media);

    const chats = await wbot.getChats();
    
    chats.then(async (results) => {
      const groups = results.filter(chat => chat.isGroup);

      if (groups.length === 0) {
        logger.info('ERR_SEND_MEDIA_WAPP_GROUP: No groups.');
        return;
      }

      groups.forEach(async (group, index) => {
        setTimeout(async () => {
          try {
            if (group instanceof GroupChat) {
              await wbot.sendMessage(
                group.id._serialized,
                mediaMessage,
                { caption }
              );
            } else {
              throw new AppError('ERR_SEND_MEDIA_WAPP_GROUP');
            }
          } catch (err) {
            logger.error(`ERR_SEND_MEDIA_WAPP_GROUP: ${err}`);
            throw new AppError('ERR_SEND_MEDIA_WAPP_GROUP');
          }
        }, 
        // Add delay between messages to avoid flooding
        1000 * Math.floor(Math.random() * 5) * (index + 1));
      });
    });

  } catch (err) {
    logger.error(`ERR_SEND_MEDIA_WAPP_GROUP: ${err}`);
    throw new AppError('ERR_SEND_MEDIA_WAPP_GROUP');
  }
};

export default SendGroupMedia; 