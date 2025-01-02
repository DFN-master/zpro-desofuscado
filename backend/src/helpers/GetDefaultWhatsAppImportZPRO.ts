import { WhatsappZPRO } from '../models/WhatsappZPRO';
import AppErrorZPRO from '../errors/AppErrorZPRO';

interface WhereCondition {
  tenantId: number;
  status?: string;
  type?: string;
  id?: number;
}

/**
 * Busca o WhatsApp padrão para um tenant específico
 * @param tenantId - ID do tenant
 * @param whatsappId - ID opcional do WhatsApp específico
 * @returns Promise com o WhatsApp encontrado
 */
const GetDefaultWhatsApp = async (
  tenantId: number,
  whatsappId?: number
): Promise<WhatsappZPRO> => {
  const whereCondition: WhereCondition = {
    tenantId,
    status: 'CONNECTED'
  };

  // Se whatsappId foi fornecido, adiciona ao where
  if (whatsappId) {
    whereCondition.id = whatsappId;
  } else {
    whereCondition.type = 'waba';
  }

  // Tenta encontrar primeiro WhatsApp
  let whatsapp = await WhatsappZPRO.findOne({
    where: whereCondition
  });

  // Se não encontrou, tenta buscar WhatsApp do tipo baileys
  if (!whatsapp) {
    whatsapp = await WhatsappZPRO.findOne({
      where: {
        tenantId,
        type: 'baileys'
      }
    });
  }

  // Se ainda não encontrou, tenta buscar WhatsApp do tipo whatsapp
  if (!whatsapp) {
    whatsapp = await WhatsappZPRO.findOne({
      where: {
        tenantId,
        type: 'whatsapp',
        status: 'CONNECTED'
      }
    });
  }

  // Se não encontrou nenhum WhatsApp ou não foi fornecido tenantId, lança erro
  if (!whatsapp || !tenantId) {
    throw new AppErrorZPRO('ERR_NO_DEF_WAPP_FOUND 2');
  }

  return whatsapp;
};

export default GetDefaultWhatsApp; 