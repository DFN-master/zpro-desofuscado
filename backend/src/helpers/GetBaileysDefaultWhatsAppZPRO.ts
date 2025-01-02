import { WhatsappZPRO } from '../models/WhatsappZPRO';
import { AppErrorZPRO } from '../errors/AppErrorZPRO';

interface WhatsAppFilter {
  tenantId: string;
  type?: string;
  id?: string;
  status?: string;
}

const GetBaileysDefaultWhatsApp = async (
  tenantId: string,
  whatsappId?: string
): Promise<WhatsappZPRO> => {
  const whereCondition: WhatsAppFilter = {
    tenantId,
    type: "baileys"
  };

  if (whatsappId) {
    whereCondition.id = whatsappId;
  } else {
    whereCondition.status = "CONNECTED";
  }

  const whatsapp = await WhatsappZPRO.findOne({
    where: whereCondition
  });

  if (!whatsapp || !tenantId) {
    throw new AppErrorZPRO("ERR_NO_DEF_WAPP_FOUND");
  }

  return whatsapp;
};

export default GetBaileysDefaultWhatsApp; 