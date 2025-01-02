import { MessageMedia } from 'whatsapp-web.js';
import AppError from '../../errors/AppErrorZPRO';
import GetTicketWbot from '../../helpers/GetTicketWbotByIdZPRO';
import logger from '../../utils/loggerZPRO';
import GroupChat from 'whatsapp-web.js/src/structures/GroupChat';
import { getWbotBaileys } from '../../libs/wbot-baileysZPRO';
import Whatsapp from '../../models/WhatsappZPRO';

interface ChangeGroupPictureRequest {
  file: string;
  wppId: string;
  groupId: string;
}

const ChangeGroupPicture = async ({
  file,
  wppId,
  groupId
}: ChangeGroupPictureRequest): Promise<void> => {
  // Busca a conexão do WhatsApp
  const whatsapp = await Whatsapp.findOne({
    where: {
      id: wppId
    }
  });

  // Verifica se é uma conexão Baileys
  if (whatsapp?.type === "baileys") {
    const wbot = await getWbotBaileys(wppId);
    
    try {
      await wbot.updateProfilePicture(groupId, {
        url: file
      });
    } catch (err) {
      logger.error(`ERR_CHANGING_WAPP_GROUP: ${err}`);
      throw new AppError("ERR_CHANGING_WAPP_GROUP_PICTURE");
    }
  } else {
    // Caso seja WhatsApp Web
    const wbot = await GetTicketWbot(wppId);
    
    try {
      let media = MessageMedia.fromFilePath(file);
      const chat = await wbot.getChatById(groupId);

      if (chat instanceof GroupChat) {
        await chat.setPicture(media);
      } else {
        throw new AppError("ERR_CHANGING_WAPP_GROUP_PICTURE");
      }
    } catch (err) {
      logger.error(`ERR_CHANGING_WAPP_GROUP: ${err}`);
      throw new AppError("ERR_CHANGING_WAPP_GROUP_PICTURE"); 
    }
  }
};

export default ChangeGroupPicture; 