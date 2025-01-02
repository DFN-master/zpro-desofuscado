import { WASocket } from '@whiskeysockets/baileys';
import GetDefaultWhatsAppZPRO from '../../helpers/GetDefaultWhatsAppZPRO';
import { getWbot } from '../../libs/wbotZPRO';
import { logger } from '../../utils/loggerZPRO';

interface WhatsAppData {
  id: number;
}

const CheckIsValidContact = async (
  number: string,
  tenantId: number
): Promise<boolean | undefined> => {
  try {
    const whatsapp: WhatsAppData = await GetDefaultWhatsAppZPRO(tenantId);
    const wbot: WASocket = getWbot(whatsapp.id);

    try {
      const isValidNumber = await wbot.getNumberId(number);
      
      if (!isValidNumber) {
        logger.warn('Z-PRO ::: ZDG ::: invalidNumber');
        return false;
      }

      return true;
    } catch (error) {
      logger.warn(`::: ZDG ::: Z-PRO ::: CheckIsValidContact | Error: ${error}`);
      return false;
    }
  } catch (error) {
    logger.error(`Error in CheckIsValidContact: ${error}`);
    return undefined;
  }
};

export default CheckIsValidContact; 