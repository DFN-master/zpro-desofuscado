import { WhatsappZPRO } from '../models/WhatsappZPRO';
import AppErrorZPRO from '../errors/AppErrorZPRO';

interface WhatsAppFilter {
  tenantId: number | string;
  type?: string;
  id?: number;
  status?: string;
}

const GetDefaultWhatsApp = async (
  tenantId?: number | string,
  whatsappId?: number
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

  let whatsapp = await WhatsappZPRO.findOne({
    where: whereCondition
  });

  // Se não encontrar um WhatsApp conectado, tenta encontrar qualquer um
  if (!whatsapp) {
    whatsapp = await WhatsappZPRO.findOne({
      where: {
        tenantId,
        status: "CONNECTED"
      }
    });
  }

  // Se ainda não encontrar e não tiver tenantId, lança erro
  if (!whatsapp || !tenantId) {
    throw new AppErrorZPRO("ERR_NO_DEF_WAPP_FOUND");
  }

  return whatsapp;
};

export default GetDefaultWhatsApp; 