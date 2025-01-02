import AppError from '../../errors/AppErrorZPRO';
import ApiConfig from '../../models/ApiConfigZPRO';
import { logger } from '../../utils/loggerZPRO';
import Setting from '../../models/SettingZPRO';
import request from 'request';

interface UpdateApiConfigData {
  name: string;
  sessionId: string;
  urlServiceStatus: string;
  urlMessageStatus: string;
  userId: number;
  authToken: string;
  isActive: boolean;
}

interface UpdateApiConfigRequest {
  apiData: UpdateApiConfigData;
  apiId: number;
  tenantId: number;
}

interface WebhookData {
  method: string;
  url: string;
  tenantId: number;
}

const sendWebhookNotification = async (
  name: string,
  tenantId: number,
  apiConfig: any
): Promise<void> => {
  // Buscar configuração de webhook ativa
  const webhookEnabled = await Setting.findOne({
    where: {
      key: 'webhook',
      tenantId
    }
  });

  if (webhookEnabled && webhookEnabled.value === 'enabled') {
    try {
      // Verificar se webhook está habilitado para api
      const webhookApi = await Setting.findOne({
        where: {
          key: 'webhookApi',
          tenantId
        }
      });

      if (webhookApi && webhookApi.value === 'enabled') {
        // Buscar URL do webhook
        const webhookUrl = await Setting.findOne({
          where: {
            key: 'webhookUrl',
            tenantId
          }
        });

        if (webhookUrl) {
          const method = 'POST';
          const payload = {
            method,
            url: name,
            tenantId
          };

          const options = {
            method: 'POST',
            url: webhookUrl.value,
            headers: {
              'Content-Type': 'application/json'
            },
            json: payload
          };

          request(options, (error, response) => {
            if (error) {
              throw new Error(error.message);
            } else {
              logger.info('::: Z-PRO ::: Webhook enviado com sucesso.');
            }
          });
        } else {
          logger.info('::: Z-PRO ::: Configuração \'webhookUrl\' não encontrada para a api.');
        }
      } else {
        logger.info('::: Z-PRO ::: Webhook não está habilitada para a api');
      }
    } catch (error) {
      logger.info('::: Z-PRO ::: enviarWebhook error: ', error);
    }
  }
};

const UpdateApiConfigService = async ({
  apiData,
  apiId,
  tenantId
}: UpdateApiConfigRequest): Promise<any> => {
  const apiConfig = await ApiConfig.findOne({
    where: {
      id: apiId,
      tenantId
    }
  });

  if (!apiConfig) {
    throw new AppError('ERR_API_CONFIG_NOT_FOUND', 404);
  }

  const {
    name,
    sessionId,
    urlServiceStatus,
    urlMessageStatus,
    userId,
    authToken,
    isActive
  } = apiData;

  await apiConfig.update({
    name,
    sessionId,
    urlServiceStatus,
    urlMessageStatus,
    userId,
    authToken,
    isActive
  });

  try {
    await sendWebhookNotification(name, tenantId, apiConfig);
  } catch (error) {
    logger.warn('::: Z-PRO ::: Ocorreu um erro:', error);
  }

  await apiConfig.reload();
  return apiConfig;
};

export default UpdateApiConfigService; 