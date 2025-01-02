import { MessageMedia } from 'whatsapp-web.js';
import AppError from '../../errors/AppError';
import GetTicketWbot from '../../helpers/GetTicketWbotById';
import { logger } from '../../utils/logger';
import GroupChat from 'whatsapp-web.js/src/structures/GroupChat';

interface SendGroupVoiceRequest {
  media: string;
  whatsappId: number;
}

const SendGroupVoice = async ({
  media,
  whatsappId
}: SendGroupVoiceRequest): Promise<void> => {
  const wbot = await GetTicketWbot(whatsappId);

  try {
    const mediaMessage = await MessageMedia.fromUrl(media);

    const chats = await wbot.getChats();
    const groups = chats.filter(chat => chat.isGroup);

    if (groups.length === 0) {
      logger.info("::: Z-PRO ::: ZDG ::: Comunidade ZDG - 0 groups.");
      return;
    }

    groups.forEach(async (group, index) => {
      setTimeout(async () => {
        try {
          if (group instanceof GroupChat) {
            await wbot.sendMessage(group.id._serialized, mediaMessage, {
              sendAudioAsVoice: true
            });
          } else {
            throw new AppError("ERR_SEND_VOICE_WAPP_GROUP");
          }
        } catch (err) {
          logger.error(`ERR_SEND_VOICE_WAPP_GROUP: ${err}`);
          throw new AppError("ERR_SEND_MESSAGE_WAPP_GROUP");
        }
      }, 2000 * Math.floor(Math.random() * 5 + index + 1));
    });

  } catch (err) {
    logger.error(`ERR_SEND_VOICE_WAPP_GROUP: ${err}`);
    throw new AppError("ERR_SEND_VOICE_WAPP_GROUP");
  }
};

export default SendGroupVoice; 