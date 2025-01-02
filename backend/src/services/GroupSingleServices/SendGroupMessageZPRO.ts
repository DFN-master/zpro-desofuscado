import AppError from '../../errors/AppErrorZPRO';
import GetTicketWbotById from '../../helpers/GetTicketWbotByIdZPRO';
import { logger } from '../../utils/loggerZPRO';
import { WAMessage } from '@whiskeysockets/baileys';

interface SendGroupMessageData {
  message: string;
  whatsappId: number;
  groupId: string;
}

const SendGroupMessage = async ({
  message,
  whatsappId,
  groupId
}: SendGroupMessageData): Promise<WAMessage> => {
  const wbot = await GetTicketWbotById(whatsappId);

  try {
    const formattedGroupId = `${groupId.replace(/\D/g, '')}@g.us`;
    const sentMessage = await wbot.sendMessage(formattedGroupId, message);
    return sentMessage;
  } catch (err) {
    logger.info(`::: Z-PRO ::: ZDG ::: Comunidade ZDG - ERR_SEND_MESSAGE_WAPP_GROUP: ${err}`);
    throw new AppError('ERR_SEND_MESSAGE_WAPP_GROUP');
  }
};

export default SendGroupMessage; 