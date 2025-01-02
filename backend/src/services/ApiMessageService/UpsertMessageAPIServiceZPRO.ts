import { Error } from 'sequelize';
import ApiMessageZPRO from '../../models/ApiMessageZPRO';

interface UpsertMessageParams {
  sessionId: string;
  messageId: string;
  body: string;
  ack: number;
  number: string;
  mediaName?: string;
  mediaUrl?: string;
  timestamp: number;
  externalKey?: string;
  messageWA: any; // Tipo específico do WhatsApp pode ser definido aqui
  apiConfig: any; // Tipo específico da configuração da API pode ser definido aqui
  tenantId: number;
}

const UpsertMessageAPIService = async ({
  sessionId,
  messageId,
  body,
  ack,
  number,
  mediaName,
  mediaUrl,
  timestamp,
  externalKey,
  messageWA,
  apiConfig,
  tenantId
}: UpsertMessageParams): Promise<ApiMessageZPRO> => {
  let message: ApiMessageZPRO;

  // Procura por mensagem existente
  const existingMessage = await ApiMessageZPRO.findOne({
    where: {
      messageId,
      tenantId
    }
  });

  if (existingMessage) {
    // Atualiza mensagem existente
    await existingMessage.update({
      sessionId,
      messageId,
      body,
      ack,
      number,
      mediaName,
      mediaUrl,
      timestamp,
      externalKey,
      messageWA,
      apiConfig,
      tenantId
    });
    message = await existingMessage.reload();
  } else {
    // Cria nova mensagem
    message = await ApiMessageZPRO.create({
      sessionId,
      messageId, 
      body,
      ack,
      number,
      mediaName,
      mediaUrl,
      timestamp,
      externalKey,
      messageWA,
      apiConfig,
      tenantId
    });
  }

  if (!message) {
    throw new Error('ERR_CREATING_MESSAGE');
  }

  return message;
};

export default UpsertMessageAPIService; 