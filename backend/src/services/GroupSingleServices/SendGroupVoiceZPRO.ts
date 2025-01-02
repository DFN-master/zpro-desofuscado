import { MessageMedia } from 'whatsapp-web.js';
import AppError from '../../errors/AppErrorZPRO';
import GetTicketWbot from '../../helpers/GetTicketWbotByIdZPRO';
import { logger } from '../../utils/loggerZPRO';

interface SendGroupVoiceRequest {
  media: string;
  whatsappId: number;
  groupId: string;
}

const SendGroupVoice = async ({
  media,
  whatsappId,
  groupId
}: SendGroupVoiceRequest): Promise<any> => {
  const wbot = await GetTicketWbot(whatsappId);

  try {
    const mediaMessage = await MessageMedia.fromUrl(media);
    
    const sentMessage = await wbot.sendMessage(
      `${groupId.replace(/\D/g, '')}@g.us`,
      mediaMessage,
      {
        sendAudioAsVoice: true
      }
    );

    return sentMessage;

  } catch (error) {
    logger.info(`::: ZDG ::: Z-PRO ::: Comunidade ZDG - ERR_SEND_VOICE_WAPP_GROUP: ${error}`);
    throw new AppError('ERR_SEND_VOICE_WAPP_GROUP');
  }
};

export default SendGroupVoice; 