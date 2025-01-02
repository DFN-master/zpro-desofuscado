import { MessageMedia } from 'whatsapp-web.js';
import AppError from '../../errors/AppError';
import GetTicketWbotById from '../../helpers/GetTicketWbotById';
import logger from '../../utils/logger';

interface SendGroupMediaRequest {
  media: string;
  whatsappId: number;
  groupId: string;
  caption?: string;
}

const SendGroupMedia = async ({
  media,
  whatsappId,
  groupId,
  caption
}: SendGroupMediaRequest): Promise<any> => {
  const wbot = await GetTicketWbotById(whatsappId);

  try {
    const mediaMessage = await MessageMedia.fromUrl(media);
    
    const sentMessage = await wbot.sendMessage(
      `${groupId.replace(/\D/g, '')}@g.us`,
      mediaMessage,
      { caption }
    );

    return sentMessage;

  } catch (error) {
    logger.info(`::: ZDG ::: Z-PRO ::: Comunidade ZDG - ERR_SEND_MEDIA_WAPP_GROUP: ${error}`);
    throw new AppError('ERR_SEND_MEDIA_WAPP_GROUP');
  }
};

export default SendGroupMedia; 